import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendReset() {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="app" style={{ maxWidth: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Logo size={44} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center' }}>Reset your password</h1>
      <div className="section" style={{ padding: 20, marginTop: 16 }}>
        {sent ? (
          <p style={{ fontSize: 13.5, color: 'var(--good)' }}>
            Check <strong>{email}</strong> for an email from Primeloop (sent via Supabase Auth on
            our behalf — look for a sender like "Supabase Auth" or "noreply@mail.app.supabase.io"
            if you don't see "Primeloop" directly). It may land in spam or promotions, so check
            those folders if it doesn't appear within a minute or two. Click the link inside to
            set a new password.
          </p>
        ) : (
          <>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Your account email</label>
            <input style={{ width: '100%', marginBottom: 14 }} value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn primary" style={{ width: '100%' }} onClick={sendReset} disabled={loading || !email}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
          </>
        )}
        <p style={{ fontSize: 12.5, marginTop: 14, textAlign: 'center' }}>
          <a href="/login" style={{ color: 'var(--navy)' }}>Back to log in</a>
        </p>
      </div>
    </div>
  );
}
