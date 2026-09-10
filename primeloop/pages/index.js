import { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import WhatsAppButton from '../components/WhatsAppButton';

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];

export default function ClientLanding() {
  const [platform, setPlatform] = useState('facebook');
  const [rules, setRules] = useState([]);
  const [selected, setSelected] = useState({}); // { like: { checked, qty } }
  const [postLink, setPostLink] = useState('');
  const [email, setEmail] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showVerifyInfo, setShowVerifyInfo] = useState(false);

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
      body: JSON.stringify({ email, platform, postLink, items, specialInstructions }),
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
      <div className="hero">
        <div className="fade-in"><Logo size={40} light /></div>
        <div className="hero-eyebrow fade-in-delay-1" style={{ marginTop: 18 }}>
          1,200+ real trained Nigerian engagers · Facebook, Instagram, TikTok, YouTube, X
        </div>
        <h1 className="fade-in-delay-1">Real people. Real engagement. Posts that actually take off.</h1>
        <p className="fade-in-delay-2">
          No bots, no fake accounts that get you flagged. Every like, comment and share comes
          from a trained, verified engager — and you watch it happen live.
        </p>
        <div className="hero-ctas fade-in-delay-3">
          <a href="#order" className="btn accent pulse" style={{ textDecoration: 'none' }}>See packages</a>
          <button className="btn" style={{ background: 'transparent', color: '#c4c9ec', borderColor: 'rgba(255,255,255,.25)' }} onClick={() => setShowVerifyInfo(true)}>
            How verification works
          </button>
        </div>
        <div className="trust-row fade-in-delay-3">
          <div className="trust-item"><span className="n">98.6%</span> approval rate</div>
          <div className="trust-item"><span className="n">4–12 min</span> to first engagement</div>
          <div className="trust-item"><span className="n">100%</span> money-back guarantee</div>
          <div className="trust-item"><span className="n">5</span> platforms live</div>
        </div>
      </div>

      {showVerifyInfo && (
        <div className="section" style={{ padding: 20, background: 'var(--paper)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>How verification works</h3>
            <button className="btn" style={{ fontSize: 11.5 }} onClick={() => setShowVerifyInfo(false)}>Close</button>
          </div>
          <div className="step-row"><div className="step-num">1</div><div><strong>Engager completes your task</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>A real, trained engager account does the action.</div></div></div>
          <div className="step-row"><div className="step-num">2</div><div><strong>Screenshot proof submitted</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Uploaded straight from their device.</div></div></div>
          <div className="step-row"><div className="step-num">3</div><div><strong>Checked automatically</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Confirms the action was really done on your post and screens for duplicates.</div></div></div>
          <div className="step-row"><div className="step-num">4</div><div><strong>You watch it happen live</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Your progress updates in real time as engagements are approved.</div></div></div>
        </div>
      )}

      <div className="proof-strip fade-in-delay-3">
        <div className="proof-card">
          <div className="stars">★★★★★</div>
          <div className="quote">"Comments looked genuinely like customers, not spam."</div>
          <div className="who">Chidinma O., skincare brand</div>
        </div>
        <div className="proof-card">
          <div className="stars">★★★★★</div>
          <div className="quote">"I can actually see the progress bar move instead of just hoping it's working."</div>
          <div className="who">Tunde A., content creator</div>
        </div>
        <div className="proof-card">
          <div className="stars">★★★★★</div>
          <div className="quote">"Switched from a bot panel after a page warning. No issues since."</div>
          <div className="who">Grace E., small business owner</div>
        </div>
      </div>

      <div className="section" id="order">
        <div className="section-head">
          <h2>Build your order</h2>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>
              Extra instructions <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              style={{ width: '100%', minHeight: 70, fontFamily: 'inherit', fontSize: 13, padding: '9px 10px', border: '1px solid var(--line-strong)', borderRadius: 7, boxSizing: 'border-box' }}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. comments should mention the product name, or focus on the first photo in the carousel"
            />
          </div>

          {rules.map((r) => (
            <div key={r.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
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

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-mute)', marginTop: 10 }}>
        Already ordered? <a href="/client-login" style={{ color: 'var(--navy)' }}>Track your order</a>
      </p>

      <a
        href="/join"
        className="section"
        style={{
          display: 'block', padding: '18px 20px', marginTop: 20, textDecoration: 'none',
          background: 'var(--navy)', color: '#fff', textAlign: 'center',
        }}
      >
        <strong>Want to be an engager and earn money instead?</strong>
        <div style={{ fontSize: 12.5, color: '#c4c9ec', marginTop: 4 }}>Join 1,200+ people earning from their phone →</div>
      </a>

      <WhatsAppButton />
    </div>
  );
}
