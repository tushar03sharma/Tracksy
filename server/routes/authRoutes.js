const express = require('express');
const passport = require('passport');
const { register, login, getMe } = require('../controllers/authController');
const { googleCallback } = require('../controllers/googleController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, validate } = require('../middleware/validators');

const router = express.Router();

//  Email / Password Auth 
router.post('/register', registerValidation, validate, register);
router.post('/login',    loginValidation,    validate, login);
router.get('/me',        protect,                      getMe);

//  Google OAuth 

// Step 1: Redirect user to Google's consent screen
// scope: we ask Google for the user's profile info and email
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // we use JWT, not sessions
  })
);

// Step 2: Google redirects back here after user approves
// passport verifies the user, then googleCallback generates our JWT
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  googleCallback
);

module.exports = router;
