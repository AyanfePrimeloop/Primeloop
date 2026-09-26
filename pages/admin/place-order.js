import { useState, useEffect, useRef } from 'react';
import AdminNav from '../../components/AdminNav';
import WatchHow from '../../components/WatchHow';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import { platformLabel, isKnownPlatform, normalizeLink, linkMatchesPlatform, linkMismatchMessage } from '../../lib/platformDomains';
import { MIN_ORDER } from '../../lib/payoutRules';
import { PACKS, buildPack } from '../../lib/packs';
import { paymentMessage, startedMessage, whatsappHrefFor, linesText } from '../../lib/orderMessage';

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];
const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
const when = (d) => new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const label = { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 5 };

function CopyButton({ text, label: text2 = 'Copy', primary }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); } catch (e) { window.prompt('Copy this:', text); }
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }
  return <button type="button" className={`btn${primary ? ' primary' : ''}`} style={{ fontSize: 13 }} onClick={copy}>{done ? 'Copied' : text2}</button>;
}

const STATUS = {
  pending: { text: 'Awaiting payment', style: { background: 'var(--warn-soft)', color: 'var(--warn)' } },
  paid: { text: 'Paid', style: { background: 'var(--good-soft)', color: 'var(--good)' } },
  failed: { text: 'Payment link failed', style: {} },
};

