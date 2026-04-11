'use client';
import Link from 'next/link';
import { useState } from 'react';

function EarlyAccessModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(37,20,0,0.4)', backdropFilter:'blur(4px)' }} />
      <div style={{ position:'relative', background:'#f5f2e3', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 24px 80px rgba(37,20,0,0.18)' }}>
        <button onClick={onClose} style={{ position:'absolute', top:'1rem', right:'1.25rem', background:'none', border:'none', cursor:'pointer', fontSize:'1.25rem', color:'#8d8372' }}>✕</button>
        {state === 'done' ? (
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:'1.6rem', marginBottom:'0.75rem', color:'#251400' }}>You&rsquo;re on the list.</div>
            <div style={{ color:'#8d8372', fontSize:'0.95rem', lineHeight:1.5 }}>We&rsquo;ll let you know when Reginald is ready. Keep your back watched.</div>
            <button onClick={onClose} style={{ marginTop:'1.5rem', background:'#000', color:'#f5f2e3', border:'none', borderRadius:100, padding:'0.75rem 1.75rem', fontFamily:"'DM Sans', sans-serif", fontSize:'0.9rem', textTransform:'uppercase', cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:'1.6rem', marginBottom:'0.4rem', color:'#251400' }}>Get early access</div>
            <div style={{ color:'#8d8372', fontSize:'0.9rem', marginBottom:'1.75rem', lineHeight:1.5 }}>We&rsquo;re rolling out to a small group first. Leave your email and we&rsquo;ll reach out.</div>
            <form onSubmit={submit}>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width:'100%', background:'#fff', border:'1px solid rgba(37,20,0,0.15)', borderRadius:8, padding:'0.75rem 1rem', fontFamily:"'DM Sans', sans-serif", fontSize:'0.95rem', color:'#251400', outline:'none', boxSizing:'border-box', marginBottom:'0.75rem' }}
              />
              {state === 'error' && <div style={{ color:'#b85c38', fontSize:'0.82rem', marginBottom:'0.5rem' }}>Something went wrong. Try again.</div>}
              <button type="submit" disabled={state === 'loading'} style={{ width:'100%', background:'#000', color:'#f5f2e3', border:'none', borderRadius:100, padding:'0.9rem', fontFamily:"'DM Sans', sans-serif", fontSize:'0.95rem', textTransform:'uppercase', cursor:'pointer', opacity: state === 'loading' ? 0.5 : 1 }}>
                {state === 'loading' ? 'Saving…' : 'Request access'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const openModal = () => setShowModal(true);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --cream: #f5f2e3;
          --cream-dark: #e5e2d1;
          --ink: #251400;
          --ink-light: #8d8372;
          --ink-faint: #8d8372;
          --warm: #c4a882;
          --warm-dark: #a08564;
          --rust: #b85c38;
          --sage: #6b7c5e;
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'DM Sans', Arial, sans-serif;
          background: var(--cream);
          color: var(--ink);
          font-size: 1.333rem;
          line-height: 1.47;
          -webkit-font-smoothing: antialiased;
        }

        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 2.67rem;
          background: transparent;
        }
        .nav-inner {
          max-width: 1400px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 80px;
        }
        .logo {
          font-family: 'DM Serif Display', serif;
          font-size: 1.4rem;
          text-decoration: none; color: var(--ink);
        }
        .nav-links { display: flex; align-items: center; gap: 2.5rem; }
        .nav-links a {
          color: var(--ink); text-decoration: none;
          font-size: 0.875rem; font-weight: 400;
          text-transform: uppercase;
          transition: opacity 0.2s;
        }
        .nav-links a:hover { opacity: 0.6; }
        .btn-warm {
          display: inline-block;
          background: #000; color: var(--cream);
          border: none; padding: 1rem 1.5rem; border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem; font-weight: 400; cursor: pointer;
          text-transform: uppercase;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .btn-warm:hover { opacity: 0.85; }

        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 120px 2rem 80px;
          position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 80%, rgba(184, 92, 56, 0.12), transparent 70%),
            radial-gradient(ellipse 60% 50% at 30% 50%, rgba(107, 124, 94, 0.08), transparent 60%),
            radial-gradient(ellipse 60% 50% at 70% 40%, rgba(196, 168, 130, 0.1), transparent 60%);
        }
        .hero-content { position: relative; z-index: 1; max-width: 900px; }
        .hero h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2.8rem, 6vw, 5.8rem);
          font-weight: 500;
          line-height: 1; margin-bottom: 2rem;
          color: var(--ink);
          text-transform: uppercase;
        }
        .hero p {
          font-size: 1.25rem; color: var(--ink-light);
          max-width: 560px; margin: 0 auto 2.5rem;
          line-height: 1.47;
        }
        .hero-cta {
          display: inline-flex; align-items: center;
          background: #000; color: var(--cream);
          padding: 1rem 1.5rem; border-radius: 100px;
          font-size: 1rem; font-weight: 400;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          transition: opacity 0.2s;
        }
        .hero-cta:hover { opacity: 0.85; }

        .statement {
          padding: 10rem 2rem;
          text-align: center;
        }
        .statement p {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(1.8rem, 3.5vw, 4.5rem);
          max-width: 900px; margin: 0 auto;
          line-height: 1.26;
          color: var(--ink-light);
          font-weight: 400;
        }
        .statement p strong { color: var(--ink); font-weight: 400; }

        .bento {
          max-width: 1400px; margin: 0 auto;
          padding: 0 2rem 6rem;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.67rem;
        }
        .bento-card {
          background: var(--cream-dark);
          border-radius: 11px;
          padding: 2.67rem;
          position: relative; overflow: hidden;
          min-height: 420px;
          display: flex; flex-direction: column;
        }
        .bento-card h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem; font-weight: 400;
          margin-bottom: 0.75rem; line-height: 1.2;
        }
        .bento-card > p { font-size: 1rem; color: var(--ink-light); line-height: 1.47; max-width: 420px; }
        .bento-card .visual {
          flex: 1; display: flex; align-items: flex-end;
          justify-content: center; margin-top: 2rem;
        }

        .tos-visual {
          width: 100%; max-width: 420px;
          background: rgba(26, 23, 20, 0.04);
          border-radius: 14px; padding: 1.5rem;
        }
        .tos-header { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint); margin-bottom: 1rem; font-weight: 500; }
        .tos-row { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(26, 23, 20, 0.06); }
        .tos-row:last-child { border: none; }
        .tos-tag { font-size: 0.65rem; font-weight: 500; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; margin-top: 1px; }
        .tos-tag.high { background: rgba(184, 92, 56, 0.12); color: var(--rust); }
        .tos-tag.med  { background: rgba(196, 168, 130, 0.25); color: var(--warm-dark); }
        .tos-tag.low  { background: rgba(107, 124, 94, 0.12); color: var(--sage); }
        .tos-text { font-size: 0.82rem; color: var(--ink-light); line-height: 1.45; }

        .email-visual { width: 100%; max-width: 420px; }
        .email-mock { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 20px rgba(26, 23, 20, 0.06); }
        .email-top { padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(26, 23, 20, 0.06); }
        .email-sender-info { display: flex; align-items: center; gap: 10px; }
        .email-av { width: 32px; height: 32px; border-radius: 50%; background: var(--cream-dark); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 500; color: var(--ink-light); }
        .email-name { font-size: 0.85rem; font-weight: 500; }
        .email-domain { font-size: 0.72rem; color: var(--ink-faint); }
        .flagged { font-size: 0.68rem; font-weight: 500; color: var(--rust); text-transform: uppercase; letter-spacing: 0.08em; }
        .email-body-mock { padding: 1.25rem; }
        .email-subject { font-size: 0.88rem; font-weight: 500; margin-bottom: 0.5rem; }
        .email-text { font-size: 0.82rem; color: var(--ink-light); line-height: 1.6; }
        .reginald-note { margin: 0.75rem 1.25rem 1.25rem; background: rgba(107, 124, 94, 0.08); border-radius: 10px; padding: 1rem 1.25rem; border-left: 3px solid var(--sage); }
        .reginald-note-title { font-size: 0.72rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sage); margin-bottom: 0.5rem; }
        .reginald-note ul { list-style: none; padding: 0; }
        .reginald-note li { font-size: 0.78rem; color: var(--ink-light); padding: 3px 0 3px 14px; line-height: 1.5; position: relative; }
        .reginald-note li::before { content: ''; position: absolute; left: 0; top: 10px; width: 4px; height: 4px; border-radius: 50%; background: var(--sage); }

        .scramble-visual { width: 100%; display: flex; gap: 1rem; align-items: center; }
        .profile-col { flex: 1; background: rgba(26, 23, 20, 0.04); border-radius: 12px; padding: 1.25rem; }
        .profile-col h5 { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; font-weight: 500; }
        .profile-col.before h5 { color: var(--rust); }
        .profile-col.after h5 { color: var(--sage); }
        .profile-field { display: flex; justify-content: space-between; font-size: 0.78rem; padding: 5px 0; border-bottom: 1px solid rgba(26, 23, 20, 0.05); }
        .profile-field:last-child { border: none; }
        .profile-field .k { color: var(--ink-faint); }
        .profile-field .v { font-weight: 500; }
        .profile-field .v.scrambled { font-family: 'JetBrains Mono', monospace; color: var(--sage); font-size: 0.75rem; }
        .arrow-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; padding: 0 0.5rem; }
        .arrow-col svg { width: 24px; height: 24px; color: var(--ink-faint); }

        .bento-card.full-width {
          grid-column: span 2;
          display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem;
          background: var(--ink); color: var(--cream);
          min-height: 480px;
        }
        .bento-card.full-width h3 { color: var(--cream); }
        .bento-card.full-width > p,
        .bento-card.full-width > div > p { color: rgba(245, 242, 227, 0.6); max-width: none; }
        .bento-card.full-width .visual { margin-top: 0; align-items: center; }
        .shield-visual { width: 100%; display: flex; flex-direction: column; gap: 1.25rem; }
        .browser-threat { background: rgba(245, 242, 227, 0.06); border: 1px solid rgba(245, 242, 227, 0.08); border-radius: 12px; padding: 1.25rem; }
        .browser-threat-header { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500; color: rgba(245, 242, 227, 0.35); margin-bottom: 1rem; }
        .browser-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid rgba(245, 242, 227, 0.05); }
        .browser-row:last-child { border: none; }
        .browser-name { font-size: 0.82rem; font-weight: 500; color: rgba(245, 242, 227, 0.85); }
        .browser-status { font-size: 0.65rem; font-weight: 500; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
        .browser-status.shielded { background: rgba(107, 124, 94, 0.2); color: #8fa97e; }
        .browser-status.blocked  { background: rgba(184, 92, 56, 0.2); color: #d4896a; }
        .injection-alert { background: rgba(184, 92, 56, 0.1); border: 1px solid rgba(184, 92, 56, 0.2); border-radius: 10px; padding: 1rem 1.25rem; }
        .injection-alert-title { font-size: 0.68rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: #d4896a; margin-bottom: 0.5rem; }
        .injection-alert p { font-size: 0.78rem; color: rgba(245, 242, 227, 0.5); line-height: 1.5; }
        .shield-flow { display: flex; align-items: center; gap: 0.5rem; justify-content: center; padding: 0.75rem 0; }
        .flow-node { font-size: 0.68rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 14px; border-radius: 6px; }
        .flow-node.you-node { background: rgba(107, 124, 94, 0.15); color: #8fa97e; }
        .flow-node.reg-node { background: rgba(245, 242, 227, 0.1); color: var(--cream); border: 1px solid rgba(245, 242, 227, 0.15); }
        .flow-node.web-node { background: rgba(184, 92, 56, 0.15); color: #d4896a; }
        .flow-arrow { color: rgba(245, 242, 227, 0.2); font-size: 0.75rem; }

        /* ANONYMISER VISUAL */
        .anon-visual { width: 100%; display: flex; flex-direction: column; gap: 1.25rem; }
        .anon-flow { display: flex; align-items: center; gap: 0.5rem; justify-content: center; padding: 0.75rem 0; flex-wrap: wrap; }
        .anon-node { font-size: 0.68rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 14px; border-radius: 6px; }
        .anon-node.you { background: rgba(107,124,94,0.15); color: #8fa97e; }
        .anon-node.reg { background: rgba(245,242,227,0.1); color: var(--cream); border: 1px solid rgba(245,242,227,0.15); }
        .anon-node.app { background: rgba(196,168,130,0.15); color: #c4a882; }
        .anon-arrow { color: rgba(245,242,227,0.2); font-size: 0.75rem; }
        .anon-table { background: rgba(245,242,227,0.04); border: 1px solid rgba(245,242,227,0.07); border-radius: 12px; overflow: hidden; }
        .anon-table-header { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(245,242,227,0.3); font-weight: 500; padding: 0.6rem 1rem; border-bottom: 1px solid rgba(245,242,227,0.06); }
        .anon-row { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; padding: 0.55rem 1rem; border-bottom: 1px solid rgba(245,242,227,0.04); }
        .anon-row:last-child { border: none; }
        .anon-field { font-size: 0.78rem; color: rgba(245,242,227,0.5); }
        .anon-real { font-size: 0.78rem; color: rgba(245,242,227,0.75); font-weight: 500; }
        .anon-token { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #8fa97e; background: rgba(107,124,94,0.12); padding: 2px 6px; border-radius: 4px; }

        .stats-section { padding: 6rem 2rem 8rem; }
        .stats-header { text-align: center; margin-bottom: 4rem; }
        .stats-header p { font-family: 'DM Serif Display', serif; font-size: clamp(1.8rem, 3.5vw, 3.2rem); max-width: 780px; margin: 0 auto; line-height: 1.26; font-weight: 400; }
        .stats-grid { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.67rem; }
        .stat-card { background: var(--cream-dark); border-radius: 11px; padding: 3.5rem 2rem; text-align: center; }
        .stat-card .num { font-family: 'DM Serif Display', serif; font-size: clamp(3rem, 5.5vw, 5.8rem); font-weight: 400; line-height: 1; margin-bottom: 1rem; }
        .stat-card .desc { font-size: 0.875rem; color: var(--ink-light); }

        .bottom-grid { max-width: 1400px; margin: 0 auto; padding: 0 2rem 6rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.67rem; }
        .bottom-card { background: var(--cream-dark); border-radius: 11px; padding: 2.67rem; min-height: 360px; display: flex; flex-direction: column; }
        .bottom-card h3 { font-family: 'DM Serif Display', serif; font-size: 1.75rem; font-weight: 400; margin-bottom: 0.75rem; line-height: 1.2; }
        .bottom-card p { font-size: 1rem; color: var(--ink-light); line-height: 1.47; }
        .bottom-card .card-visual { flex: 1; display: flex; align-items: flex-end; justify-content: center; margin-top: 2rem; }
        .card-visual-gradient { width: 100%; height: 180px; border-radius: 8px; }
        .card-visual-gradient.v1 { background: linear-gradient(135deg, #2d2b3a, #5b4a6e, #a08564); }
        .card-visual-gradient.v2 { background: linear-gradient(135deg, #3a4a3a, #6b7c5e, #c4a882); }
        .card-visual-gradient.v3 { background: linear-gradient(135deg, #4a3a2a, #b85c38, #e8c9a0); }

        .cta-section { padding: 8rem 2rem 10rem; text-align: center; }
        .cta-section h2 { font-family: 'DM Serif Display', serif; font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 400; margin-bottom: 1.5rem; }
        .cta-section > p { font-size: 1.1rem; color: var(--ink-light); max-width: 480px; margin: 0 auto 2.5rem; line-height: 1.47; }

        footer { background: #000; padding: 3rem 2rem; }
        .footer-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .footer-logo { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--cream); }
        .footer-links { display: flex; gap: 2rem; }
        .footer-links a { font-size: 0.875rem; color: rgba(245, 242, 227, 0.5); text-decoration: none; text-transform: uppercase; transition: color 0.2s; }
        .footer-links a:hover { color: var(--cream); }

        @media (max-width: 900px) {
          .bento { grid-template-columns: 1fr; }
          .bento-card.full-width { grid-column: span 1; grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .bottom-grid { grid-template-columns: 1fr; }
          .scramble-visual { flex-direction: column; }
          .arrow-col { transform: rotate(90deg); }
          nav { padding: 0 1.5rem; }
          .nav-links a:not(:last-child) { display: none; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {showModal && <EarlyAccessModal onClose={() => setShowModal(false)} />}

      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo" style={{ color: 'var(--ink)' }}>Reginald</Link>
          <div className="nav-links">
            <a href="#product">Product</a>
            <a href="#how">How it works</a>
            <a href="#about">About</a>
            <button onClick={openModal} className="btn-warm">Get early access</button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1>Your companion<br />for the age of<br />surveillance</h1>
          <p>Every click you make builds a profile someone else owns. Reginald watches your back so you can stop watching yours.</p>
          <button onClick={openModal} className="hero-cta">Get early access</button>
        </div>
      </section>

      <section className="statement">
        <p>You agree to terms you never read. Your AI shares your real name, email, and address with every app it touches. Your inbox is full of emails designed to fool you. <strong>Reginald sits between you and all of it.</strong></p>
      </section>

      <section className="bento" id="product">

        {/* ToS Scanner */}
        <div className="bento-card">
          <h3>Reads every terms of service so you don&rsquo;t have to</h3>
          <p>Reginald scans agreements before you sign them and flags the clauses that actually matter.</p>
          <div className="visual">
            <div className="tos-visual">
              <div className="tos-header">Scanning SocialApp terms of service</div>
              <div className="tos-row"><span className="tos-tag high">Risk</span><span className="tos-text">Grants perpetual license to all content you upload</span></div>
              <div className="tos-row"><span className="tos-tag high">Risk</span><span className="tos-text">Shares biometric data with unnamed third parties</span></div>
              <div className="tos-row"><span className="tos-tag med">Note</span><span className="tos-text">Retains data for 7 years after account deletion</span></div>
              <div className="tos-row"><span className="tos-tag low">Fine</span><span className="tos-text">Standard session cookies</span></div>
            </div>
          </div>
        </div>

        {/* Email Guardian */}
        <div className="bento-card">
          <h3>Catches the emails designed to fool you</h3>
          <p>Phishing, impersonation, gift card scams. Reginald spots them before you click.</p>
          <div className="visual">
            <div className="email-visual">
              <div className="email-mock">
                <div className="email-top">
                  <div className="email-sender-info">
                    <div className="email-av">JD</div>
                    <div>
                      <div className="email-name">James Davidson (CEO)</div>
                      <div className="email-domain">j.davidson@company-hr.support.com</div>
                    </div>
                  </div>
                  <span className="flagged">Flagged</span>
                </div>
                <div className="email-body-mock">
                  <div className="email-subject">Urgent &mdash; Need your help</div>
                  <div className="email-text">Hey, are you at your desk? I need you to grab some gift cards for a client meeting. Get 5x $200 and send me the codes. I&rsquo;ll reimburse you.</div>
                </div>
                <div className="reginald-note">
                  <div className="reginald-note-title">Reginald</div>
                  <ul>
                    <li>Domain doesn&rsquo;t match your organization</li>
                    <li>Pattern matches CEO impersonation scam</li>
                    <li>&ldquo;Don&rsquo;t tell anyone&rdquo; is an isolation tactic</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Shield */}
        <div className="bento-card full-width">
          <div>
            <h3>AI browsers see everything. Reginald decides what they get.</h3>
            <p>Tools like Operator, Comet, and Claude browse the web on your behalf. They read your emails, fill out your forms, access your accounts. Reginald sits between you and them, filtering what data these agents can see, blocking prompt injection attacks that try to hijack their actions, and making sure no AI agent oversteps without your say.</p>
          </div>
          <div className="visual">
            <div className="shield-visual">
              <div className="shield-flow">
                <span className="flow-node you-node">Your data</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-node reg-node">Reginald</span>
                <span className="flow-arrow">&rarr;</span>
                <span className="flow-node web-node">AI agent</span>
              </div>
              <div className="browser-threat">
                <div className="browser-threat-header">Active AI browser sessions</div>
                <div className="browser-row"><span className="browser-name">Operator (OpenAI)</span><span className="browser-status shielded">Shielded</span></div>
                <div className="browser-row"><span className="browser-name">Claude Computer Use</span><span className="browser-status shielded">Shielded</span></div>
                <div className="browser-row"><span className="browser-name">Comet (Apple)</span><span className="browser-status shielded">Shielded</span></div>
                <div className="browser-row"><span className="browser-name">Unknown agent</span><span className="browser-status blocked">Blocked</span></div>
              </div>
              <div className="injection-alert">
                <div className="injection-alert-title">Prompt injection blocked</div>
                <p>A hidden instruction on checkout.store.com attempted to redirect Operator to share your payment details with an external endpoint. Reginald intercepted and neutralized it.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Anonymiser */}
        <div className="bento-card full-width">
          <div>
            <h3>Your MCP apps get what they need. Not who you are.</h3>
            <p>When you connect an AI to a tool — your calendar, your CRM, your files — it sends your real data. Names, addresses, phone numbers, account IDs. Reginald sits in between and anonymises it on the way out: real values are replaced with tokens the app can work with, but can&rsquo;t trace back to you. Your AI still gets the job done. The app never learns who you are.</p>
          </div>
          <div className="visual">
            <div className="anon-visual">
              <div className="anon-flow">
                <span className="anon-node you">Your data</span>
                <span className="anon-arrow">&rarr;</span>
                <span className="anon-node reg">Reginald</span>
                <span className="anon-arrow">&rarr;</span>
                <span className="anon-node app">MCP app</span>
              </div>
              <div className="anon-table">
                <div className="anon-table-header">
                  <span>Field</span>
                  <span>Real value</span>
                  <span>Sent to app</span>
                </div>
                <div className="anon-row">
                  <span className="anon-field">Name</span>
                  <span className="anon-real">Sarah Mitchell</span>
                  <span className="anon-token">usr_7x2mK9</span>
                </div>
                <div className="anon-row">
                  <span className="anon-field">Email</span>
                  <span className="anon-real">sarah@gmail.com</span>
                  <span className="anon-token">anon_4f8@rg.id</span>
                </div>
                <div className="anon-row">
                  <span className="anon-field">Phone</span>
                  <span className="anon-real">+1 415 555 0192</span>
                  <span className="anon-token">tel_9pQr</span>
                </div>
                <div className="anon-row">
                  <span className="anon-field">Address</span>
                  <span className="anon-real">248 Oak St, SF</span>
                  <span className="anon-token">loc_3mNx</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Scrambler */}
        <div className="bento-card">
          <h3>Makes their profiles of you useless</h3>
          <p>Reginald generates noise that confuses tracking systems, scrambling the detailed picture companies build of you.</p>
          <div className="visual">
            <div className="scramble-visual">
              <div className="profile-col before">
                <h5>What they know</h5>
                <div className="profile-field"><span className="k">Age</span><span className="v">32</span></div>
                <div className="profile-field"><span className="k">Income</span><span className="v">$85k</span></div>
                <div className="profile-field"><span className="k">Interests</span><span className="v">Hiking, Crypto</span></div>
                <div className="profile-field"><span className="k">Politics</span><span className="v">Moderate</span></div>
              </div>
              <div className="arrow-col">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14m-4-4 4 4-4 4" /></svg>
              </div>
              <div className="profile-col after">
                <h5>What they see now</h5>
                <div className="profile-field"><span className="k">Age</span><span className="v scrambled">19? 47?</span></div>
                <div className="profile-field"><span className="k">Income</span><span className="v scrambled">??k</span></div>
                <div className="profile-field"><span className="k">Interests</span><span className="v scrambled">Knitting? Cars?</span></div>
                <div className="profile-field"><span className="k">Politics</span><span className="v scrambled">???</span></div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <section className="stats-section" id="how">
        <div className="stats-header">
          <p>The scale of the problem is hard to overstate</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><div className="num">3.2B</div><div className="desc">data points collected per person, per year</div></div>
          <div className="stat-card"><div className="num">92%</div><div className="desc">of terms of service contain hidden data-sharing clauses</div></div>
          <div className="stat-card"><div className="num">340%</div><div className="desc">year-over-year increase in CEO impersonation scams</div></div>
          <div className="stat-card"><div className="num">150+</div><div className="desc">terms of service the average person agrees to per year, unread</div></div>
        </div>
      </section>

      <section className="bottom-grid" id="about">
        <div className="bottom-card">
          <h3>Always on, never in the way</h3>
          <p>Reginald works in the background. No dashboards to check, no settings to tune. It just handles things.</p>
          <div className="card-visual"><div className="card-visual-gradient v1" /></div>
        </div>
        <div className="bottom-card">
          <h3>Your data stays yours</h3>
          <p>Nothing leaves your device without your say. Reginald is built to protect your privacy, not collect from it.</p>
          <div className="card-visual"><div className="card-visual-gradient v2" /></div>
        </div>
        <div className="bottom-card">
          <h3>Gets smarter over time</h3>
          <p>The more Reginald sees, the better it gets at spotting what doesn&rsquo;t belong. Adapts to your habits, not the other way around.</p>
          <div className="card-visual"><div className="card-visual-gradient v3" /></div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Take back your digital life</h2>
        <p>Create a free account. Install the extension and you&rsquo;re protected.</p>
        <button onClick={openModal} className="btn-warm" style={{ fontSize: '1.1rem', padding: '1.1rem 2rem' }}>Get early access</button>
      </section>

      <footer>
        <div className="footer-inner">
          <span className="footer-logo">Reginald</span>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <Link href="/login">Sign in</Link>
            <a href="mailto:hello@getreginald.com">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
