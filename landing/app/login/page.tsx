'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Serif+Display&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --cream: #f5f2e3; --cream-dark: #e5e2d1; --ink: #251400; --ink-light: #8d8372; --rust: #b85c38; }
  body { font-family: 'DM Sans', Arial, sans-serif; background: var(--cream); color: var(--ink); -webkit-font-smoothing: antialiased; }
  .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; }
  .logo { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: var(--ink); text-decoration: none; display: block; text-align: center; margin-bottom: 2.5rem; }
  .card { background: var(--cream-dark); border-radius: 14px; padding: 2.5rem; width: 100%; max-width: 400px; }
  .card h1 { font-family: 'DM Serif Display', serif; font-size: 1.75rem; font-weight: 400; margin-bottom: 0.4rem; }
  .card-sub { font-size: 0.9rem; color: var(--ink-light); margin-bottom: 2rem; }
  .field { margin-bottom: 1.25rem; }
  .field label { display: block; font-size: 0.72rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-light); margin-bottom: 0.5rem; }
  .field input { width: 100%; background: var(--cream); border: 1px solid rgba(37,20,0,0.15); border-radius: 8px; padding: 0.75rem 1rem; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: var(--ink); outline: none; }
  .field input:focus { border-color: var(--ink); }
  .field input::placeholder { color: var(--ink-light); opacity: 0.5; }
  .error { font-size: 0.85rem; color: var(--rust); margin-bottom: 1rem; }
  .btn { width: 100%; background: #000; color: var(--cream); border: none; border-radius: 100px; padding: 0.9rem 1.5rem; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; margin-top: 0.5rem; }
  .btn:hover { opacity: 0.85; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .footer-link { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--ink-light); }
  .footer-link a { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{S}</style>
      <div className="page">
        <Link href="/" className="logo">Reginald</Link>
        <div className="card">
          <h1>Sign in</h1>
          <p className="card-sub">Welcome back.</p>
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="footer-link">No account? <Link href="/signup">Create one</Link></p>
        </div>
      </div>
    </>
  );
}
