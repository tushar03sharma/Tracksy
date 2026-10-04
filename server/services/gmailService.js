const { google } = require('googleapis');
const Job = require('../models/Job');
const User = require('../models/User');

// ── OAuth2 Client ─────────────────────────────────────────────────────────────
const getOAuth2Client = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

// ── Token Refresh ─────────────────────────────────────────────────────────────
// Refreshes access token if expired, persists updated tokens to DB
const getAuthenticatedClient = async (user) => {
  const fullUser = await User.findById(user._id).select(
    '+gmailAccessToken +gmailRefreshToken +gmailTokenExpiry'
  );

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: fullUser.gmailAccessToken,
    refresh_token: fullUser.gmailRefreshToken,
    expiry_date: fullUser.gmailTokenExpiry?.getTime(),
  });

  // Auto-refresh if token is expired or expiring within 5 minutes
  const isExpired =
    !fullUser.gmailTokenExpiry ||
    fullUser.gmailTokenExpiry.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired && fullUser.gmailRefreshToken) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    // Persist refreshed tokens
    await User.findByIdAndUpdate(user._id, {
      gmailAccessToken: credentials.access_token,
      gmailTokenExpiry: new Date(credentials.expiry_date),
      ...(credentials.refresh_token && { gmailRefreshToken: credentials.refresh_token }),
    });
  }

  return oauth2Client;
};

// ── Email Keyword Parser ──────────────────────────────────────────────────────
// Returns { newStatus, confidence, matchedKeyword } or null if not job-related
const parseJobSignal = (subject = '', snippet = '', from = '') => {
  const text = `${subject} ${snippet}`.toLowerCase();

  const patterns = [
    // Offer — check first (highest value, most specific)
    {
      status: 'Offer',
      confidence: 'high',
      keywords: [
        'pleased to offer', 'offer letter', 'job offer', 'employment offer',
        'we would like to offer', 'formal offer', 'offer of employment',
      ],
    },
    // Rejection
    {
      status: 'Rejected',
      confidence: 'high',
      keywords: [
        'unfortunately', 'not moving forward', 'will not be moving forward',
        'other candidates', 'not selected', 'position has been filled',
        'decided not to proceed', 'not be progressing', 'regret to inform',
        'we have decided', 'not a match', 'not be moving forward',
      ],
    },
    // Interview
    {
      status: 'Interview',
      confidence: 'high',
      keywords: [
        'interview invitation', 'interview request', 'schedule an interview',
        'schedule a call', 'schedule a meeting', 'schedule time with',
        'invite you to interview', 'next steps', 'speak with our team',
        'technical interview', 'phone screen', 'video interview',
        'zoom interview', 'google meet interview', 'hiring manager',
      ],
    },
    // Online Assessment
    {
      status: 'OA',
      confidence: 'high',
      keywords: [
        'online assessment', 'coding challenge', 'hackerrank', 'codility',
        'take-home assignment', 'technical assessment', 'coding test',
        'codesignal', 'karat', 'qualified.io', 'pymetrics',
      ],
    },
    // Applied confirmation — lowest priority
    {
      status: 'Applied',
      confidence: 'low',
      keywords: [
        'application received', 'thank you for applying', 'application submitted',
        'we received your application', 'application confirmation',
        'successfully applied', 'applied to',
      ],
    },
  ];

  for (const pattern of patterns) {
    const matched = pattern.keywords.find((kw) => text.includes(kw));
    if (matched) {
      return {
        newStatus: pattern.status,
        confidence: pattern.confidence,
        matchedKeyword: matched,
      };
    }
  }

  return null; // Not a recognizable job email
};

// ── Extract Company Name from From Address ────────────────────────────────────
// e.g. "recruiting@google.com" → "google", "jobs@greenhouse.io" → (skip)
const extractCompanyFromEmail = (from = '') => {
  const emailMatch = from.match(/<(.+?)>/) || from.match(/(\S+@\S+)/);
  if (!emailMatch) return null;
  const email = emailMatch[1];
  const domain = email.split('@')[1];
  if (!domain) return null;

  // Filter out known ATS/job board domains — these won't help us match
  const genericDomains = [
    'greenhouse.io', 'lever.co', 'workday.com', 'icims.com',
    'taleo.net', 'bamboohr.com', 'smartrecruiters.com', 'jobvite.com',
    'myworkdayjobs.com', 'indeed.com', 'linkedin.com', 'glassdoor.com',
    'noreply.com', 'notifications.com', 'mail.com',
  ];

  if (genericDomains.some((d) => domain.includes(d))) return null;

  // Return the primary domain name (e.g. "google" from "google.com")
  return domain.split('.')[0].toLowerCase();
};

