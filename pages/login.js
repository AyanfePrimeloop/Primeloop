import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { authedFetch } from '../lib/authClient';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function afterFullyAuthenticated() {
    const res = await authedFetch('/api/auth/whoami');
    const data = await res.json();
    setLoading(false);
    const roles = data.roles || [];
    if (roles.length > 1) {
      router.push('/choose-dashboard');
    } else if (roles.includes('admin')) {
      router.push('/admin/pricing');
    } else if (roles.includes('engager')) {
      router.push('/engager/dashboard');
    } else if (roles.includes('client')) {
      router.push('/client/dashboard');
    } else {
      setError("This login isn't set up on Primeloop yet.");
    }
  }

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Password alone only gets you to AAL1. If this account has 2FA
    // enrolled, Supabase requires a second step (AAL2) before the session
    // is fully trusted — this is what makes 2FA actually enforced at login,
    // not just something you can turn on and ignore.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.find((f) => f.status === 'verified');
      setMfaFactorId(factor?.id || null);
      setNeedsMfa(true);
      setLoading(false);
      return;
    }

    await afterFullyAuthenticated();
  }

  async function submitMfaCode() {
    setLoading(true);
    setError('');
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (challengeErr) {
      setError(challengeErr.message);
      setLoading(false);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode,
    });
    if (verifyErr) {
      setError('That code didn\'t match. Check your authenticator app and try again.');
      setLoading(false);
      return;
    }
    await afterFullyAuthenticated();
  }

  if (needsMfa) {
    return (
      <AuthShell title="Enter your 2FA code" subtitle="Open your authenticator app and type the 6-digit code." pageTitle="2FA — Primeloop">
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); if (!loading && mfaCode.length === 6) submitMfaCode(); }}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="mfa-code">6-digit code</label>
            <input id="mfa-code" className="auth-input" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} maxLength={6} placeholder="000000" inputMode="numeric" autoComplete="one-time-code" />
          </div>
          <button type="submit" className="btn accent auth-btn" disabled={loading || mfaCode.length !== 6}>
            {loading ? 'Verifying...' : 'Verify and log in'}
          </button>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Log in" subtitle="Welcome back. Pick up where you left off." pageTitle="Log in — Primeloop">
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); if (!loading) handleLogin(); }}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">Email</label>
          <input id="login-email" type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" inputMode="email" />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">Password</label>
          <input id="login-password" type="password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <p className="auth-hint"><a href="/forgot-password">Forgot password?</a></p>
        </div>
        <button type="submit" className="btn accent auth-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </form>
      <p className="auth-alt">New engager? <a href="/signup">Create an account</a></p>
      <p className="auth-alt" style={{ marginTop: 8 }}>Tracking an order as a client? <a href="/client-login">Use your order email instead</a></p>
    </AuthShell>
  );
}
