import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { authedFetch } from '../lib/authClient';
import Logo from '../components/Logo';

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
      <div className="app" style={{ maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo size={44} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center' }}>Enter your 2FA code</h1>
        <div className="section" style={{ padding: 20 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>6-digit code from your authenticator app</label>
          <input style={{ width: '100%', marginBottom: 14 }} value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} maxLength={6} placeholder="000000" />
          <button className="btn primary" style={{ width: '100%' }} onClick={submitMfaCode} disabled={loading || mfaCode.length !== 6}>
            {loading ? 'Verifying...' : 'Verify and log in'}
          </button>
          {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{ maxWidth: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Logo size={44} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center' }}>Log in</h1>
      <div className="section" style={{ padding: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Email</label>
          <input style={{ width: '100%' }} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Password</label>
          <input type="password" style={{ width: '100%' }} value={password} onChange={(e) => setPassword(e.target.value)} />
          <a href="/forgot-password" style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>Forgot password?</a>
        </div>
        <button className="btn primary" style={{ width: '100%' }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        <p style={{ fontSize: 12.5, marginTop: 14 }}>
          New engager? <a href="/signup">Create an account</a>
        </p>
        <p style={{ fontSize: 12.5, marginTop: 6 }}>
          Tracking an order as a client? <a href="/client-login">Use your order email instead</a>
        </p>
      </div>
    </div>
  );
}

