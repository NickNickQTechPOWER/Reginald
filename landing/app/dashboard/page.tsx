'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string; email: string; name: string;
  api_key: string; shield_on: number; tos_on: number;
}
interface Event {
  id: number; kind: string; hostname: string;
  url: string; detail: string | null; timestamp: string;
}
interface Stats { total: number; injections: number; tos_reviews: number; }

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Serif+Display&family=JetBrains+Mono:wght@400&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --cream: #f5f2e3; --cream-dark: #e5e2d1; --ink: #251400; --ink-light: #8d8372; --ink-faint: #8d8372; --rust: #b85c38; --sage: #6b7c5e; }
  body { font-family: 'DM Sans', Arial, sans-serif; background: var(--cream); color: var(--ink); -webkit-font-smoothing: antialiased; }

  .db-nav { position: sticky; top: 0; z-index: 50; background: var(--cream); border-bottom: 1px solid rgba(37,20,0,0.1); padding: 0 2rem; }
  .db-nav-inner { max-width: 1000px; margin: 0 auto; height: 64px; display: flex; align-items: center; gap: 0; }
  .db-logo { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--ink); text-decoration: none; margin-right: auto; }
  .db-tab { background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-light); padding: 0.4rem 0.85rem; border-radius: 6px; transition: all 0.15s; }
  .db-tab:hover { color: var(--ink); }
  .db-tab.active { color: var(--ink); background: var(--cream-dark); }
  .db-signout { background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; color: var(--ink-light); margin-left: 1rem; text-transform: uppercase; letter-spacing: 0.05em; transition: color 0.15s; }
  .db-signout:hover { color: var(--ink); }

  .db-body { max-width: 1000px; margin: 0 auto; padding: 2.5rem 2rem 4rem; }

  .status-banner { background: var(--cream-dark); border-radius: 14px; padding: 1.75rem 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1.25rem; }
  .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .status-dot.on { background: var(--sage); box-shadow: 0 0 0 3px rgba(107,124,94,0.2); }
  .status-dot.off { background: var(--ink-faint); }
  .status-title { font-family: 'DM Serif Display', serif; font-size: 1.3rem; font-weight: 400; }
  .status-sub { font-size: 0.85rem; color: var(--ink-light); margin-top: 0.15rem; }

  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.67rem; margin-bottom: 1.5rem; }
  .stat-card { background: var(--cream-dark); border-radius: 11px; padding: 1.5rem 1.75rem; }
  .stat-label { font-size: 0.7rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-light); margin-bottom: 0.5rem; }
  .stat-value { font-family: 'DM Serif Display', serif; font-size: 2.8rem; font-weight: 400; line-height: 1; }
  .stat-value.accent { color: var(--rust); }

  .ext-banner { background: var(--cream-dark); border-radius: 11px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; }
  .ext-banner-text { flex: 1; }
  .ext-banner-title { font-size: 0.9rem; font-weight: 500; }
  .ext-banner-sub { font-size: 0.8rem; color: var(--ink-light); margin-top: 0.2rem; }
  .ext-btn { background: #000; color: var(--cream); border: none; border-radius: 100px; padding: 0.55rem 1.1rem; font-family: 'DM Sans', sans-serif; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; white-space: nowrap; text-decoration: none; transition: opacity 0.2s; }
  .ext-btn:hover { opacity: 0.8; }

  .activity-card { background: var(--cream-dark); border-radius: 14px; overflow: hidden; }
  .activity-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(37,20,0,0.07); display: flex; align-items: center; justify-content: space-between; }
  .activity-header h2 { font-family: 'DM Serif Display', serif; font-size: 1.1rem; font-weight: 400; }
  .clear-btn { background: none; border: none; cursor: pointer; font-size: 0.78rem; color: var(--ink-light); text-transform: uppercase; letter-spacing: 0.04em; transition: color 0.15s; }
  .clear-btn:hover { color: var(--rust); }
  .activity-empty { padding: 4rem 2rem; text-align: center; color: var(--ink-light); }
  .activity-empty-title { font-family: 'DM Serif Display', serif; font-size: 1.1rem; font-weight: 400; margin-bottom: 0.4rem; }
  .activity-empty-sub { font-size: 0.85rem; }
  .activity-row { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.5rem; border-bottom: 1px solid rgba(37,20,0,0.06); }
  .activity-row:last-child { border: none; }
  .event-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .event-dot.injection { background: var(--rust); }
  .event-dot.tos { background: #c4a882; }
  .event-host { font-size: 0.9rem; font-weight: 500; }
  .event-kind { font-size: 0.75rem; color: var(--ink-light); margin-top: 0.1rem; }
  .event-time { font-size: 0.75rem; color: var(--ink-faint); flex-shrink: 0; margin-left: auto; }

  .settings-section { margin-bottom: 1.5rem; }
  .settings-section-title { font-size: 0.7rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-light); margin-bottom: 0.6rem; }
  .settings-card { background: var(--cream-dark); border-radius: 14px; overflow: hidden; }
  .settings-inner { padding: 1.5rem; }
  .settings-field { margin-bottom: 1.1rem; }
  .settings-field:last-child { margin-bottom: 0; }
  .settings-field label { display: block; font-size: 0.72rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-light); margin-bottom: 0.45rem; }
  .settings-field input { width: 100%; background: var(--cream); border: 1px solid rgba(37,20,0,0.15); border-radius: 8px; padding: 0.65rem 0.9rem; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: var(--ink); outline: none; }
  .settings-field input:focus { border-color: var(--ink); }
  .settings-field input:disabled { opacity: 0.45; cursor: not-allowed; }
  .settings-field input.mono { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; }
  .key-row { display: flex; gap: 0.5rem; }
  .key-row input { flex: 1; }
  .show-btn { background: var(--cream); border: 1px solid rgba(37,20,0,0.15); border-radius: 8px; padding: 0 0.9rem; font-size: 0.75rem; color: var(--ink-light); cursor: pointer; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.04em; transition: color 0.15s; }
  .show-btn:hover { color: var(--ink); }
  .field-hint { font-size: 0.75rem; color: var(--ink-light); margin-top: 0.4rem; }

  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(37,20,0,0.07); }
  .toggle-row:last-child { border: none; }
  .toggle-label { font-size: 0.9rem; font-weight: 500; }
  .toggle-sub { font-size: 0.78rem; color: var(--ink-light); margin-top: 0.15rem; }
  .toggle { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
  .toggle input { display: none; }
  .toggle-track { position: absolute; inset: 0; border-radius: 11px; background: rgba(37,20,0,0.15); cursor: pointer; transition: background 0.2s; }
  .toggle input:checked + .toggle-track { background: var(--ink); }
  .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--cream); transition: transform 0.2s; pointer-events: none; }
  .toggle input:checked ~ .toggle-thumb { transform: translateX(18px); }

  .save-bar { display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem; }
  .save-btn { background: #000; color: var(--cream); border: none; border-radius: 100px; padding: 0.75rem 1.75rem; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; transition: opacity 0.2s; }
  .save-btn:hover { opacity: 0.85; }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .save-ok { font-size: 0.85rem; color: var(--sage); }
`;

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]     = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats]   = useState<Stats>({ total: 0, injections: 0, tos_reviews: 0 });
  const [tab, setTab]       = useState<'overview' | 'settings'>('overview');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [apiKey, setApiKey]     = useState('');
  const [showKey, setShowKey]   = useState(false);
  const [shieldOn, setShieldOn] = useState(true);
  const [tosOn, setTosOn]       = useState(true);
  const [name, setName]         = useState('');

  const fetchData = useCallback(async () => {
    const [meRes, evRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/events?limit=50'),
    ]);
    if (meRes.status === 401) { router.push('/login'); return; }
    const { user: u } = await meRes.json();
    const { events: ev, stats: st } = await evRes.json();
    setUser(u);
    setEvents(ev || []);
    setStats(st || { total: 0, injections: 0, tos_reviews: 0 });
    setApiKey(u.api_key || '');
    setShieldOn(u.shield_on !== 0);
    setTosOn(u.tos_on !== 0);
    setName(u.name || '');
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function saveSettings() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, api_key: apiKey, shield_on: shieldOn ? 1 : 0, tos_on: tosOn ? 1 : 0 }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function clearActivity() {
    await fetch('/api/events', { method: 'DELETE' });
    setEvents([]); setStats({ total: 0, injections: 0, tos_reviews: 0 });
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <style>{S}</style>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', color: 'var(--ink-light)', fontFamily: 'DM Sans, sans-serif' }}>
          Loading…
        </div>
      </>
    );
  }

  const protected_ = shieldOn || tosOn;

  return (
    <>
      <style>{S}</style>

      <nav className="db-nav">
        <div className="db-nav-inner">
          <Link href="/" className="db-logo">Reginald</Link>
          <button className={`db-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`db-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Settings</button>
          <button className="db-signout" onClick={logout}>Sign out</button>
        </div>
      </nav>

      <div className="db-body">

        {tab === 'overview' && (
          <>
            <div className="status-banner">
              <span className={`status-dot ${protected_ ? 'on' : 'off'}`} />
              <div>
                <div className="status-title">{protected_ ? 'You are protected' : 'Protection is off'}</div>
                <div className="status-sub">
                  {[shieldOn && 'Data Shield', tosOn && 'ToS Scanner'].filter(Boolean).join(' · ') || 'Enable features in Settings'}
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total events</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Injections blocked</div>
                <div className={`stat-value ${stats.injections > 0 ? 'accent' : ''}`}>{stats.injections}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">ToS reviewed</div>
                <div className="stat-value">{stats.tos_reviews}</div>
              </div>
            </div>

            <div className="ext-banner">
              <div className="ext-banner-text">
                <div className="ext-banner-title">Install the Chrome Extension</div>
                <div className="ext-banner-sub">Runs on every page and syncs activity here automatically.</div>
              </div>
              <a href="#" className="ext-btn">Add to Chrome</a>
            </div>

            <div className="activity-card">
              <div className="activity-header">
                <h2>Recent activity</h2>
                {events.length > 0 && <button className="clear-btn" onClick={clearActivity}>Clear all</button>}
              </div>
              {events.length === 0 ? (
                <div className="activity-empty">
                  <div className="activity-empty-title">No activity yet</div>
                  <div className="activity-empty-sub">Install the extension and browse normally.</div>
                </div>
              ) : (
                events.map(ev => (
                  <div key={ev.id} className="activity-row">
                    <span className={`event-dot ${ev.kind}`} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="event-host" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.hostname || ev.url}</div>
                      <div className="event-kind">{ev.kind === 'injection' ? 'Injection blocked' : 'ToS reviewed'}</div>
                    </div>
                    <div className="event-time">{timeAgo(ev.timestamp)}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === 'settings' && (
          <div style={{ maxWidth: 540 }}>

            <div className="settings-section">
              <div className="settings-section-title">Account</div>
              <div className="settings-card">
                <div className="settings-inner">
                  <div className="settings-field">
                    <label>Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="settings-field">
                    <label>Email</label>
                    <input type="email" value={user.email} disabled />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Claude AI</div>
              <div className="settings-card">
                <div className="settings-inner">
                  <div className="settings-field">
                    <label>API Key</label>
                    <div className="key-row">
                      <input
                        type={showKey ? 'text' : 'password'}
                        className="mono"
                        value={apiKey} onChange={e => setApiKey(e.target.value)}
                        placeholder="sk-ant-…"
                      />
                      <button className="show-btn" onClick={() => setShowKey(v => !v)}>{showKey ? 'Hide' : 'Show'}</button>
                    </div>
                    <div className="field-hint">Required for AI-powered ToS analysis. Get yours at console.anthropic.com</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Features</div>
              <div className="settings-card">
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">Data Shield</div>
                    <div className="toggle-sub">Block prompt injection attacks</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={shieldOn} onChange={e => setShieldOn(e.target.checked)} />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">ToS Scanner</div>
                    <div className="toggle-sub">Review terms before you accept</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={tosOn} onChange={e => setTosOn(e.target.checked)} />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
              </div>
            </div>

            <div className="save-bar">
              <button className="save-btn" onClick={saveSettings} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
              {saved && <span className="save-ok">Saved</span>}
            </div>

          </div>
        )}
      </div>
    </>
  );
}
