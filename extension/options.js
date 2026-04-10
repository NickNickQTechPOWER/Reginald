const DEFAULT_RULES = [
  { id: 1, category: 'Injection',    pattern: 'ignore\\s+(all\\s+)?previous\\s+instructions', builtin: true },
  { id: 2, category: 'Injection',    pattern: 'new\\s+task\\s*:',                             builtin: true },
  { id: 3, category: 'Injection',    pattern: 'system\\s*:',                                   builtin: true },
  { id: 4, category: 'Injection',    pattern: 'you\\s+are\\s+now',                             builtin: true },
  { id: 5, category: 'PII',          pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',                   builtin: true },
  { id: 6, category: 'PII',          pattern: '\\b(?:4[0-9]{12}|5[1-5][0-9]{14})\\b',         builtin: true },
  { id: 7, category: 'Exfiltration', pattern: 'extract\\s+and\\s+send',                        builtin: true },
  { id: 8, category: 'Exfiltration', pattern: '\\bexfiltrate\\b',                              builtin: true },
];

let customRules = [];
let nextId = 100;

// ── API key show/hide ─────────────────────────────────────────────────────────
const apiKeyInput = document.getElementById('api-key');
const btnShow     = document.getElementById('btn-show-key');

btnShow.addEventListener('click', () => {
  const showing = apiKeyInput.type === 'text';
  apiKeyInput.type = showing ? 'password' : 'text';
  btnShow.textContent = showing ? 'Show' : 'Hide';
});

// ── Rules rendering ───────────────────────────────────────────────────────────
function renderRules() {
  const list = document.getElementById('rules-list');
  const allRules = [...DEFAULT_RULES, ...customRules];

  if (allRules.length === 0) {
    list.innerHTML = '<div style="padding:14px 18px; color:#6b7280; font-size:13px;">No rules. Add one below.</div>';
    return;
  }

  list.innerHTML = allRules.map(rule => `
    <div class="rule-row" data-id="${rule.id}">
      <span class="rule-cat ${rule.category}">${rule.category}</span>
      <span class="rule-pattern" title="${rule.pattern}">${rule.pattern}</span>
      ${rule.builtin
        ? '<span style="font-size:11px; color:#4b5563; flex-shrink:0;">built-in</span>'
        : `<button class="rule-del" data-id="${rule.id}" title="Delete">✕</button>`
      }
    </div>
  `).join('');

  list.querySelectorAll('.rule-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      customRules = customRules.filter(r => r.id !== id);
      renderRules();
    });
  });
}

// ── Add rule ──────────────────────────────────────────────────────────────────
document.getElementById('btn-add-rule').addEventListener('click', () => {
  const patternInput = document.getElementById('new-rule-pattern');
  const catInput     = document.getElementById('new-rule-cat');
  const pattern      = patternInput.value.trim();

  if (!pattern) return;

  try {
    new RegExp(pattern);
  } catch {
    patternInput.style.borderColor = '#ef4444';
    setTimeout(() => patternInput.style.borderColor = '', 1500);
    return;
  }

  customRules.push({ id: nextId++, category: catInput.value, pattern, builtin: false });
  patternInput.value = '';
  renderRules();
});

document.getElementById('new-rule-pattern').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-add-rule').click();
});

// ── Account (login / logout) ──────────────────────────────────────────────────
const BACKEND = 'https://reginald.ai';

function showAccountState(email) {
  const loggedIn  = document.getElementById('account-logged-in');
  const loggedOut = document.getElementById('account-logged-out');
  if (email) {
    document.getElementById('account-email').textContent = email;
    loggedIn.style.display  = 'block';
    loggedOut.style.display = 'none';
  } else {
    loggedIn.style.display  = 'none';
    loggedOut.style.display = 'block';
  }
}

document.getElementById('btn-login').addEventListener('click', async () => {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('btn-login');
  errEl.style.display = 'none';
  btn.textContent = 'Signing in…';
  btn.disabled = true;
  try {
    const res  = await fetch(`${BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed'; errEl.style.display = 'block'; return; }
    // Store the JWT token (returned in the response body)
    const token = data.token;
    await chrome.storage.sync.set({ auth_token: token, auth_email: email });
    showAccountState(email);
  } catch {
    errEl.textContent = 'Network error — is the server reachable?';
    errEl.style.display = 'block';
  } finally {
    btn.textContent = 'Sign in';
    btn.disabled = false;
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  await chrome.storage.sync.remove(['auth_token', 'auth_email']);
  showAccountState(null);
});

// ── Load settings ─────────────────────────────────────────────────────────────
async function load() {
  const data = await chrome.storage.sync.get(['api_key', 'shield_enabled', 'tos_enabled', 'custom_rules', 'auth_email']);

  document.getElementById('api-key').value          = data.api_key        || '';
  document.getElementById('toggle-shield').checked  = data.shield_enabled !== false;
  document.getElementById('toggle-tos').checked     = data.tos_enabled    !== false;

  customRules = data.custom_rules || [];
  nextId = customRules.length > 0 ? Math.max(...customRules.map(r => r.id)) + 1 : 100;

  showAccountState(data.auth_email || null);
  renderRules();
}

// ── Save ──────────────────────────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', async () => {
  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  await chrome.storage.sync.set({
    api_key:        document.getElementById('api-key').value.trim(),
    shield_enabled: document.getElementById('toggle-shield').checked,
    tos_enabled:    document.getElementById('toggle-tos').checked,
    custom_rules:   customRules,
  });

  btn.disabled = false;
  btn.textContent = 'Save Settings';

  const feedback = document.getElementById('save-feedback');
  feedback.style.display = 'block';
  setTimeout(() => feedback.style.display = 'none', 2500);
});

load();