// ── Fuzzy Match Company to Job ────────────────────────────────────────────────
// Finds the best matching job for the given company name hint
const matchJobByCompany = async (userId, companyHint) => {
  if (!companyHint) return null;

  const jobs = await Job.find({ user: userId });
  if (!jobs.length) return null;

  // Exact substring match first
  let best = jobs.find((j) =>
    j.company.toLowerCase().includes(companyHint) ||
    companyHint.includes(j.company.toLowerCase().slice(0, 4))
  );

  return best || null;
};

// ── Decode Base64url Email Body ───────────────────────────────────────────────
const decodeBody = (encoded = '') => {
  try {
    return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

// ── Extract Plain Text from Gmail Message ────────────────────────────────────
const extractTextFromMessage = (payload) => {
  if (!payload) return '';

  // Direct body
  if (payload.body?.data) return decodeBody(payload.body.data);

  // Multipart — prefer text/plain, fall back to text/html
  if (payload.parts) {
    const plain = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (plain?.body?.data) return decodeBody(plain.body.data);

    const html = payload.parts.find((p) => p.mimeType === 'text/html');
    if (html?.body?.data) return decodeBody(html.body.data).replace(/<[^>]+>/g, ' ');

    // Nested multipart
    for (const part of payload.parts) {
      const nested = extractTextFromMessage(part);
      if (nested) return nested;
    }
  }

  return '';
};

// ── Fetch and Process New Emails for a User ───────────────────────────────────
const processUserEmails = async (user) => {
  try {
    const auth = await getAuthenticatedClient(user);
    const gmail = google.gmail({ version: 'v1', auth });

    let messages = [];

    if (user.gmailHistoryId) {
      // Incremental fetch using history API
      try {
        const historyRes = await gmail.users.history.list({
          userId: 'me',
          startHistoryId: user.gmailHistoryId,
          historyTypes: ['messageAdded'],
        });

        const history = historyRes.data.history || [];
        messages = history.flatMap((h) => h.messagesAdded?.map((m) => m.message) || []);
      } catch (err) {
        // History expired — fall back to recent messages
        if (err.code === 404) {
          const listRes = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 20,
            q: 'subject:(application OR interview OR offer OR assessment OR rejected) newer_than:7d',
          });
          messages = listRes.data.messages || [];
        } else throw err;
      }
    } else {
      // First-time scan — last 30 days, job-related subjects
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 50,
        q: 'subject:(application OR interview OR offer OR assessment OR rejected) newer_than:30d',
      });
      messages = listRes.data.messages || [];
    }

    const updates = [];

    for (const msgRef of messages) {
      try {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: msgRef.id,
          format: 'full',
        });

        const headers = msg.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === 'Subject')?.value || '';
        const from = headers.find((h) => h.name === 'From')?.value || '';
        const snippet = msg.data.snippet || '';
        const body = extractTextFromMessage(msg.data.payload);

        const signal = parseJobSignal(subject, body || snippet, from);
        if (!signal) continue;

        const companyHint = extractCompanyFromEmail(from);
        const job = await matchJobByCompany(user._id, companyHint);
        if (!job) continue;

        // Skip if status is already at this level or higher in funnel
        const statusOrder = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'];
        const currentIdx = statusOrder.indexOf(job.status);
        const newIdx = statusOrder.indexOf(signal.newStatus);

        // Always allow Rejected/Offer; otherwise only advance forward
        const shouldUpdate =
          signal.newStatus === 'Rejected' ||
          signal.newStatus === 'Offer' ||
          newIdx > currentIdx;

        if (!shouldUpdate) continue;

        // Update job status and append to history
        const noteText = `Auto-detected from email: "${subject.slice(0, 120)}"`;
        await Job.findByIdAndUpdate(job._id, {
          status: signal.newStatus,
          $push: {
            statusHistory: {
              status: signal.newStatus,
              changedAt: new Date(),
              source: 'email',
              note: noteText,
            },
          },
        });

        updates.push({ jobId: job._id, company: job.company, newStatus: signal.newStatus });
      } catch (msgErr) {
        console.warn(`[Gmail] Error processing message ${msgRef.id}:`, msgErr.message);
      }
    }

    // Update user's history cursor and last-checked time
    try {
      const profileRes = await gmail.users.getProfile({ userId: 'me' });
      await User.findByIdAndUpdate(user._id, {
        gmailHistoryId: profileRes.data.historyId,
        gmailLastChecked: new Date(),
      });
    } catch { /* non-fatal */ }

    return updates;
  } catch (err) {
    console.error(`[Gmail] Failed to process emails for user ${user._id}:`, err.message);

    // If auth fails, mark Gmail as disconnected
    if (err.code === 401 || err.message?.includes('invalid_grant')) {
      await User.findByIdAndUpdate(user._id, {
        gmailConnected: false,
        gmailAccessToken: null,
        gmailRefreshToken: null,
      });
    }

    return [];
  }
};

module.exports = { getOAuth2Client, processUserEmails, parseJobSignal };
