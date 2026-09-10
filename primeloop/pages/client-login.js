import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';
import WhatsAppButton from '../components/WhatsAppButton';

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
    <div className="app" style={{ maxWidth: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Logo size={44} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center' }}>Track your order</h1>
      <div className="section" style={{ padding: 20, marginTop: 16 }}>
        {sent ? (
          <p style={{ fontSize: 13.5, color: 'var(--good)' }}>
            Check <strong>{email}</strong> for a link from Primeloop (sent via Supabase Auth on
            our behalf — check spam/promotions if it doesn't show up in a minute). Click it to
            see your order progress.
          </p>
        ) : rateLimited ? (
          <>
            <p style={{ fontSize: 13.5, color: 'var(--warn)' }}>
              We've hit a temporary limit on how many login emails can go out right now — this
              isn't a problem with your account. Please try again in a few minutes, or reach an
              admin directly below and we'll pull up your order for you in the meantime.
            </p>
          </>
        ) : (
          <>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>
              Email you used at checkout
            </label>
            <input style={{ width: '100%', marginBottom: 14 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            <button className="btn primary" style={{ width: '100%' }} onClick={sendLink} disabled={loading || !email}>
              {loading ? 'Sending...' : 'Send me a login link'}
            </button>
            {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
            <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 12 }}>
              No password needed — we'll email you a one-click link from Primeloop via Supabase Auth.
            </p>
          </>
        )}
      </div>
      <WhatsAppButton />
    </div>
  );
}

