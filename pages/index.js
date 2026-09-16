import { useState, useEffect } from 'react';
import Head from 'next/head';
import Logo from '../components/Logo';
import WhatsAppButton from '../components/WhatsAppButton';
import Faq from '../components/Faq';
import StickyCta from '../components/StickyCta';
import CheckIcon from '../components/CheckIcon';
import StarRating from '../components/StarRating';
import { timeAgo, isFresh } from '../lib/timeAgo';

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];

const FAQ_ITEMS = [
  {
    q: 'How do I know these are real people, not bots?',
    a: 'Every engagement is completed by a trained, verified engager account — never an automated script. Each one submits screenshot proof of the action, which is checked automatically for authenticity and duplicates. You see the same progress bar move in your dashboard as it happens.',
  },
  {
    q: 'Will this get my account flagged or banned?',
    a: "No — because nothing about it looks like bot activity to the platform. Real accounts, real devices, real behavior. That's the entire point of not using a bot panel.",
  },
  {
    q: "What if my order doesn't get fully delivered?",
    a: "If any part of your order is still unfilled 5 days after payment, you're entitled to a refund for the undelivered portion — never the part that was already completed. Full terms are on our Refund Policy page.",
  },
  {
    q: 'How fast will I see results?',
    a: 'Most orders see their first engagement within 4–12 minutes of payment. You can track live progress from your dashboard the entire time.',
  },
  {
    q: 'Is my payment secure?',
    a: "Payments are processed by Paystack — we never see or store your card details. You'll get an order confirmation and a dashboard link to track everything after payment.",
  },
];

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
  const [activity, setActivity] = useState([]);

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

  useEffect(() => {
    fetch('/api/public/recent-activity')
      .then((r) => r.json())
      .then((d) => setActivity(d.activity || []))
      .catch(() => {});
  }, []);

  const total = rules.reduce((sum, r) => {
    const s = selected[r.action];
    return s?.checked ? sum + s.qty * r.client_price : sum;
  }, 0);
  const hasSelection = Object.values(selected).some((s) => s?.checked);
  const canCheckout = !!email && !!postLink && hasSelection;

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
    <>
      <Head>
        <title>Primeloop — Real Facebook, Instagram & TikTok Engagement | No Bots</title>
        <meta name="description" content="Get real likes, comments, shares and follows from trained Nigerian engagers — not bots. Live tracking, 100% money-back guarantee. Starting from ₦5 per engagement." />
        <meta property="og:title" content="Primeloop — Real Social Media Engagement, No Bots" />
        <meta property="og:description" content="Real people. Real engagement. Watch it happen live on Facebook, Instagram, TikTok, YouTube and X." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://primeloop.app/" />
        <meta property="og:image" content="https://primeloop.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://primeloop.app/og-image.png" />
        <link rel="canonical" href="https://primeloop.app/" />
      </Head>
    <div className="app has-sticky-cta">
      <div className="fade-in" style={{ marginBottom: 18 }}><Logo size={36} /></div>

      <div className="hero2 fade-in-delay-1">
        <div>
          <h1>Real engagement, watched in real time.</h1>
          <p className="lead">
            Built for creators and businesses tired of bot panels that get pages flagged. No bots,
            no fake accounts — every like, comment and share comes from a trained, verified
            Nigerian engager, and you watch it happen live.
          </p>
          <div className="hero2-ctas">
            <a href="#order" className="cta-bold">Get engagement — from ₦6 →</a>
            <button className="cta-ghost2" onClick={() => setShowVerifyInfo(true)}>How verification works</button>
          </div>
        </div>
        <div className="hero2-widget">
          <div className={`live-tag${activity.length && isFresh(activity[0].at) ? '' : ' stale'}`}>
            <span className="dot-live" />
            {activity.length && isFresh(activity[0].at) ? 'Live activity' : 'Recent activity'}
          </div>
          {activity.length === 0 && (
            <div className="feed-row example">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon size={11} color="var(--ink-mute)" />
                <i>Example — Instagram comment verified</i>
              </span>
              <span className="t">e.g. 3m ago</span>
            </div>
          )}
          {activity.map((a, i) => (
            <div className="feed-row" key={i}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon size={11} color="var(--good)" />
                <b>{a.platform[0].toUpperCase() + a.platform.slice(1)} {a.action}</b>&nbsp;verified
              </span>
              <span className="t">{timeAgo(a.at)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="trust-bar2 fade-in-delay-2">
        <div className="stat"><div className="n">100%</div><div className="l">Money-back guarantee</div></div>
        <div className="stat"><div className="n">4–12 min</div><div className="l">To first engagement</div></div>
        <div className="stat"><div className="n">5</div><div className="l">Platforms live</div></div>
        <div className="badges">
          <div className="badge"><CheckIcon size={11} color="var(--good)" />Paystack secured</div>
          <div className="badge"><CheckIcon size={11} color="var(--good)" />Verified engagers only</div>
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

      <div className="case-study fade-in-delay-2">
        <p className="quote">"Grew from 340 to 1,200 followers in three weeks. No warning, no drop-off after — because it was never fake to begin with."</p>
        <div className="who">— Chidinma O., skincare brand</div>
      </div>

      <div className="proof-strip fade-in-delay-3">
        <div className="proof-card">
          <StarRating />
          <div className="quote">"Comments looked genuinely like customers, not spam."</div>
          <div className="who">Chidinma O., skincare brand</div>
        </div>
        <div className="proof-card">
          <StarRating />
          <div className="quote">"I can actually see the progress bar move instead of just hoping it's working."</div>
          <div className="who">Tunde A., content creator</div>
        </div>
        <div className="proof-card">
          <StarRating />
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
            <label htmlFor="client-email" style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Your email</label>
            <input id="client-email" style={{ width: '100%' }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="post-link" style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Post link</label>
            <input id="post-link" style={{ width: '100%' }} value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="extra-instructions" style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>
              Extra instructions <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="extra-instructions"
              style={{ width: '100%', minHeight: 70, fontFamily: 'inherit', fontSize: 13, padding: '9px 10px', border: '1px solid var(--line-strong)', borderRadius: 7, boxSizing: 'border-box' }}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. comments should mention the product name, or focus on the first photo in the carousel"
            />
          </div>

          {rules.map((r) => (
            <div key={r.action} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
              <input
                id={`engage-${r.action}`}
                type="checkbox"
                checked={!!selected[r.action]?.checked}
                onChange={(e) =>
                  setSelected((s) => ({ ...s, [r.action]: { ...s[r.action], checked: e.target.checked } }))
                }
              />
              <label htmlFor={`engage-${r.action}`} style={{ flex: 1, textTransform: 'capitalize', cursor: 'pointer' }}>{r.action}</label>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>₦{r.client_price}/unit</div>
              <input
                type="number"
                min="1"
                aria-label={`${r.action} quantity`}
                style={{ width: 70 }}
                value={selected[r.action]?.qty || 30}
                onChange={(e) =>
                  setSelected((s) => ({ ...s, [r.action]: { ...s[r.action], qty: Math.max(1, +e.target.value) } }))
                }
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>₦{total.toLocaleString()}</div>
            <button
              className="btn accent"
              onClick={checkout}
              disabled={loading || !canCheckout}
              style={!canCheckout ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              {loading ? 'Redirecting...' : 'Pay with Paystack'}
            </button>
          </div>
          {errorMsg && <p style={{ color: 'var(--warn)', fontSize: 13, marginTop: 10 }}>{errorMsg}</p>}
          <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 10, textAlign: 'right' }}>
            Undelivered after 5 days? Full refund for that portion — no questions asked.
          </p>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-mute)', marginTop: 10 }}>
        Already ordered? <a href="/client-login" style={{ color: 'var(--navy)' }}>Track your order</a>
      </p>

      <div className="section" style={{ marginTop: 20 }}>
        <div className="section-head"><h2>Real people, not a bot panel</h2></div>
        <div style={{ padding: 20 }} className="compare-wrap">
          <div className="compare-hint">Swipe to see the full comparison →</div>
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                <th className="col-us">Primeloop</th>
                <th>Typical bot panel</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Who does the engagement</td>
                <td className="col-us yes">Real, verified people</td>
                <td className="no">Automated / fake accounts</td>
              </tr>
              <tr>
                <td>Flagging risk to your account</td>
                <td className="col-us yes">Behaves like real activity</td>
                <td className="no">Detectable pattern</td>
              </tr>
              <tr>
                <td>Proof it happened</td>
                <td className="col-us yes">Screenshot, checked automatically</td>
                <td className="no">None</td>
              </tr>
              <tr>
                <td>Progress tracking</td>
                <td className="col-us yes">Live dashboard</td>
                <td className="no">"Trust us"</td>
              </tr>
              <tr>
                <td>Undelivered portion</td>
                <td className="col-us yes">Refunded</td>
                <td className="no">Rarely, if ever</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="section" id="faq" style={{ marginTop: 20 }}>
        <div className="section-head"><h2>Questions before you order</h2></div>
        <div style={{ padding: '4px 20px 8px' }}>
          <Faq items={FAQ_ITEMS} />
        </div>
      </div>

      <a
        href="/join"
        className="section"
        style={{
          display: 'block', padding: '18px 20px', marginTop: 20, textDecoration: 'none',
          background: 'var(--navy)', color: '#fff', textAlign: 'center',
        }}
      >
        <strong>Want to be an engager and earn money instead?</strong>
        <div style={{ fontSize: 12.5, color: 'var(--label-on-navy)', marginTop: 4 }}>Join 1,200+ people earning from their phone →</div>
      </a>

      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 24 }}>
        <a href="/terms" style={{ color: 'var(--ink-soft)' }}>Terms</a> ·{' '}
        <a href="/privacy" style={{ color: 'var(--ink-soft)' }}>Privacy</a> ·{' '}
        <a href="/refund-policy" style={{ color: 'var(--ink-soft)' }}>Refund Policy</a>
      </p>

      <WhatsAppButton avoidSelectors={['#order', '#faq']} />
      <StickyCta label={total > 0 ? `₦${total.toLocaleString()}` : 'From ₦6/unit'} sublabel="Real engagement" href="#order" hideNearId="order" />
    </div>
    </>
  );
}
