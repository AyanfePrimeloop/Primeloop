import { useState } from 'react';
import { useRouter } from 'next/router';
import AuthShell from '../components/AuthShell';
import { useRequireRole, authedFetch } from '../lib/authClient';

// For someone who is already signed in (e.g. a client) and wants to earn too.
// The same login then opens both dashboards.
export default function BecomeEngager() {
  const router = useRouter();
  const { loading } = useRequireRole('client');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError('');
    const res = await authedFetch('/api/engagers/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, whatsapp, referredByCode: router.query.ref || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Something went wrong. Please try again.');
      setBusy(false);
      return;
    }
    router.push('/engager/dashboard');
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <AuthShell
      title="Earn with the same login"
      subtitle="Add an engager profile to your account. Free to join, paid every Friday."
      pageTitle="Become an engager — Primeloop"
    >
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); if (!busy) submit(); }}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="be-name">Full name</label>
          <input id="be-name" className="auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="be-wa">WhatsApp number</label>
          <input id="be-wa" className="auth-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="08012345678" />
        </div>
        <button type="submit" className="btn accent auth-btn" disabled={busy || !fullName.trim() || !whatsapp}>
          {busy ? 'Creating...' : 'Create my engager profile'}
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </form>
      <p className="auth-alt"><a href="/client/dashboard">Back to my orders</a></p>
    </AuthShell>
  );
}
