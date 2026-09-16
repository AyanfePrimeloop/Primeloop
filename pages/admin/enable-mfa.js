import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRequireRole } from '../../lib/authClient';
import AdminNav from '../../components/AdminNav';

export default function EnableMFA() {
  const { loading } = useRequireRole('admin');
  const [factors, setFactors] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [factorId, setFactorId] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading) refreshFactors();
  }, [loading]);

  async function refreshFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp || []);
  }

  async function startEnrollment() {
    setError('');
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (err) {
      setError(err.message);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setEnrolling(true);
  }

  async function confirmEnrollment() {
    setError('');
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) {
      setError(challengeErr.message);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyErr) {
      setError('That code didn\'t match — check your authenticator app and try again.');
      return;
    }
    setDone(true);
    setEnrolling(false);
    refreshFactors();
  }

  async function removeFactor(id) {
    if (!confirm('Remove two-factor authentication? Your account will only need a password to log in.')) return;
    await supabase.auth.mfa.unenroll({ factorId: id });
    refreshFactors();
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  const hasFactor = factors.some((f) => f.status === 'verified');

  return (
    <div className="app" style={{ maxWidth: 460 }}>
      <AdminNav />
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Two-factor authentication</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        Adds a second step at login using an authenticator app (Google Authenticator, Authy,
        etc.) — recommended for every admin, required for handling real payouts safely.
      </p>

      {hasFactor && !enrolling && (
        <div className="section" style={{ padding: 20 }}>
          <p style={{ color: 'var(--good)', fontSize: 13.5, marginBottom: 12 }}>
            ✓ Two-factor authentication is active on this account.
          </p>
          {factors.filter((f) => f.status === 'verified').map((f) => (
            <button key={f.id} className="btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} onClick={() => removeFactor(f.id)}>
              Remove 2FA
            </button>
          ))}
        </div>
      )}

      {!hasFactor && !enrolling && (
        <div className="section" style={{ padding: 20 }}>
          <button className="btn primary" onClick={startEnrollment}>Set up two-factor authentication</button>
        </div>
      )}

      {enrolling && (
        <div className="section" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
            Scan this with your authenticator app, then enter the 6-digit code it shows.
          </p>
          {qrCode && <img src={qrCode} alt="Scan with your authenticator app" style={{ width: 180, height: 180, marginBottom: 14 }} />}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>6-digit code</label>
            <input style={{ width: '100%' }} value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="000000" />
          </div>
          <button className="btn primary" onClick={confirmEnrollment} disabled={code.length !== 6}>Confirm</button>
          {error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{error}</p>}
        </div>
      )}

      {done && <p style={{ color: 'var(--good)', fontSize: 13 }}>Two-factor authentication is now active.</p>}
    </div>
  );
}
