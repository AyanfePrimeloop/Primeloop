import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import AuthShell from '../components/AuthShell';
import ChannelInvite from '../components/ChannelInvite';
import { pixelLead } from '../lib/metaPixel';
import { gaSignUp } from '../lib/ga';

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

    // For an email that already has an account, Supabase deliberately returns a
    // look-alike user (no identities) instead of an error, so it can't be used
    // to discover who is registered. That fake id would fail registration with
    // a confusing message, so catch it here.
    if (Array.isArray(data.user?.identities) && data.user.identities.length === 0) {
      setError("This email already has a Primeloop account, for example from placing an order. Log in with it and you can add earning from your dashboard. No password? Use Forgot password, or the order-email login on the Log in page.");
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
      setError(
        regData.error === 'Invalid signup session'
          ? "We couldn't finish setting up your account. If you've signed up with this email before, please log in instead."
          : regData.error
      );
      return;
    }

    pixelLead();
    gaSignUp();

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
      <AuthShell title="Check your email" pageTitle="Check your email — Primeloop">
        <p className="auth-ok" style={{ marginTop: 28, color: 'var(--ink-soft)' }}>
          We've sent a confirmation link to <strong>{form.email}</strong>. Look for an email from
          Primeloop. If it isn't there within a minute or two, check your spam or promotions
          folder. Click the link inside and it'll take you straight to your dashboard — no need
          to come back here.
        </p>
        <ChannelInvite compact />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your engager account"
      subtitle={router.query.ref ? `Referred by ${router.query.ref}` : 'Free to join. Paid every Friday.'}
      pageTitle="Create your engager account — Primeloop"
    >
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); if (!loading) handleSignup(); }}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="su-name">Full name</label>
          <input id="su-name" className="auth-input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="su-wa">WhatsApp number</label>
          <input id="su-wa" className="auth-input" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} autoComplete="tel" inputMode="tel" />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="su-email">Email</label>
          <input id="su-email" type="email" className="auth-input" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" autoCapitalize="none" inputMode="email" />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="su-pw">Password</label>
          <input id="su-pw" type="password" className="auth-input" value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
          <p className="auth-hint">
            After you submit, we'll email {form.email || 'you'} a confirmation link to finish setting
            up your account.
          </p>
        </div>
        <button type="submit" className="btn accent auth-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}
      </form>
      <p className="auth-alt">Already have an account? <a href="/login">Log in</a></p>
    </AuthShell>
  );
}
