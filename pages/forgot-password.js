import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthShell from '../components/AuthShell';

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
    <AuthShell title="Reset your password" subtitle="Enter your account email and we'll send you a reset link." pageTitle="Reset your password — Primeloop">
      {sent ? (
        <p className="auth-ok" style={{ marginTop: 28 }}>
          Check <strong>{email}</strong> for an email from Primeloop. If it isn't there within a
          minute or two, look in your spam or promotions folder. Click the link inside to set a
          new password.
        </p>
      ) : (
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); if (!loading && email) sendReset(); }}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="forgot-email">Your account email</label>
            <input id="forgot-email" type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" inputMode="email" />
          </div>
          <button type="submit" className="btn accent auth-btn" disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
      )}
      <p className="auth-alt"><a href="/login">Back to log in</a></p>
    </AuthShell>
  );
}
