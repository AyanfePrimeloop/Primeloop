import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';

export default function OnboardingTestsAdmin() {
  const { loading } = useRequireRole('admin');
  const [tests, setTests] = useState([]);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (loading) return;
    authedFetch('/api/admin/onboarding-tests')
      .then((r) => r.json())
      .then((d) => setTests(d.tests || []));
  }, [loading]);

  function updateLocal(id, field, value) {
    setTests((ts) => ts.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }

  async function save(test) {
    await authedFetch('/api/admin/onboarding-tests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: test.id,
        post_link: test.post_link,
        required_actions: test.required_actions,
        active: test.active,
      }),
    });
    setSaved(test.id);
    setTimeout(() => setSaved(null), 1500);
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app">
      <AdminNav />
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Engager onboarding tests</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        Post a real, permanent test post for each platform. New engagers must complete every action below on it before they can claim real, paid tasks.
      </p>

      {tests.map((t) => (
        <div className="section" key={t.id}>
          <div className="section-head">
            <h2 style={{ textTransform: 'capitalize' }}>{t.platform}</h2>
            <label style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={t.active} onChange={(e) => updateLocal(t.id, 'active', e.target.checked)} />
              Active
            </label>
          </div>
          <div style={{ padding: 20 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Test post link</label>
            <input
              style={{ width: '100%', marginBottom: 14 }}
              value={t.post_link}
              onChange={(e) => updateLocal(t.id, 'post_link', e.target.value)}
              placeholder={`https://${t.platform}.com/...`}
            />
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Required actions (comma separated)</label>
            <input
              style={{ width: '100%', marginBottom: 14 }}
              value={t.required_actions.join(', ')}
              onChange={(e) => updateLocal(t.id, 'required_actions', e.target.value.split(',').map((s) => s.trim()))}
              placeholder="like, comment, share, follow"
            />
            <button className="btn primary" onClick={() => save(t)}>Save</button>
            {saved === t.id && <span style={{ color: 'var(--good)', fontSize: 12.5, marginLeft: 10 }}>Saved</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
