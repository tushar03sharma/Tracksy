const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Relative path — passport builds the full URL from the live request
      // Avoids any double-slash issues with the GOOGLE_CALLBACK_URL env var
      callbackURL:  '/api/auth/google/callback',
      proxy: true, // required for https on Render (trust proxy)
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // profile.emails[0].value  = user's Google email
        // profile.id               = unique Google user ID
        // profile.displayName      = full name from Google
        // profile.photos[0].value  = profile picture URL

        const email = profile.emails[0].value;

        // Case 1: User already logged in with Google before → just return them
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // Case 2: Email exists but registered with password → link Google to account
        user = await User.findOne({ email });
        if (user) {
          user.googleId     = profile.id;
          user.authProvider = 'google';
          user.avatar       = profile.photos?.[0]?.value || null;
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // Case 3: Brand new user → create their account
        user = await User.create({
          name:         profile.displayName,
          email,
          googleId:     profile.id,
          authProvider: 'google',
          avatar:       profile.photos?.[0]?.value || null,
          // No password — Google handles authentication
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
