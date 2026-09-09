import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    setLoading(true);
    setError('');
    // Clicking the emailed link already logs them into a temporary recovery
    // session — this just sets the new password on that same session.
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
        {done ? (
          <p style={{ fontSize: 13.5, color: 'var(--good)' }}>Password updated — taking you to log in...</p>
        ) : (
          <>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>New password</label>
            <input type="password" style={{ width: '100%', marginBottom: 14 }} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn primary" style={{ width: '100%' }} onClick={updatePassword} disabled={loading || !password}>
              {loading ? 'Saving...' : 'Save new password'}
            </button>
            {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
