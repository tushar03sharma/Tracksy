// ── Generic Job Page Scraper ──────────────────────────────────────────────────
// Fallback for any job page — uses structured data (JSON-LD) and meta tags
// Only runs on pages NOT already handled by specific content scripts

const isAlreadyHandled = () => {
  const url = window.location.href;
  return (
    url.includes('linkedin.com/jobs') ||
    url.includes('greenhouse.io') ||
    url.includes('jobs.lever.co')
  );
};

const scrapeGeneric = () => {
  if (isAlreadyHandled()) return null;

  try {
    let company = '', role = '', location = '', salary = '';

    // 1. Try JSON-LD structured data (Google's job schema — many sites implement this)
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        const jobData = Array.isArray(data) ? data.find((d) => d['@type'] === 'JobPosting') : data;

        if (jobData?.['@type'] === 'JobPosting') {
          role    = jobData.title || '';
          company = jobData.hiringOrganization?.name || '';
          location = typeof jobData.jobLocation === 'string'
            ? jobData.jobLocation
            : jobData.jobLocation?.address?.addressLocality || '';
          salary  = jobData.baseSalary?.value?.value
            ? `${jobData.baseSalary.value.minValue || ''}–${jobData.baseSalary.value.maxValue || ''}`
            : '';
          break;
        }
      } catch { /* malformed JSON-LD — skip */ }
    }

    // 2. Fall back to Open Graph meta tags
    if (!role) {
      role = document.querySelector('meta[property="og:title"]')?.content?.trim() ||
             document.querySelector('meta[name="title"]')?.content?.trim() ||
             document.title?.trim() ||
             '';
    }

    if (!company) {
      company = document.querySelector('meta[property="og:site_name"]')?.content?.trim() ||
                document.querySelector('meta[name="author"]')?.content?.trim() ||
                '';
    }

    // 3. Try common job-page heading selectors as last resort
    if (!role) {
      role = document.querySelector('h1.job-title, h1.title, h1.position-title, h1')?.innerText?.trim() || '';
    }

    // Clean up page title if used as role (remove " at Company" suffix)
    if (role && company && role.toLowerCase().includes(` at ${company.toLowerCase()}`)) {
      role = role.replace(new RegExp(` at ${company}`, 'i'), '').trim();
    }

    return { company, role, location, salary, jobLink: window.location.href };
  } catch {
    return null;
  }
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'GET_JOB_DATA') {
    sendResponse(scrapeGeneric());
  }
  return true;
});
