const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getAuthUrl,
  handleCallback,
  getStatus,
  triggerScan,
  disconnect,
} = require('../controllers/gmailController');

const router = express.Router();

// All routes require authentication except the OAuth callback
// (callback uses state param to identify user since no JWT in redirect)

router.get('/auth-url',    protect, getAuthUrl);
router.get('/callback',             handleCallback); // Google redirects here — no JWT yet
router.get('/status',      protect, getStatus);
router.post('/scan',       protect, triggerScan);
router.delete('/disconnect', protect, disconnect);

module.exports = router;
