import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];
const MODES = [
  { value: 'manual', label: 'Manual (no AI, human review queue)' },
  { value: 'ai_always', label: 'AI checks every submission' },
  { value: 'ai_sampled', label: 'AI checks a random sample' },
  { value: 'trust_based', label: 'Trust-based (recommended)' },
];

export default function VerificationSettings() {
  const { loading, me } = useRequireRole('admin');
  const [platform, setPlatform] = useState('facebook');
  const [settings, setSettings] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (loading || me?.admin?.role !== 'super_admin') return;
    authedFetch(`/api/admin/verification-settings?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || []));
  }, [platform, loading]);

  function updateLocal(id, field, value) {
    setSettings((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function useTrustEverywhere() {
    if (!window.confirm('Switch every platform and action to Trust-based checking, with a 20% spot-check on trusted engagers? New engagers will be checked by AI, and this uses your Anthropic credit.')) return;
    const res = await authedFetch('/api/admin/verification-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true, mode: 'trust_based', sample_rate: 0.2 }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setNote(d.error || 'Could not save. Run migration 15 in Supabase first.');
    setNote('Done. Every action now uses trust-based checking.');
    const r = await authedFetch('/api/admin/verification-settings?platform=' + platform);
    setSettings((await r.json()).settings || []);
  }

  async function save(setting) {
    await authedFetch('/api/admin/verification-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: setting.id, mode: setting.mode, sample_rate: setting.sample_rate }),
    });
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  if (!me?.admin || me.admin.role !== 'super_admin') {
    return (
      <div className="app">
        <AdminNav />
        <div className="section" style={{ padding: 20, color: 'var(--ink-mute)' }}>This page is restricted to super-admins.</div>
      </div>
    );
  }


  return (
    <div className="app">
      <AdminNav />
      <h1 style={{ fontSize: 30 }}>Verification settings</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        <strong>Trust-based</strong> is the recommended setting. New engagers have every screenshot checked by AI.
        Once someone has 20 approved tasks and a clean record, most of their proof is approved automatically and
        a random share is still checked. Follows, subscribes, comments and replies are always checked, because comment quality is what clients pay for. If the AI is not sure, or
        would reject, a person looks at it, so an honest engager is never turned down by a model's mistake.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '12px 0 0' }}>
        <button className="btn accent" onClick={useTrustEverywhere}>Use trust-based everywhere</button>
        {note && <span role="status" style={{ fontSize: 14, color: 'var(--good)' }}>{note}</span>}
      </div>

      <div style={{ display: 'flex', gap: 6, margin: '16px 0', flexWrap: 'wrap' }}>
        {PLATFORMS.map((p) => (
          <button
            key={p}
            className="btn"
            style={p === platform ? { background: 'var(--navy)', color: '#fff' } : {}}
            onClick={() => setPlatform(p)}
          >
            {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="section">
        {settings.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 100, textTransform: 'capitalize', fontWeight: 500 }}>{s.action}</div>
            <select
              value={s.mode}
              onChange={(e) => updateLocal(s.id, 'mode', e.target.value)}
              style={{ flex: 1 }}
            >
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {(s.mode === 'ai_sampled' || s.mode === 'trust_based') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title={s.mode === 'trust_based' ? 'Share of trusted engagers\' proof that is still AI-checked' : 'Share of submissions checked by AI'}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  style={{ width: 60 }}
                  value={Math.round(s.sample_rate * 100)}
                  onChange={(e) => updateLocal(s.id, 'sample_rate', +e.target.value / 100)}
                />
                <span style={{ fontSize: 14 }}>{s.mode === 'trust_based' ? '% spot-check' : '%'}</span>
              </div>
            )}
            <button className="btn" onClick={() => save(s)}>Save</button>
          </div>
        ))}
      </div>
    </div>
  );
}
