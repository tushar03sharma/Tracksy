// ── Service Worker ────────────────────────────────────────────────────────────
// MV3 background service worker — handles messaging between popup and content scripts

// Listen for install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Tracksy Extension] Installed.');
});

// Relay messages between popup and content scripts if needed
// (Currently content scripts respond directly to popup via chrome.tabs.sendMessage)
// This service worker acts as a fallback relay for future features.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'PING') {
    sendResponse({ status: 'alive' });
  }
  return true;
});
