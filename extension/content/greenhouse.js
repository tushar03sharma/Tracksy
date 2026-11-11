// ── Greenhouse Job Page Scraper ───────────────────────────────────────────────
// Targets: https://*.greenhouse.io/jobs/* and https://boards.greenhouse.io/*

const scrapeGreenhouse = () => {
  try {
    // Job title — Greenhouse uses a consistent h1#app-title or .app-title
    const role =
      document.querySelector('h1#app-title')?.innerText?.trim() ||
      document.querySelector('h1.app-title')?.innerText?.trim() ||
      document.querySelector('h1')?.innerText?.trim() ||
      '';

    // Company — usually in the page header or meta tags
    const company =
      document.querySelector('.company-name')?.innerText?.trim() ||
      document.querySelector('meta[property="og:site_name"]')?.content?.trim() ||
      document.querySelector('header .logo')?.title?.trim() ||
      // Extract from URL: boards.greenhouse.io/COMPANY/jobs/123
      (() => {
        const match = window.location.pathname.match(/^\/([^/]+)\//);
        return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
      })() ||
      '';

    // Location
    const location =
      document.querySelector('.location')?.innerText?.trim() ||
      document.querySelector('[data-qa="location"]')?.innerText?.trim() ||
      document.querySelector('.job-location')?.innerText?.trim() ||
      '';

    return {
      company,
      role,
      location,
      salary: '',
      jobLink: window.location.href,
    };
  } catch {
    return null;
  }
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'GET_JOB_DATA') {
    sendResponse(scrapeGreenhouse());
  }
  return true;
});
