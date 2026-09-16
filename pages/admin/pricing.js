import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];

export default function AdminPricing() {
  const { loading, me } = useRequireRole('admin');
  const [platform, setPlatform] = useState('facebook');
  const [rules, setRules] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loading) return;
    fetch(`/api/admin/pricing?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => setRules(d.rules || []));
  }, [platform, loading]);

  function updateLocal(id, field, value) {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function save(rule) {
    await authedFetch('/api/admin/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, client_price: rule.client_price, engager_payout: rule.engager_payout }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app">
      <AdminNav />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Pricing management</h1>
        <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{me?.email}</span>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--ink-mute)' }}>
              <th style={{ padding: '10px 20px' }}>Action</th>
              <th style={{ padding: '10px 20px' }}>Client price (₦)</th>
              <th style={{ padding: '10px 20px' }}>Engager payout (₦)</th>
              <th style={{ padding: '10px 20px' }}>Margin</th>
              <th style={{ padding: '10px 20px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => {
              const margin = r.client_price ? Math.round(((r.client_price - r.engager_payout) / r.client_price) * 100) : 0;
              return (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 20px', textTransform: 'capitalize' }}>{r.action}</td>
                  <td style={{ padding: '10px 20px' }}>
                    <input
                      type="number"
                      style={{ width: 80 }}
                      value={r.client_price}
                      onChange={(e) => updateLocal(r.id, 'client_price', +e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <input
                      type="number"
                      style={{ width: 80 }}
                      value={r.engager_payout}
                      onChange={(e) => updateLocal(r.id, 'engager_payout', +e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '10px 20px' }}>{margin}%</td>
                  <td style={{ padding: '10px 20px' }}>
                    <button className="btn" onClick={() => save(r)}>Save</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {saved && <p style={{ color: 'var(--good)', fontSize: 13 }}>Saved.</p>}
    </div>
  );
}
