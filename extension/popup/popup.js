// ── Popup Controller ─────────────────────────────────────────────────────────
// Manages the three view states: auth → save → success

const $ = (id) => document.getElementById(id);

// Views
const authView    = $('auth-view');
const saveView    = $('save-view');
const successView = $('success-view');

// Auth form
const authForm   = $('auth-form');
const apiUrlInput = $('api-url');
const emailInput  = $('email');
const passInput   = $('password');
const loginBtn    = $('login-btn');
const authError   = $('auth-error');

// Save form
const saveForm    = $('save-form');
const companyInput = $('company');
const roleInput    = $('role');
const locationInput = $('location');
const salaryInput  = $('salary');
const jobLinkInput = $('job-link');
const statusSelect = $('status');
const saveBtn      = $('save-btn');
const saveError    = $('save-error');
const scrapeStatus = $('scrape-status');
const scrapeMsg    = $('scrape-msg');

// Success view
const successTitle = $('success-title');
const successDesc  = $('success-desc');
const saveAnotherBtn = $('save-another-btn');

// Footer
const logoutBtn      = $('logout-btn');
const openTracksyBtn = $('open-tracksy-btn');
const statusDot      = $('status-dot');

// ── State ─────────────────────────────────────────────────────────────────────
let currentApiUrl = '';
let currentToken  = '';

// ── Helpers ───────────────────────────────────────────────────────────────────
const showView = (view) => {
  [authView, saveView, successView].forEach((v) => v.classList.add('hidden'));
  view.classList.remove('hidden');
};

const showError = (el, msg) => {
  el.textContent = msg;
  el.classList.remove('hidden');
};

const hideError = (el) => el.classList.add('hidden');

const setStatusDot = (connected) => {
  statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
  statusDot.title = connected ? 'Signed in to Tracksy' : 'Not signed in';
};

// ── Load saved credentials ────────────────────────────────────────────────────
chrome.storage.local.get(['tracksyToken', 'tracksyApiUrl', 'tracksyUser'], (data) => {
  if (data.tracksyToken && data.tracksyApiUrl) {
    currentToken  = data.tracksyToken;
    currentApiUrl = data.tracksyApiUrl;
    setStatusDot(true);

    // Populate footer
    logoutBtn.classList.remove('hidden');
    openTracksyBtn.classList.remove('hidden');
    openTracksyBtn.href = data.tracksyApiUrl.replace('/api', '');

    // Show save form and trigger scraping
    showView(saveView);
    scrapeCurrentPage();
  } else {
    setStatusDot(false);
    showView(authView);
    // Pre-fill saved API URL if any
    if (data.tracksyApiUrl) apiUrlInput.value = data.tracksyApiUrl;
  }
});

// ── Auth: Login ───────────────────────────────────────────────────────────────
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(authError);

  const apiUrl  = apiUrlInput.value.trim().replace(/\/$/, '');
  const email   = emailInput.value.trim();
  const password = passInput.value;

  if (!apiUrl || !email || !password) {
    return showError(authError, 'Please fill in all fields.');
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed.');

    const token = json.data?.token || json.token;
    const user  = json.data?.user  || json.user;

    chrome.storage.local.set({
      tracksyToken:  token,
      tracksyApiUrl: apiUrl,
      tracksyUser:   user,
    }, () => {
      currentToken  = token;
      currentApiUrl = apiUrl;
      setStatusDot(true);
      logoutBtn.classList.remove('hidden');
      openTracksyBtn.classList.remove('hidden');
      openTracksyBtn.href = apiUrl.replace('/api', '');
      showView(saveView);
      scrapeCurrentPage();
    });
  } catch (err) {
    showError(authError, err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

// ── Scrape current tab ────────────────────────────────────────────────────────
const scrapeCurrentPage = () => {
  scrapeStatus.className = 'scrape-status';
  scrapeMsg.textContent  = 'Detecting job details…';
  jobLinkInput.value = '';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    // Set current URL as fallback job link
    jobLinkInput.value = tab.url;

    // Request scraped data from content script
    chrome.tabs.sendMessage(tab.id, { action: 'GET_JOB_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not injected — generic fallback
        scrapeStatus.className = 'scrape-status warn';
        scrapeMsg.textContent  = '⚠ Could not auto-detect details — fill in manually.';
        return;
      }

      if (response && (response.company || response.role)) {
        companyInput.value  = response.company  || '';
        roleInput.value     = response.role     || '';
        locationInput.value = response.location || '';
        salaryInput.value   = response.salary   || '';
        jobLinkInput.value  = response.jobLink  || tab.url;

        scrapeStatus.className = 'scrape-status ok';
        scrapeMsg.textContent  = '✓ Job details auto-filled from page';
      } else {
        scrapeStatus.className = 'scrape-status warn';
        scrapeMsg.textContent  = '⚠ Fill in details manually';
      }
    });
  });
};

// ── Save Job ──────────────────────────────────────────────────────────────────
saveForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(saveError);

  const company = companyInput.value.trim();
  const role    = roleInput.value.trim();
  if (!company || !role) {
    return showError(saveError, 'Company and Role are required.');
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const payload = {
    company,
    role,
    location: locationInput.value.trim() || undefined,
    salary:   salaryInput.value.trim()   || undefined,
    jobLink:  jobLinkInput.value.trim()  || undefined,
    status:   statusSelect.value,
    notes:    'Saved via Tracksy extension',
  };

  try {
    const res = await fetch(`${currentApiUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save job.');

    // Show success
    successTitle.textContent = 'Job Saved! 🎉';
    successDesc.textContent  = `${company} — ${role} added to Tracksy as "${statusSelect.value}".`;
    showView(successView);

    // Clear form for next save
    saveForm.reset();
  } catch (err) {
    showError(saveError, err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Save to Tracksy`;
  }
});

// ── Save Another ──────────────────────────────────────────────────────────────
saveAnotherBtn.addEventListener('click', () => {
  hideError(saveError);
  showView(saveView);
  scrapeCurrentPage();
});

// ── Logout ────────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', () => {
  chrome.storage.local.remove(['tracksyToken', 'tracksyUser'], () => {
    currentToken = '';
    setStatusDot(false);
    logoutBtn.classList.add('hidden');
    openTracksyBtn.classList.add('hidden');
    showView(authView);
  });
});
