// This controller runs AFTER passport has verified the Google user
// req.user is already populated by passport at this point

// GET /api/auth/google/callback  (called by passport after Google redirects back)
const googleCallback = (req, res) => {
  try {
    console.log('[Google CB] req.user:', req.user ? req.user.email : 'MISSING');
    console.log('[Google CB] CLIENT_URL:', process.env.CLIENT_URL);

    const token = req.user.generateToken();
    const redirectTo = `${process.env.CLIENT_URL}/auth/callback?token=${token}`;

    console.log('[Google CB] redirecting to:', redirectTo);
    res.redirect(redirectTo);
  } catch (err) {
    console.error('[Google CB] error:', err.message);
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
  }
};

module.exports = { googleCallback };
