import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    // The emailed link should log the browser into a temporary recovery
    // session automatically. We explicitly confirm that actually happened
    // before showing the password form — if we skip this check, updateUser
    // can silently do nothing when there's no session, which is what was
    // showing up later as a confusing "invalid login credentials" error at
    // the NEXT login attempt instead of a clear error right here.
    (async () => {
      // Handles the PKCE-style link (a "code" in the URL) explicitly, since
      // this doesn't always get picked up automatically after a redirect.
      if (router.query.code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(String(router.query.code));
        if (exchangeErr) {
          setError('This link has expired or was already used. Request a new one below.');
          setCheckingLink(false);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSessionReady(true);
      } else {
        setError(
          "This link doesn't seem valid anymore — it may have expired, already been used, or been opened on a different device/browser than the one you requested it from. Request a new one below."
        );
      }
      setCheckingLink(false);
    })();
  }, [router.query.code]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updatePassword() {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  return (
    <div className="app" style={{ maxWidth: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Logo size={44} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center' }}>Set a new password</h1>
      <div className="section" style={{ padding: 20, marginTop: 16 }}>
        {checkingLink ? (
          <p style={{ fontSize: 13.5, color: 'var(--ink-mute)' }}>Checking your link...</p>
        ) : done ? (
          <p style={{ fontSize: 13.5, color: 'var(--good)' }}>Password updated — taking you to log in...</p>
        ) : sessionReady ? (
          <>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>New password</label>
            <input type="password" style={{ width: '100%', marginBottom: 14 }} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn primary" style={{ width: '100%' }} onClick={updatePassword} disabled={loading || !password}>
              {loading ? 'Saving...' : 'Save new password'}
            </button>
            {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
          </>
        ) : (
          <>
            <p style={{ color: 'var(--warn)', fontSize: 13.5 }}>{error}</p>
            <a href="/forgot-password" className="btn primary" style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none', marginTop: 10 }}>
              Request a new link
            </a>
          </>
        )}
      </div>
    </div>
  );
}

