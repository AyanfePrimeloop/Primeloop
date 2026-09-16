import { useState, useEffect } from 'react';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import Logo from '../../components/Logo';

export default function EngagerProfile() {
  const { loading } = useRequireRole('engager');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loading) {
      authedFetch('/api/engager/profile')
        .then((r) => r.json())
        .then((d) => {
          setFullName(d.engager?.full_name || '');
          setWhatsapp(d.engager?.whatsapp || '');
          setPlatforms(d.platforms || []);
        });
    }
  }, [loading]);

  async function save() {
    setSaving(true);
    const res = await authedFetch('/api/engager/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, whatsapp }),
    });
    const data = await res.json();
    setSaving(false);
    setResult(data);
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app" style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Logo size={28} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Your profile</h1>
      </div>

      <div className="section">
        <div className="section-head"><h2>Basic details</h2></div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Full name</label>
            <input style={{ width: '100%' }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>WhatsApp number</label>
            <input style={{ width: '100%' }} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {result?.error && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{result.error}</p>}
          {result?.engager && <p style={{ color: 'var(--good)', fontSize: 13, marginTop: 10 }}>Saved.</p>}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Your platform pages</h2></div>
        {platforms.length === 0 && (
          <p style={{ padding: 20, color: 'var(--ink-mute)', fontSize: 13 }}>
            No platforms registered yet — complete onboarding for a platform to add one.
          </p>
        )}
        {platforms.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{p.platform}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{p.profile_name} — {p.profile_link}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge" style={{
                background: p.verification_status === 'verified' ? 'var(--good-soft)' : 'var(--warn-soft)',
                color: p.verification_status === 'verified' ? 'var(--good)' : 'var(--warn)',
              }}>
                {p.verification_status}
              </span>
              <a href={`/onboarding/${p.platform}`} className="btn" style={{ fontSize: 11.5, textDecoration: 'none' }}>
                Update page
              </a>
            </div>
          </div>
        ))}
        <p style={{ padding: '12px 20px', fontSize: 11.5, color: 'var(--ink-mute)' }}>
          Changing a page link here means it's a different account than what was verified before —
          you'll need to redo the onboarding test for it.
        </p>
      </div>

      <p style={{ textAlign: 'center' }}>
        <a href="/engager/dashboard" style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Back to dashboard</a>
      </p>
    </div>
  );
}
