const User = require('../models/User');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getOAuth2Client, processUserEmails } = require('../services/gmailService');

// ── GET /api/gmail/auth-url ───────────────────────────────────────────────────
// Returns the Google OAuth URL with Gmail read scope for the frontend to redirect to
const getAuthUrl = catchAsync(async (req, res) => {
  const oauth2Client = getOAuth2Client();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent', // Always show consent to ensure refresh_token is returned
    state: req.user._id.toString(), // Pass user ID through OAuth state
  });

  res.status(200).json({ status: 'success', data: { url } });
});

// ── GET /api/gmail/callback ───────────────────────────────────────────────────
// Google redirects here after the user approves. Exchange code for tokens & save.
const handleCallback = catchAsync(async (req, res, next) => {
  const { code, state: userId } = req.query;

  if (!code) return next(new AppError('No authorization code received.', 400));

  const oauth2Client = getOAuth2Client();

  let tokens;
  try {
    const { tokens: t } = await oauth2Client.getToken(code);
    tokens = t;
  } catch (err) {
    return next(new AppError('Failed to exchange authorization code.', 400));
  }

  if (!tokens.refresh_token) {
    // refresh_token only comes on first consent — prompt: 'consent' handles this
    return next(
      new AppError(
        'No refresh token received. Please disconnect and reconnect Gmail.',
        400
      )
    );
  }

  // Save tokens to user — only update the Gmail-specific fields
  await User.findByIdAndUpdate(userId, {
    gmailConnected: true,
    gmailAccessToken: tokens.access_token,
    gmailRefreshToken: tokens.refresh_token,
    gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    gmailHistoryId: null, // Reset — full scan on next poll
    gmailLastChecked: null,
  });

  // Redirect to the Gmail settings page with success flag
  res.redirect(`${process.env.CLIENT_URL}/settings/gmail?connected=true`);
});

// ── GET /api/gmail/status ─────────────────────────────────────────────────────
// Returns the current Gmail connection status for the logged-in user
const getStatus = catchAsync(async (req, res) => {
  const user = req.user;

  // Fetch recent auto-updates from jobs (last 20 email-sourced status changes)
  const recentUpdates = await Job.aggregate([
    { $match: { user: user._id } },
    { $unwind: '$statusHistory' },
    { $match: { 'statusHistory.source': 'email' } },
    { $sort: { 'statusHistory.changedAt': -1 } },
    { $limit: 20 },
    {
      $project: {
        company: 1,
        role: 1,
        'statusHistory.status': 1,
        'statusHistory.changedAt': 1,
        'statusHistory.note': 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      connected: user.gmailConnected,
      lastChecked: user.gmailLastChecked,
      recentUpdates,
    },
  });
});

// ── POST /api/gmail/scan ──────────────────────────────────────────────────────
// Manually triggers a Gmail scan for the current user (UI "Scan Now" button)
const triggerScan = catchAsync(async (req, res, next) => {
  if (!req.user.gmailConnected) {
    return next(new AppError('Gmail is not connected.', 400));
  }

  const updates = await processUserEmails(req.user);

  res.status(200).json({
    status: 'success',
    data: {
      message: `Scan complete. ${updates.length} job(s) updated.`,
      updates,
    },
  });
});

// ── DELETE /api/gmail/disconnect ──────────────────────────────────────────────
// Clears all Gmail tokens and marks user as disconnected
const disconnect = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    gmailConnected: false,
    gmailAccessToken: null,
    gmailRefreshToken: null,
    gmailTokenExpiry: null,
    gmailHistoryId: null,
    gmailLastChecked: null,
  });

  res.status(200).json({
    status: 'success',
    data: { message: 'Gmail disconnected successfully.' },
  });
});

module.exports = { getAuthUrl, handleCallback, getStatus, triggerScan, disconnect };
