// ── Lever Job Page Scraper ────────────────────────────────────────────────────
// Targets: https://jobs.lever.co/COMPANY/JOB_ID

const scrapeLever = () => {
  try {
    // Job title
    const role =
      document.querySelector('h2[data-qa="posting-name"]')?.innerText?.trim() ||
      document.querySelector('.posting-headline h2')?.innerText?.trim() ||
      document.querySelector('h2')?.innerText?.trim() ||
      '';

    // Company — Lever URLs follow: jobs.lever.co/COMPANY/uuid
    // Also often shown in page header
    const company =
      document.querySelector('.main-header-logo img')?.alt?.trim() ||
      document.querySelector('header img[alt]')?.alt?.trim() ||
      (() => {
        const match = window.location.pathname.match(/^\/([^/]+)/);
        return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
      })() ||
      '';

    // Location
    const location =
      document.querySelector('[data-qa="location"]')?.innerText?.trim() ||
      document.querySelector('.sort-by-location')?.innerText?.trim() ||
      document.querySelector('.posting-categories .sort-by-location')?.innerText?.trim() ||
      '';

    // Work type (Remote / Hybrid)
    const workType =
      document.querySelector('[data-qa="workplace-type"]')?.innerText?.trim() ||
      document.querySelector('.sort-by-commitment')?.innerText?.trim() ||
      '';

    return {
      company,
      role,
      location: [location, workType].filter(Boolean).join(' · ') || '',
      salary: '',
      jobLink: window.location.href,
    };
  } catch {
    return null;
  }
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'GET_JOB_DATA') {
    sendResponse(scrapeLever());
  }
  return true;
});
