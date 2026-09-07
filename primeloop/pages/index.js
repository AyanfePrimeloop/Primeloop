import { useState, useEffect } from 'react';

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];

export default function ClientLanding() {
  const [platform, setPlatform] = useState('facebook');
  const [rules, setRules] = useState([]);
  const [selected, setSelected] = useState({}); // { like: { checked, qty } }
  const [postLink, setPostLink] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`/api/admin/pricing?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => {
        setRules(d.rules || []);
        const initial = {};
        (d.rules || []).forEach((r) => (initial[r.action] = { checked: false, qty: 30 }));
        setSelected(initial);
      });
  }, [platform]);

  const total = rules.reduce((sum, r) => {
    const s = selected[r.action];
    return s?.checked ? sum + s.qty * r.client_price : sum;
  }, 0);

  async function checkout() {
    setErrorMsg('');
    if (!email || !postLink) {
      setErrorMsg('Add your email and post link.');
      return;
    }
    const items = rules
      .filter((r) => selected[r.action]?.checked)
      .map((r) => ({ action: r.action, quantity: selected[r.action].qty }));
    if (!items.length) {
      setErrorMsg('Select at least one engagement type.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, platform, postLink, items }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(data.error || 'Something went wrong');
      return;
    }
    window.location.href = data.authorization_url; // send them to Paystack
  }

  return (
    <div className="app">
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>Real people. Real engagement.</h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        No bots. Every like, comment and share comes from a trained, verified engager.
      </p>

      <div className="section">
        <div className="section-head">
          <h2>Build your order</h2>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
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

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Your email</label>
            <input style={{ width: '100%' }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Post link</label>
            <input style={{ width: '100%' }} value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder="https://facebook.com/..." />
          </div>

          {rules.map((r) => (
            <div key={r.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <input
                type="checkbox"
                checked={!!selected[r.action]?.checked}
                onChange={(e) =>
                  setSelected((s) => ({ ...s, [r.action]: { ...s[r.action], checked: e.target.checked } }))
                }
              />
              <div style={{ flex: 1, textTransform: 'capitalize' }}>{r.action}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>₦{r.client_price}/unit</div>
              <input
                type="number"
                style={{ width: 70 }}
                value={selected[r.action]?.qty || 30}
                onChange={(e) =>
                  setSelected((s) => ({ ...s, [r.action]: { ...s[r.action], qty: +e.target.value } }))
                }
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>₦{total.toLocaleString()}</div>
            <button className="btn accent" onClick={checkout} disabled={loading}>
              {loading ? 'Redirecting...' : 'Pay with Paystack'}
            </button>
          </div>
          {errorMsg && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}
