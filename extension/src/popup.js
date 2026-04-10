// ── Settings link / button ────────────────────────────────────────────────────
document.getElementById('btn-settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById('link-settings')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Load settings and apply toggles ──────────────────────────────────────────
async function loadSettings() {
  const { api_key, shield_enabled, tos_enabled } = await chrome.storage.sync.get([
    'api_key', 'shield_enabled', 'tos_enabled',
  ]);

  document.getElementById('toggle-shield').checked = shield_enabled !== false;
  document.getElementById('toggle-tos').checked    = tos_enabled    !== false;

  if (!api_key) {
    document.getElementById('api-warning').style.display = 'flex';
  }
}

document.getElementById('toggle-shield').addEventListener('change', (e) => {
  chrome.storage.sync.set({ shield_enabled: e.target.checked });
});

document.getElementById('toggle-tos').addEventListener('change', (e) => {
  chrome.storage.sync.set({ tos_enabled: e.target.checked });
});

// ── Load and render alerts ────────────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function kindLabel(alert) {
  if (alert.kind === 'injection') {
    const type = alert.findings?.[0]?.type || 'unknown';
    return type.replace(/[_:]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 40);
  }
  if (alert.kind === 'tos') {
    return `ToS — ${alert.overall_risk || 'Reviewed'}`;
  }
  return alert.kind;
}

async function loadAlerts() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_ALERTS' }, (res) => {
      resolve(res?.alerts || []);
    });
  });
}

async function render() {
  await loadSettings();
  const alerts = await loadAlerts();

  const injections = alerts.filter(a => a.kind === 'injection');
  const tos        = alerts.filter(a => a.kind === 'tos');

  document.getElementById('stat-injections').textContent = injections.length;
  document.getElementById('stat-tos').textContent        = tos.length;

  const feed = document.getElementById('feed');

  if (alerts.length === 0) {
    feed.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛡️</div>
        <div class="empty-text">No activity yet. Browse normally.</div>
      </div>
    `;
    return;
  }

  feed.innerHTML = alerts.slice(0, 30).map(alert => `
    <div class="alert-item">
      <span class="alert-dot ${alert.kind}"></span>
      <div style="min-width:0;">
        <div class="alert-host">${alert.hostname || '—'}</div>
        <div class="alert-type">${kindLabel(alert)} · ${timeAgo(alert.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

document.getElementById('btn-clear').addEventListener('click', async () => {
  await new Promise(resolve => chrome.runtime.sendMessage({ type: 'CLEAR_ALERTS' }, resolve));
  render();
});

render();