export default function AdminPlaceOrder() {
  const { loading, me } = useRequireRole('admin');
  const isSuper = me?.admin?.role === 'super_admin';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [existing, setExisting] = useState(null); // { exists, name }
  const [platform, setPlatform] = useState('instagram');
  const [postLink, setPostLink] = useState('');
  const [rules, setRules] = useState([]);
  const [qty, setQty] = useState({});
  const [instructions, setInstructions] = useState('');
  const [payment, setPayment] = useState('link');
  const [paymentNote, setPaymentNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState(null); // { ready, orders }
  const resultRef = useRef(null);

  useEffect(() => { if (!loading) loadRecent(); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading) return;
    setQty({});
    authedFetch(`/api/admin/pricing?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => setRules((d.rules || []).filter((r) => r.active !== false && Number(r.client_price) > 0)))
      .catch(() => setRules([]));
  }, [platform, loading]);

  async function loadRecent() {
    const r = await authedFetch('/api/admin/place-order');
    const d = await r.json().catch(() => ({}));
    if (!d.error) setRecent(d);
  }

  async function lookup() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setExisting(null);
    const r = await authedFetch(`/api/admin/place-order?email=${encodeURIComponent(email.trim())}`);
    const d = await r.json().catch(() => null);
    setExisting(d);
    if (d?.exists && d.name && !name) setName(d.name);
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  const lines = rules.map((r) => ({ action: r.action, price: Number(r.client_price), quantity: parseInt(qty[r.action], 10) || 0 })).filter((l) => l.quantity > 0);
  const total = lines.reduce((t, l) => t + l.price * l.quantity, 0);
  const normalized = postLink.trim() ? normalizeLink(postLink) : '';
  const linkProblem = postLink.trim() && (!normalized ? 'Enter a full post link.' : !linkMatchesPlatform(normalized, platform) ? linkMismatchMessage(platform) : '');
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const belowMin = total > 0 && total < MIN_ORDER;
  const noteOk = payment !== 'manual' || paymentNote.trim().length >= 3;
  const canSubmit = emailOk && normalized && !linkProblem && total >= MIN_ORDER && noteOk && !busy && isKnownPlatform(platform);

  function usePack(budget) {
    const built = buildPack(rules, platform, budget);
    const next = {};
    built.forEach((l) => { next[l.action] = String(l.qty); });
    setQty(next);
  }

  async function submit() {
    const summary = linesText(lines.map((l) => ({ action: l.action, quantity: l.quantity })));
    const ask = payment === 'manual'
      ? `Record ${naira(total)} as RECEIVED and start this order now?\n\n${platformLabel(platform)}: ${summary}\nClient: ${email.trim()}\n\nOnly do this if the money has really reached you. Work starts immediately.`
      : `Create this order and a payment link?\n\n${platformLabel(platform)}: ${summary}\nTotal: ${naira(total)}\nClient: ${email.trim()}`;
    if (!window.confirm(ask)) return;
    setBusy(true);
    setError('');
    const res = await authedFetch('/api/admin/place-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(), name, whatsapp, platform, postLink,
        items: lines.map((l) => ({ action: l.action, quantity: l.quantity })),
        specialInstructions: instructions, payment, paymentNote,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(d.error || 'Could not place the order. Nothing was created.');
    setResult(d);
    loadRecent();
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function reset() {
    setEmail(''); setName(''); setWhatsapp(''); setExisting(null); setPostLink(''); setQty({}); setInstructions(''); setPaymentNote(''); setPayment('link'); setResult(null); setError('');
  }

  // ---- what was just done ----
  const r = result;
  const msg = r
    ? (r.payment === 'link'
      ? paymentMessage({ name: r.client.name, platform: r.platform, lines: r.lines, total: r.total, url: r.paymentUrl })
      : startedMessage({ name: r.client.name, platform: r.platform, lines: r.lines, total: r.total }))
    : '';

  return (
    <div className="app">
      <AdminNav />
      <h1 style={{ fontSize: 30 }}>Place an order for a client</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        For clients who would rather not do it themselves. Same prices and rules as the website. The client gets their own login (by email) to watch the order live.
      </p>

      <WatchHow video="adminTools" chapter="order" label="Watch: how to place an order for a client (1.5 minutes)" />

      {recent && recent.ready === false && (
        <div className="section" style={{ padding: 20, background: 'var(--warn-soft)' }}>
          <strong>One-time setup needed.</strong> Run <code>supabase/migration_17_admin_placed_orders.sql</code> in the Supabase SQL Editor, then reload this page.
        </div>
      )}

      {r ? (
        <div ref={resultRef} className="section" style={{ padding: 20, borderColor: 'var(--good)' }}>
          <h2 style={{ fontSize: 19, margin: '0 0 6px', color: 'var(--good)' }}>
            {r.payment === 'link' ? 'Order created. Waiting for the client to pay.' : `Order started: ${r.tasksCreated} task${r.tasksCreated === 1 ? '' : 's'} created.`}
          </h2>
          <p style={{ margin: '0 0 12px', fontSize: 14.5, color: 'var(--ink-soft)' }}>
            {platformLabel(r.platform)} · {linesText(r.lines)} · <strong>{naira(r.total)}</strong> · {r.client.email}{r.client.isNew ? ' (new client, login created)' : ''}
          </p>
          {r.payment === 'link' && (
            <>
              <label style={label} htmlFor="pay-url">Payment link: send this to the client</label>
              <input id="pay-url" readOnly value={r.paymentUrl} onClick={(e) => e.target.select()} style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 10 }} />
              <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--ink-mute)' }}>Work starts the moment they pay. You can find this order and its link in the list below.</p>
            </>
          )}
          {r.payment === 'manual' && !r.linkOk && (
            <p role="alert" style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--warn)' }}>The post link would not load, so the tasks are held in the Review queue until you approve the link. Nothing has gone to engagers yet.</p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {r.payment === 'link' && <CopyButton text={r.paymentUrl} label="Copy link" primary />}
            <CopyButton text={msg} label="Copy message" />
            <a className="btn" style={{ fontSize: 13, borderColor: '#25a55a', color: '#12703a' }} target="_blank" rel="noreferrer" href={whatsappHrefFor(r.client.whatsapp, msg) || `https://wa.me/?text=${encodeURIComponent(msg)}`}>
              {r.client.whatsapp ? 'Send on WhatsApp' : 'Send on WhatsApp (choose contact)'}
            </a>
            <button type="button" className="btn" style={{ fontSize: 13 }} onClick={reset}>Place another order</button>
          </div>
        </div>
      ) : (
        <div className="section" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 17, margin: '0 0 12px' }}>1. The client</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 6 }}>
            <div>
              <label htmlFor="po-email" style={label}>Email (they log in with this)</label>
              <input id="po-email" type="email" style={{ width: '100%' }} value={email} onChange={(e) => { setEmail(e.target.value); setExisting(null); }} onBlur={lookup} placeholder="client@email.com" />
            </div>
            <div>
              <label htmlFor="po-name" style={label}>Name (optional)</label>
              <input id="po-name" style={{ width: '100%' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Obi" />
            </div>
            <div>
              <label htmlFor="po-wa" style={label}>WhatsApp (optional)</label>
              <input id="po-wa" style={{ width: '100%' }} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0803 000 0000" />
            </div>
          </div>
          {existing && (
            <p role="status" style={{ margin: '4px 0 0', fontSize: 13.5, color: existing.exists ? 'var(--good)' : 'var(--ink-mute)' }}>
              {existing.exists ? `Existing client${existing.name ? `: ${existing.name}` : ''}. This order is added to their account.` : 'New client. An account is created for them.'}
            </p>
          )}

          <h2 style={{ fontSize: 17, margin: '22px 0 12px' }}>2. The order</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 14 }}>
            <div>
              <label htmlFor="po-platform" style={label}>Platform</label>
              <select id="po-platform" style={{ width: '100%' }} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{platformLabel(p)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label htmlFor="po-link" style={label}>Post or page link</label>
              <input id="po-link" style={{ width: '100%' }} value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder={`Paste the ${platformLabel(platform)} link`} />
              {linkProblem && <div role="alert" style={{ fontSize: 13, color: 'var(--warn)', marginTop: 4 }}>{linkProblem}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Quick fill:</span>
            {PACKS.map((p) => <button key={p.id} type="button" className="btn" style={{ fontSize: 13 }} onClick={() => usePack(p.budget)} disabled={!rules.length}>{p.name} ({naira(p.budget)})</button>)}
            <button type="button" className="btn" style={{ fontSize: 13 }} onClick={() => setQty({})}>Clear</button>
          </div>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: 12 }}>
            {rules.map((rl) => (
              <div key={rl.action} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
                <label htmlFor={`po-q-${rl.action}`} style={{ ...label, textTransform: 'capitalize', marginBottom: 2 }}>{rl.action}</label>
                <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginBottom: 6 }}>{naira(rl.client_price)} each</div>
                <input id={`po-q-${rl.action}`} type="number" min="0" inputMode="numeric" style={{ width: '100%' }} value={qty[rl.action] || ''} onChange={(e) => setQty({ ...qty, [rl.action]: e.target.value })} placeholder="0" />
              </div>
            ))}
            {!rules.length && <p style={{ fontSize: 14, color: 'var(--ink-mute)' }}>Loading prices...</p>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label htmlFor="po-ins" style={label}>Instructions from the client (optional)</label>
            <textarea id="po-ins" rows={3} maxLength={500} style={{ width: '100%', resize: 'vertical' }} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="For example: comments should mention the new store opening." />
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--paper)', borderRadius: 12, marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>{naira(total)}</span>
            </div>
            {belowMin && <div role="alert" style={{ fontSize: 13.5, color: 'var(--warn)', marginTop: 4 }}>The minimum order is {naira(MIN_ORDER)}. Add a little more, or use a Quick fill.</div>}
          </div>

          <h2 style={{ fontSize: 17, margin: '22px 0 12px' }}>3. Payment</h2>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, cursor: 'pointer' }}>
            <input type="radio" name="pay" checked={payment === 'link'} onChange={() => setPayment('link')} style={{ marginTop: 4 }} />
            <span><strong>Send the client a payment link</strong> (recommended)<br /><span style={{ fontSize: 13.5, color: 'var(--ink-mute)' }}>You get a secure Paystack link to send them. Work starts the moment they pay.</span></span>
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, cursor: isSuper ? 'pointer' : 'not-allowed', opacity: isSuper ? 1 : 0.55 }}>
            <input type="radio" name="pay" checked={payment === 'manual'} disabled={!isSuper} onChange={() => setPayment('manual')} style={{ marginTop: 4 }} />
            <span><strong>The client already paid me</strong> (transfer or cash)<br /><span style={{ fontSize: 13.5, color: 'var(--ink-mute)' }}>{isSuper ? 'Only if the money has really reached you. Work starts immediately.' : 'Super-admins only, because it starts work without Paystack confirming the money.'}</span></span>
          </label>
          {payment === 'manual' && (
            <div style={{ marginBottom: 6 }}>
              <label htmlFor="po-note" style={label}>How was it paid? (kept on the order)</label>
              <input id="po-note" style={{ width: '100%' }} maxLength={200} value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="GTBank transfer, ref 1234567, received 26 Sep" />
            </div>
          )}

          <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn primary" disabled={!canSubmit} onClick={submit}>
              {busy ? 'Placing...' : payment === 'manual' ? `Record ${naira(total)} paid and start` : 'Create order and payment link'}
            </button>
          </div>
          {error && <p role="alert" style={{ margin: '12px 0 0', fontSize: 14.5, color: 'var(--warn)' }}>{error}</p>}
        </div>
      )}

      <div className="section">
        <div className="section-head"><h2>Orders placed by admins</h2><span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{recent?.orders?.length || 0}</span></div>
        {(!recent?.orders || recent.orders.length === 0) && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>None yet.</p>}
        {(recent?.orders || []).map((o) => {
          const st = STATUS[o.payment_status] || { text: o.payment_status, style: {} };
          const pay = o.payment_url ? `Hi ${(o.clients?.full_name || '').split(' ')[0] || 'there'}, here is the payment link for your ${platformLabel(o.platform)} order of ${naira(o.amount_total)}: ${o.payment_url}` : '';
          return (
            <div key={o.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 700 }}>{naira(o.amount_total)} · {platformLabel(o.platform)}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', overflowWrap: 'anywhere' }}>{o.clients?.email}{o.clients?.full_name ? ` · ${o.clients.full_name}` : ''}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 2 }}>
                  {when(o.created_at)} · by {o.placed_by}{o.payment_method === 'manual' ? ` · paid outside Paystack: ${o.payment_note || ''}` : ''}
                  {o.payment_status === 'paid' && o.progress ? ` · ${o.progress.filled} of ${o.progress.needed} delivered` : ''}
                </div>
              </div>
              <span className="badge" style={st.style}>{st.text}</span>
              {o.payment_status === 'pending' && o.payment_url && (
                <>
                  <CopyButton text={o.payment_url} label="Copy link" />
                  <a className="btn" style={{ fontSize: 13, borderColor: '#25a55a', color: '#12703a' }} target="_blank" rel="noreferrer" href={whatsappHrefFor(o.clients?.whatsapp, pay) || `https://wa.me/?text=${encodeURIComponent(pay)}`}>WhatsApp</a>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
