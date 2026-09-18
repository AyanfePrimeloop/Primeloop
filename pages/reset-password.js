import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import AuthShell from '../components/AuthShell';

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
    <AuthShell title="Set a new password" pageTitle="Set a new password — Primeloop">
      {checkingLink ? (
        <p className="auth-sub">Checking your link...</p>
      ) : done ? (
        <p className="auth-ok" style={{ marginTop: 28 }}>Password updated — taking you to log in...</p>
      ) : sessionReady ? (
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); if (!loading && password) updatePassword(); }}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <button type="submit" className="btn accent auth-btn" disabled={loading || !password}>
            {loading ? 'Saving...' : 'Save new password'}
          </button>
          {error && <p className="auth-error" role="alert">{error}</p>}
        </form>
      ) : (
        <div className="auth-form">
          <p className="auth-error" style={{ marginTop: 0 }}>{error}</p>
          <a href="/forgot-password" className="btn accent auth-btn" style={{ marginTop: 16 }}>Request a new link</a>
        </div>
      )}
    </AuthShell>
  );
}
