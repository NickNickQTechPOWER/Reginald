/**
 * Reginald — Background Service Worker
 *
 * Handles:
 *  - Claude API calls for ToS analysis
 *  - Alert persistence (chrome.storage)
 *  - Badge counter updates
 *  - Message routing from content scripts
 */

// ── Claude API ────────────────────────────────────────────────────────────────

const TOS_SYSTEM_PROMPT = `You are a legal analyst specialising in consumer Terms of Service and Privacy Policies.

Analyse the provided ToS/Privacy Policy text and identify clauses the user should know about before accepting.

Classify each clause as:
- RISK   — genuinely harmful: data selling to third parties, perpetual/irrevocable licenses, biometric data collection, waiving class action rights, auto-renewal with difficult cancellation, sharing data with law enforcement without notice
- NOTE   — worth knowing: data retention periods, account deletion behaviour, arbitration clauses, changes to terms without notice
- FINE   — standard/expected: standard disclaimers, limitation of liability boilerplate, governing law

Return ONLY valid JSON, no markdown, no extra text:
{
  "summary": "2-3 sentence plain-English summary of the most important things",
  "overall_risk": "High | Medium | Low",
  "clauses": [
    { "risk": "RISK|NOTE|FINE", "summary": "plain English summary", "clause": "relevant excerpt (max 150 chars)" }
  ]
}

Include at most 8 clauses. Prioritise RISK clauses. Omit FINE clauses unless there are fewer than 3 total.`;

async function analyseTosWithClaude(text, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: TOS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyse this Terms of Service:\n\n${text.slice(0, 12000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.content?.find(b => b.type === 'text')?.text || '';
  return JSON.parse(raw);
}

// ── Backend sync ──────────────────────────────────────────────────────────────

const BACKEND_URL = 'https://reginald.ai';

async function syncEventToBackend(kind, hostname, url, detail) {
  try {
    const { auth_token } = await chrome.storage.sync.get('auth_token');
    if (!auth_token) return; // not logged in, skip silently
    await fetch(`${BACKEND_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth_token}`,
      },
      body: JSON.stringify({ kind, hostname, url, detail }),
    });
  } catch {
    // Network errors are non-fatal; local storage is the source of truth
  }
}

// ── Alert storage ─────────────────────────────────────────────────────────────

async function getAlerts() {
  const { alerts = [] } = await chrome.storage.local.get('alerts');
  return alerts;
}

async function addAlert(alert) {
  const alerts = await getAlerts();
  alerts.unshift({ ...alert, id: Date.now() });
  // Keep last 200
  await chrome.storage.local.set({ alerts: alerts.slice(0, 200) });
  await updateBadge();
  // Fire-and-forget sync to backend
  const detail = alert.findings ? JSON.stringify(alert.findings) : (alert.summary || null);
  syncEventToBackend(alert.kind, alert.hostname || '', alert.url || '', detail);
}

async function clearAlerts() {
  await chrome.storage.local.set({ alerts: [] });
  await updateBadge();
}

// ── Badge ─────────────────────────────────────────────────────────────────────

async function updateBadge() {
  const alerts = await getAlerts();
  const count = alerts.length;
  if (count === 0) {
    chrome.action.setBadgeText({ text: '' });
  } else {
    chrome.action.setBadgeText({ text: count > 99 ? '99+' : String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }
}

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  if (type === 'INJECTION_DETECTED') {
    addAlert({
      kind: 'injection',
      url: payload.url,
      hostname: payload.hostname,
      findings: payload.findings,
      timestamp: payload.timestamp,
    }).catch(console.error);
    // No async response needed
    return false;
  }

  if (type === 'ANALYSE_TOS') {
    // Must return true to keep the message channel open for async response
    (async () => {
      try {
        const { api_key } = await chrome.storage.sync.get('api_key');
        if (!api_key) {
          sendResponse({ error: 'No Claude API key set. Add one in Reginald Settings.' });
          return;
        }
        const result = await analyseTosWithClaude(payload.text, api_key);
        // Log the ToS analysis as an alert too
        await addAlert({
          kind: 'tos',
          url: payload.url,
          hostname: new URL(payload.url).hostname,
          summary: result.summary,
          overall_risk: result.overall_risk,
          timestamp: new Date().toISOString(),
        });
        sendResponse({ result });
      } catch (err) {
        console.error('[reginald] ToS analysis error:', err);
        sendResponse({ error: err.message });
      }
    })();
    return true; // keep channel open
  }

  if (type === 'GET_ALERTS') {
    getAlerts().then(alerts => sendResponse({ alerts }));
    return true;
  }

  if (type === 'CLEAR_ALERTS') {
    clearAlerts().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (type === 'GET_SETTINGS') {
    chrome.storage.sync.get(['api_key', 'shield_enabled', 'tos_enabled'], (settings) => {
      sendResponse({ settings });
    });
    return true;
  }

  if (type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set(payload, () => sendResponse({ ok: true }));
    return true;
  }

  if (type === 'SET_AUTH_TOKEN') {
    chrome.storage.sync.set({ auth_token: payload.token }, () => sendResponse({ ok: true }));
    return true;
  }

  if (type === 'CLEAR_AUTH_TOKEN') {
    chrome.storage.sync.remove('auth_token', () => sendResponse({ ok: true }));
    return true;
  }
});

// Init badge on install / startup
chrome.runtime.onInstalled.addListener(updateBadge);
updateBadge();
