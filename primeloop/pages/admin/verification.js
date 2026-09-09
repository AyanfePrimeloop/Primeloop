import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];
const MODES = [
  { value: 'manual', label: 'Manual (no AI, human review queue)' },
  { value: 'ai_always', label: 'AI checks every submission' },
  { value: 'ai_sampled', label: 'AI checks a random sample' },
];

export default function VerificationSettings() {
  const { loading } = useRequireRole('admin');
  const [platform, setPlatform] = useState('facebook');
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    if (loading) return;
    authedFetch(`/api/admin/verification-settings?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || []));
  }, [platform, loading]);

  function updateLocal(id, field, value) {
    setSettings((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function save(setting) {
    await authedFetch('/api/admin/verification-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: setting.id, mode: setting.mode, sample_rate: setting.sample_rate }),
    });
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app">
      <AdminNav />
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Verification settings</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        Everything starts on Manual. Turn on AI checking only where it's worth the cost — see the cost math in the README.
      </p>

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
            {s.mode === 'ai_sampled' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  style={{ width: 60 }}
                  value={Math.round(s.sample_rate * 100)}
                  onChange={(e) => updateLocal(s.id, 'sample_rate', +e.target.value / 100)}
                />
                <span style={{ fontSize: 12 }}>%</span>
              </div>
            )}
            <button className="btn" onClick={() => save(s)}>Save</button>
          </div>
        ))}
      </div>
    </div>
  );
}
