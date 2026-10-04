const cron = require('node-cron');
const User = require('../models/User');
const { processUserEmails } = require('./gmailService');

// ── Email Poller ──────────────────────────────────────────────────────────────
// Runs every 15 minutes — scans Gmail for all users who have connected their inbox
// Uses node-cron so it restarts automatically if the server restarts

let isRunning = false; // Guard: prevent overlapping runs if processing takes >15 min

const runEmailPollingCycle = async () => {
  if (isRunning) {
    console.log('[EmailPoller] Previous cycle still running — skipping.');
    return;
  }

  isRunning = true;
  console.log(`[EmailPoller] Starting cycle at ${new Date().toISOString()}`);

  try {
    // Fetch only users with Gmail connected, select token fields explicitly
    const users = await User.find({ gmailConnected: true }).select(
      '+gmailAccessToken +gmailRefreshToken +gmailTokenExpiry gmailHistoryId gmailLastChecked'
    );

    if (!users.length) {
      console.log('[EmailPoller] No connected Gmail users found — idle.');
      return;
    }

    console.log(`[EmailPoller] Processing ${users.length} user(s)...`);

    // Process users sequentially to avoid hammering Gmail API
    for (const user of users) {
      const updates = await processUserEmails(user);
      if (updates.length) {
        console.log(
          `[EmailPoller] Updated ${updates.length} job(s) for user ${user.email}:`,
          updates.map((u) => `${u.company} → ${u.newStatus}`).join(', ')
        );
      }
    }
  } catch (err) {
    console.error('[EmailPoller] Cycle error:', err.message);
  } finally {
    isRunning = false;
    console.log(`[EmailPoller] Cycle complete at ${new Date().toISOString()}`);
  }
};

// ── Start the Cron ────────────────────────────────────────────────────────────
const startEmailPoller = () => {
  // Run immediately on server start (after a short delay for DB to connect)
  setTimeout(() => {
    runEmailPollingCycle();
  }, 10_000);

  // Then every 15 minutes: minute */15, any hour, any day
  cron.schedule('*/15 * * * *', () => {
    runEmailPollingCycle();
  });

  console.log('[EmailPoller] Started — scanning Gmail every 15 minutes.');
};

// Export for manual trigger via API
module.exports = { startEmailPoller, runEmailPollingCycle };
