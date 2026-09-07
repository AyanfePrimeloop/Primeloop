import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', whatsapp: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSignup() {
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const res = await fetch('/api/engagers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authUserId: data.user.id, fullName: form.fullName, whatsapp: form.whatsapp }),
    });
    const regData = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(regData.error);
      return;
    }

    // Sign-up may require email confirmation depending on your Supabase
    // Auth settings — if so, Supabase shows its own confirmation prompt.
    router.push('/engager/dashboard');
  }

  return (
    <div className="app" style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Create your engager account</h1>
      <div className="section" style={{ padding: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Full name</label>
          <input style={{ width: '100%' }} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>WhatsApp number</label>
          <input style={{ width: '100%' }} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Email</label>
          <input style={{ width: '100%' }} value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Password</label>
          <input type="password" style={{ width: '100%' }} value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        <button className="btn accent" style={{ width: '100%' }} onClick={handleSignup} disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
}
