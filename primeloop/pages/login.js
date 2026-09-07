import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { authedFetch } from '../lib/authClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    const res = await authedFetch('/api/auth/whoami');
    const data = await res.json();
    setLoading(false);
    if (data.role === 'admin') router.push('/admin/pricing');
    else if (data.role === 'engager') router.push('/engager/dashboard');
    else setError("This login isn't set up as an admin or engager account yet.");
  }

  return (
    <div className="app" style={{ maxWidth: 380 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Log in</h1>
      <div className="section" style={{ padding: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Email</label>
          <input style={{ width: '100%' }} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Password</label>
          <input type="password" style={{ width: '100%' }} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn primary" style={{ width: '100%' }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
        {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        <p style={{ fontSize: 12.5, marginTop: 14 }}>
          New engager? <a href="/signup">Create an account</a>
        </p>
      </div>
    </div>
  );
}
