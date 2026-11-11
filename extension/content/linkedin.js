// ── LinkedIn Job Page Scraper ─────────────────────────────────────────────────
// Targets: https://www.linkedin.com/jobs/view/* and collection pages

const scrapeLinkedIn = () => {
  try {
    // Company name — appears in the job detail pane
    const company =
      document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.innerText?.trim() ||
      document.querySelector('.jobs-unified-top-card__company-name a')?.innerText?.trim() ||
      document.querySelector('[data-test-employer-name]')?.innerText?.trim() ||
      document.querySelector('.topcard__org-name-link')?.innerText?.trim() ||
      '';

    // Job title
    const role =
      document.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.innerText?.trim() ||
      document.querySelector('.jobs-unified-top-card__job-title h1')?.innerText?.trim() ||
      document.querySelector('.topcard__title')?.innerText?.trim() ||
      document.title?.split(' at ')?.[0]?.trim() ||
      '';

    // Location
    const location =
      document.querySelector('.job-details-jobs-unified-top-card__bullet')?.innerText?.trim() ||
      document.querySelector('.jobs-unified-top-card__bullet')?.innerText?.trim() ||
      document.querySelector('.topcard__flavor--bullet')?.innerText?.trim() ||
      '';

    // Salary (not always visible)
    const salary =
      document.querySelector('.jobs-unified-top-card__job-insight span[aria-hidden="false"]')?.innerText?.trim() || '';

    return {
      company,
      role,
      location: location.split('\n')[0], // Take first line only
      salary: salary.includes('$') ? salary : '',
      jobLink: window.location.href,
    };
  } catch {
    return null;
  }
};

// Listen for message from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'GET_JOB_DATA') {
    sendResponse(scrapeLinkedIn());
  }
  return true;
});
