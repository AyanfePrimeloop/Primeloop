import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthShell from '../components/AuthShell';
import SiteWhatsApp from '../components/SiteWhatsApp';

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendLink() {
    setLoading(true);
    setError('');
    setRateLimited(false);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/client/dashboard` },
    });
    setLoading(false);
    if (err) {
      // Supabase's shared email sender has a strict limit on how many login
      // emails can go out per hour on the free tier — this shows up as a
      // rate-limit error, not anything wrong with the person's email or
      // account. Give them a real way forward instead of a dead end.
      if (/rate limit/i.test(err.message)) {
        setRateLimited(true);
      } else {
        setError(err.message);
      }
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell title="Track your order" subtitle="No password needed. We email you a one-click link." pageTitle="Track your order — Primeloop" photo="trial-creator" photoPosition="50% 35%">
      {sent ? (
        <p className="auth-ok" style={{ marginTop: 28 }}>
          Check <strong>{email}</strong> for an email from Primeloop with your login link. If it
          isn't there within a minute, look in your spam or promotions folder. Click the link to
          see your order progress.
        </p>
      ) : rateLimited ? (
        <p className="auth-error" style={{ marginTop: 28 }}>
          We've hit a temporary limit on how many login emails can go out right now — this
          isn't a problem with your account. Please try again in a few minutes, or reach an
          admin directly below and we'll pull up your order for you in the meantime.
        </p>
      ) : (
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); if (!loading && email) sendLink(); }}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="client-login-email">Email you used at checkout</label>
            <input id="client-login-email" type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" autoCapitalize="none" inputMode="email" />
          </div>
          <button type="submit" className="btn accent auth-btn" disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send me a login link'}
          </button>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
      )}
      <p className="auth-alt">Engager or admin? <a href="/login">Log in with a password</a></p>
      <SiteWhatsApp />
    </AuthShell>
  );
}
