import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';
import { pixelLead } from '../lib/metaPixel';

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', whatsapp: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSignup() {
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/engager/dashboard` },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const res = await fetch('/api/engagers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authUserId: data.user.id,
        fullName: form.fullName,
        whatsapp: form.whatsapp,
        referredByCode: router.query.ref || null,
      }),
    });
    const regData = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(regData.error);
      return;
    }

    pixelLead();

    // If Supabase's "Confirm email" setting is OFF, signUp already returns an
    // active session and they can go straight in. If it's ON (the usual
    // default), there's no session yet — they need to click the email link first.
    if (data.session) {
      router.push('/engager/dashboard');
    } else {
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="app" style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo size={44} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center' }}>Check your email</h1>
        <div className="section" style={{ padding: 20 }}>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            We've sent a confirmation link to <strong>{form.email}</strong>. Look for an email from
            Primeloop (it will come from Supabase's sending address on our behalf, so check your
            spam or promotions folder if it doesn't show up in a minute or two). Click the link
            inside, and it'll take you straight to your dashboard — no need to come back here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{ maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Logo size={44} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center' }}>Create your engager account</h1>
      {router.query.ref && (
        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--good)', marginTop: -8, marginBottom: 12 }}>
          Referred by {router.query.ref}
        </p>
      )}
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
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Password</label>
          <input type="password" style={{ width: '100%' }} value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginBottom: 14 }}>
          After you submit, we'll email {form.email || 'you'} a confirmation link to finish setting
          up your account.
        </p>
        <button className="btn accent" style={{ width: '100%' }} onClick={handleSignup} disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        <p style={{ fontSize: 12.5, marginTop: 14, textAlign: 'center' }}>
          Already have an account? <a href="/login" style={{ color: 'var(--navy)' }}>Log in</a>
        </p>
      </div>
    </div>
  );
}

