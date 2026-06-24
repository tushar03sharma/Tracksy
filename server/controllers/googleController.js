// This controller runs AFTER passport has verified the Google user
// req.user is already populated by passport at this point

// GET /api/auth/google/callback  (called by passport after Google redirects back)
const googleCallback = (req, res) => {
  try {
    // Generate our own JWT — from here on, auth works exactly like email/password
    const token = req.user.generateToken();

    // Redirect to the frontend callback page with the token in the URL
    // The React page will read it, store it, and redirect to dashboard
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
  }
};

module.exports = { googleCallback };
