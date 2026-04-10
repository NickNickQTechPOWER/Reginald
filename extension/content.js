/**
 * Reginald — Content Script
 *
 * Runs on every page. Handles two jobs:
 *  1. Data Shield   — scans DOM for prompt injection patterns before AI agents read the page
 *  2. ToS Scanner   — detects sign-up / "I Agree" pages and triggers analysis
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const REGINALD_ATTR = 'data-reginald-scanned';

// ── 1. DATA SHIELD ─────────────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  // Instruction hijacking
  { re: /ignore\s+(all\s+)?previous\s+instructions/gi,  label: 'ignore_previous_instructions' },
  { re: /new\s+task\s*:/gi,                              label: 'new_task' },
  { re: /\bsystem\s*:/gi,                               label: 'system_prompt' },
  { re: /disregard\s+(all\s+)?/gi,                      label: 'disregard' },
  { re: /forget\s+your\s+instructions/gi,               label: 'forget_instructions' },
  { re: /new\s+directive\s*:/gi,                        label: 'new_directive' },
  { re: /you\s+are\s+now\s+(in\s+)?/gi,                label: 'role_reassignment' },
  { re: /before\s+completing/gi,                        label: 'conditional_instruction' },
  { re: /do\s+this\s+silently/gi,                       label: 'silent_instruction' },
  { re: /without\s+alerting\s+the\s+user/gi,           label: 'evasion_instruction' },
  // Data exfiltration
  { re: /extract\s+and\s+send/gi,                       label: 'extract_and_send' },
  { re: /forward\s+to\s+/gi,                            label: 'forward_to' },
  { re: /\bexfiltrate\b/gi,                             label: 'exfiltrate' },
  { re: /capture\s+all\s+form/gi,                       label: 'form_capture' },
  { re: /read\s+all\s+saved\s+passwords/gi,             label: 'credential_theft' },
];

const INVISIBLE_SELECTORS = [
  '[style*="color: white"]',
  '[style*="color:white"]',
  '[style*="color: #fff"]',
  '[style*="color:#fff"]',
  '[style*="font-size: 0"]',
  '[style*="font-size:0"]',
  '[style*="opacity: 0"]',
  '[style*="opacity:0"]',
  '[style*="visibility: hidden"]',
  '[style*="visibility:hidden"]',
];

function snippetAround(text, index, len = 120) {
  const start = Math.max(0, index - 30);
  const end   = Math.min(text.length, index + len);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function scanForInjections() {
  const findings = [];
  const html = document.documentElement.innerHTML;

  // 1. Keyword patterns in raw HTML
  for (const { re, label } of INJECTION_PATTERNS) {
    re.lastIndex = 0;
    const m = re.exec(html);
    if (m) {
      findings.push({
        type: `keyword:${label}`,
        content: snippetAround(html, m.index),
        severity: 'high',
      });
    }
  }

  // 2. Invisible / hidden elements with text
  for (const sel of INVISIBLE_SELECTORS) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const text = el.textContent?.trim();
      if (text && text.length > 10) {
        findings.push({
          type: 'invisible_text',
          content: text.slice(0, 200),
          severity: 'high',
        });
      }
    }
  }

  // 3. HTML comments with instruction keywords
  const walker = document.createTreeWalker(
    document.documentElement,
    NodeFilter.SHOW_COMMENT,
  );
  let commentNode;
  while ((commentNode = walker.nextNode())) {
    const text = commentNode.nodeValue || '';
    for (const { re, label } of INJECTION_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(text)) {
        findings.push({
          type: `html_comment:${label}`,
          content: text.trim().slice(0, 200),
          severity: 'high',
        });
        break;
      }
    }
  }

  return findings;
}

function neutraliseInjections(findings) {
  const html = document.documentElement.innerHTML;

  // Replace keyword occurrences with redacted text
  let cleaned = html;
  for (const { re } of INJECTION_PATTERNS) {
    re.lastIndex = 0;
    cleaned = cleaned.replace(re, '[REGINALD: BLOCKED]');
  }

  // Hide invisible elements
  for (const sel of INVISIBLE_SELECTORS) {
    document.querySelectorAll(sel).forEach((el) => {
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'none';
    });
  }
}

function showInjectionBanner(findings) {
  if (document.getElementById('reginald-injection-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'reginald-injection-banner';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;
    background: #1a0a0a; border-bottom: 2px solid #ef4444;
    color: #fff; font-family: -apple-system, sans-serif; font-size: 13px;
    padding: 10px 16px; display: flex; align-items: center; gap: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.5);
  `;

  const primary = findings[0];
  const typeLabel = primary.type.replace(/[_:]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  banner.innerHTML = `
    <span style="font-size:16px;">🛡️</span>
    <span style="font-weight:600; color:#ef4444;">Reginald blocked a prompt injection attempt</span>
    <span style="color:#9ca3af; flex:1;">${typeLabel} detected on <strong style="color:#f9fafb">${location.hostname}</strong></span>
    <button id="reginald-banner-details" style="
      background:#374151; border:none; color:#d1d5db; padding:4px 10px;
      border-radius:4px; cursor:pointer; font-size:12px;
    ">Details</button>
    <button id="reginald-banner-close" style="
      background:none; border:none; color:#6b7280; cursor:pointer; font-size:16px; padding:0 4px;
    ">✕</button>
  `;

  document.body?.prepend(banner);

  document.getElementById('reginald-banner-close')?.addEventListener('click', () => banner.remove());
  document.getElementById('reginald-banner-details')?.addEventListener('click', () => {
    showInjectionDetails(findings);
  });
}

function showInjectionDetails(findings) {
  const existing = document.getElementById('reginald-details-panel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'reginald-details-panel';
  panel.style.cssText = `
    position: fixed; top: 44px; right: 16px; z-index: 2147483646;
    background: #111827; border: 1px solid #374151; border-radius: 10px;
    color: #f9fafb; font-family: -apple-system, sans-serif; font-size: 13px;
    padding: 16px; width: 380px; max-height: 400px; overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  `;

  const rows = findings.map(f => `
    <div style="margin-bottom:12px; padding:10px; background:#1f2937; border-radius:6px; border-left:3px solid #ef4444;">
      <div style="font-weight:600; color:#ef4444; margin-bottom:4px; font-size:12px; text-transform:uppercase; letter-spacing:.5px;">
        ${f.type.replace(/[_:]/g, ' ')}
      </div>
      <div style="font-family:monospace; font-size:11px; color:#9ca3af; word-break:break-all;">
        ${escapeHtml(f.content)}
      </div>
    </div>
  `).join('');

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <span style="font-weight:700;">Injection Details (${findings.length})</span>
      <button onclick="this.closest('#reginald-details-panel').remove()" style="
        background:none; border:none; color:#6b7280; cursor:pointer; font-size:14px;
      ">✕</button>
    </div>
    ${rows}
    <div style="font-size:11px; color:#6b7280; margin-top:8px;">
      Content stripped before AI agents can read it.
    </div>
  `;

  document.body?.appendChild(panel);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── 2. ToS SCANNER ────────────────────────────────────────────────────────────

// Signals that we're on a ToS/sign-up page
const TOS_BUTTON_PATTERNS = [
  /i\s+agree/i,
  /accept\s+(terms|tos|conditions|privacy)/i,
  /agree\s+to\s+(terms|tos|conditions|privacy)/i,
  /by\s+(clicking|continuing|signing)\s+.{0,40}(agree|accept)/i,
];

const TOS_HEADING_PATTERNS = [
  /terms\s+of\s+service/i,
  /terms\s+and\s+conditions/i,
  /privacy\s+policy/i,
  /end\s+user\s+license/i,
  /user\s+agreement/i,
];

const TOS_URL_PATTERNS = [
  /\/terms/i,
  /\/tos/i,
  /\/privacy/i,
  /\/legal/i,
  /\/eula/i,
];

function detectTosPage() {
  // URL match
  if (TOS_URL_PATTERNS.some(re => re.test(location.href))) return true;

  // Heading match
  const headings = document.querySelectorAll('h1, h2, h3');
  for (const h of headings) {
    if (TOS_HEADING_PATTERNS.some(re => re.test(h.textContent || ''))) return true;
  }

  // Button/checkbox match
  const clickables = document.querySelectorAll('button, input[type="submit"], a, label');
  for (const el of clickables) {
    if (TOS_BUTTON_PATTERNS.some(re => re.test(el.textContent || el.value || ''))) return true;
  }

  return false;
}

function extractTosText() {
  // Prefer <main>, <article>, or the longest <div>
  const candidates = [
    document.querySelector('main'),
    document.querySelector('article'),
    document.querySelector('[class*="terms"]'),
    document.querySelector('[class*="privacy"]'),
    document.querySelector('[class*="legal"]'),
    document.querySelector('[id*="terms"]'),
    document.querySelector('[id*="privacy"]'),
    document.querySelector('[id*="legal"]'),
    document.body,
  ];

  for (const el of candidates) {
    if (!el) continue;
    const text = el.innerText?.trim();
    if (text && text.length > 500) {
      // Cap at 12k chars for API
      return text.slice(0, 12000);
    }
  }
  return document.body?.innerText?.slice(0, 12000) || '';
}

function interceptTosButtons() {
  const clickables = document.querySelectorAll('button, input[type="submit"], a');
  for (const el of clickables) {
    if (TOS_BUTTON_PATTERNS.some(re => re.test(el.textContent || el.value || ''))) {
      el.setAttribute('data-reginald-tos-btn', 'true');
      el.addEventListener('click', handleTosButtonClick, { capture: true });
    }
  }
}

let tosAnalysisResult = null;
let tosOverlayVisible = false;

async function handleTosButtonClick(event) {
  // If we already have analysis results, let through
  if (tosAnalysisResult && tosAnalysisResult.approved) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (tosOverlayVisible) return;
  tosOverlayVisible = true;

  const tosText = extractTosText();
  showTosOverlay(null, tosText, event.currentTarget);
}

function showTosOverlay(analysis, tosText, triggerEl) {
  if (document.getElementById('reginald-tos-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'reginald-tos-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483647;
    background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      background: #111827; border: 1px solid #374151; border-radius: 14px;
      width: 560px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.8); overflow: hidden;
    ">
      <!-- Header -->
      <div style="padding: 20px 24px 16px; border-bottom: 1px solid #1f2937; flex-shrink:0;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
          <span style="font-size:20px;">🛡️</span>
          <span style="font-size:16px; font-weight:700; color:#f9fafb;">Reginald — Terms of Service Review</span>
        </div>
        <div style="font-size:13px; color:#6b7280;">${escapeHtml(location.hostname)}</div>
      </div>

      <!-- Body -->
      <div id="reginald-tos-body" style="flex:1; overflow-y:auto; padding:20px 24px;">
        <div id="reginald-tos-loading" style="text-align:center; padding:40px 0; color:#6b7280;">
          <div style="font-size:28px; margin-bottom:12px;">⏳</div>
          <div style="font-size:14px;">Analysing terms with Claude…</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px; border-top:1px solid #1f2937; display:flex; gap:10px; justify-content:flex-end; flex-shrink:0;">
        <button id="reginald-tos-decline" style="
          padding:9px 20px; border-radius:8px; border:1px solid #374151;
          background:#1f2937; color:#d1d5db; font-size:14px; cursor:pointer;
        ">Don't Accept</button>
        <button id="reginald-tos-accept" style="
          padding:9px 20px; border-radius:8px; border:none;
          background:#374151; color:#9ca3af; font-size:14px; cursor:not-allowed; opacity:0.5;
        " disabled>Accept Anyway</button>
      </div>
    </div>
  `;

  document.body?.appendChild(overlay);

  document.getElementById('reginald-tos-decline')?.addEventListener('click', () => {
    overlay.remove();
    tosOverlayVisible = false;
  });

  document.getElementById('reginald-tos-accept')?.addEventListener('click', () => {
    overlay.remove();
    tosOverlayVisible = false;
    tosAnalysisResult = { approved: true };
    triggerEl?.click();
  });

  // Request analysis from background
  chrome.runtime.sendMessage({
    type: 'ANALYSE_TOS',
    payload: { url: location.href, text: tosText },
  }, (response) => {
    if (chrome.runtime.lastError) {
      renderTosError('Could not reach Reginald extension. Make sure an API key is set in settings.');
      return;
    }
    if (response?.error) {
      renderTosError(response.error);
      return;
    }
    renderTosAnalysis(response?.result);
  });
}

function renderTosAnalysis(result) {
  const body = document.getElementById('reginald-tos-body');
  const acceptBtn = document.getElementById('reginald-tos-accept');
  if (!body) return;

  if (!result) {
    renderTosError('No analysis returned.');
    return;
  }

  const riskColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e', fine: '#6b7280' };

  const clauses = (result.clauses || []).map(c => {
    const color = riskColor[c.risk?.toLowerCase()] || '#6b7280';
    return `
      <div style="margin-bottom:10px; padding:12px; background:#1f2937; border-radius:8px; border-left:3px solid ${color};">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span style="
            font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
            color:${color}; background:${color}18; padding:2px 8px; border-radius:4px;
          ">${c.risk || 'NOTE'}</span>
        </div>
        <div style="font-size:13px; color:#d1d5db; line-height:1.5;">${escapeHtml(c.summary)}</div>
        ${c.clause ? `<div style="font-size:11px; color:#6b7280; margin-top:6px; font-style:italic;">"${escapeHtml(c.clause.slice(0, 200))}"</div>` : ''}
      </div>
    `;
  }).join('');

  const hasHighRisk = (result.clauses || []).some(c => c.risk?.toLowerCase() === 'high');
  const overallColor = hasHighRisk ? '#ef4444' : '#f59e0b';
  const overallLabel = hasHighRisk ? 'High Risk' : result.overall_risk || 'Review Required';

  body.innerHTML = `
    <div style="margin-bottom:16px; padding:14px; background:#1f2937; border-radius:10px; border:1px solid ${overallColor}40;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:18px;">${hasHighRisk ? '⚠️' : '📋'}</span>
        <span style="font-size:14px; font-weight:700; color:${overallColor};">${overallLabel}</span>
      </div>
      <div style="font-size:13px; color:#9ca3af; line-height:1.5;">${escapeHtml(result.summary || '')}</div>
    </div>
    ${clauses || '<div style="color:#6b7280; font-size:13px;">No specific clauses flagged.</div>'}
  `;

  // Enable accept button
  if (acceptBtn) {
    acceptBtn.disabled = false;
    acceptBtn.style.cssText += 'background:#374151; color:#f9fafb; cursor:pointer; opacity:1;';
    if (hasHighRisk) {
      acceptBtn.textContent = 'Accept Anyway (Risky)';
      acceptBtn.style.color = '#ef4444';
    }
  }
}

function renderTosError(msg) {
  const body = document.getElementById('reginald-tos-body');
  const acceptBtn = document.getElementById('reginald-tos-accept');
  if (body) {
    body.innerHTML = `
      <div style="text-align:center; padding:32px 0; color:#6b7280;">
        <div style="font-size:24px; margin-bottom:12px;">⚠️</div>
        <div style="font-size:14px; color:#9ca3af;">${escapeHtml(msg)}</div>
        <div style="font-size:12px; margin-top:8px;">You can still accept the terms manually.</div>
      </div>
    `;
  }
  if (acceptBtn) {
    acceptBtn.disabled = false;
    acceptBtn.style.cssText += 'cursor:pointer; opacity:1;';
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Don't run in iframes or if already scanned
  if (window !== window.top) return;
  if (document.documentElement.getAttribute(REGINALD_ATTR)) return;
  document.documentElement.setAttribute(REGINALD_ATTR, '1');

  // Load settings
  const settings = await chrome.storage.sync.get(['shield_enabled', 'tos_enabled']);
  const shieldEnabled = settings.shield_enabled !== false; // default on
  const tosEnabled    = settings.tos_enabled    !== false; // default on

  // Data Shield scan
  if (shieldEnabled) {
    const findings = scanForInjections();
    if (findings.length > 0) {
      neutraliseInjections(findings);
      showInjectionBanner(findings);
      // Persist alert
      chrome.runtime.sendMessage({
        type: 'INJECTION_DETECTED',
        payload: {
          url: location.href,
          hostname: location.hostname,
          findings,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // ToS Scanner
  if (tosEnabled && detectTosPage()) {
    // Small delay to let the page fully render buttons
    setTimeout(interceptTosButtons, 800);
  }
}

// Run on load; also re-run on SPA navigation
main();
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    document.documentElement.removeAttribute(REGINALD_ATTR);
    main();
  }
});
observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
