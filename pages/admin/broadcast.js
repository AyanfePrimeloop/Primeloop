import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import WatchHow from '../../components/WatchHow';
import { AnnouncementCard } from '../../components/AnnouncementBanner';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import { TITLE_MAX, BODY_MAX, safeLink, announcementStatus, whatsappText } from '../../lib/announcements';

const day = (d) => new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const label = { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 5 };
const counter = (n, max) => <span style={{ float: 'right', fontSize: 12.5, fontWeight: 400, color: n > max ? 'var(--warn)' : 'var(--ink-mute)' }}>{n}/{max}</span>;

export default function AdminBroadcast() {
  const { loading, me } = useRequireRole('admin');
  const isSuperAdmin = me?.admin?.role === 'super_admin';

  const [data, setData] = useState(null);
  const [audience, setAudience] = useState('engagers');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [sendPush, setSendPush] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null); // { ok, text }
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && isSuperAdmin) load();
  }, [loading, isSuperAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const res = await authedFetch('/api/admin/broadcast');
    const d = await res.json();
    if (d.error) setNote({ ok: false, text: d.error });
    else setData(d);
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;
  if (!isSuperAdmin) {
    return (
      <div className="app">
        <AdminNav />
        <div className="section" style={{ padding: 20, color: 'var(--ink-mute)' }}>This page is restricted to super-admins.</div>
      </div>
    );
  }

  const r = data?.recipients || { engagers: 0, clients: 0, pushDevices: 0 };
  const audienceCount = audience === 'engagers' ? r.engagers : audience === 'clients' ? r.clients : r.engagers + r.clients;
  const audienceName = audience === 'engagers' ? 'engagers' : audience === 'clients' ? 'clients' : 'engagers and clients';
  const link = safeLink(linkUrl);
  const linkProblem = link === undefined;
  const draft = { title: title.trim(), body: body.trim(), link_url: link || null, link_label: link ? linkLabel.trim() || 'Open' : null };
  const ready = data?.ready !== false;
  const canSend = ready && draft.title && draft.body && title.length <= TITLE_MAX && body.length <= BODY_MAX && !linkProblem && !busy;

  async function send() {
    if (!window.confirm(`Send "${draft.title}" to ${audienceCount} ${audienceName}?\n\nIt appears on their dashboard straight away. You can stop showing it later, but a browser alert that has already gone out cannot be taken back.`)) return;
    setBusy(true);
    setNote(null);
    const res = await authedFetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience, title, body, linkUrl, linkLabel, expiresInDays, sendPush: sendPush && audience !== 'clients' }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setNote({ ok: false, text: d.error || 'Could not send. Nothing was sent.' });
    const p = d.push || {};
    setNote({
      ok: true,
      text: `Sent to ${audienceCount} ${audienceName}.` + (p.requested ? (p.configured ? ` Browser alert reached ${p.sent} of ${p.attempted} devices.` : ' Browser alerts are not set up on this server, so only the dashboard message went out.') : ''),
    });
    setTitle(''); setBody(''); setLinkUrl(''); setLinkLabel('');
    load();
  }

  async function stop(id) {
    if (!window.confirm('Stop showing this message on dashboards?')) return;
    await authedFetch('/api/admin/broadcast', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: false }) });
    load();
  }

  async function copyWhatsapp() {
    try {
      await navigator.clipboard.writeText(whatsappText(draft));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      window.prompt('Copy this message:', whatsappText(draft));
    }
  }

  return (
    <div className="app">
      <AdminNav />
      <h1 style={{ fontSize: 30 }}>Broadcast</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        Send a message to everyone in a group. It shows as a banner at the top of their dashboard
        until it expires or you stop it. Engagers who have browser alerts on can also get it as a notification.
      </p>

      <WatchHow video="adminTools" chapter="broadcast" label="Watch: how to send a broadcast (1 minute)" />

      {!ready && (
        <div className="section" style={{ padding: 20, background: 'var(--warn-soft)' }}>
          <strong>One-time setup needed.</strong> Run <code>supabase/migration_16_announcements.sql</code> in the Supabase SQL
          Editor, then reload this page. Nothing can be sent until then.
        </div>
      )}

      <div className="section" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={label}>Send to</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['engagers', `All engagers (${r.engagers})`], ['clients', `All clients (${r.clients})`], ['all', `Everyone (${r.engagers + r.clients})`]].map(([v, text]) => (
              <button key={v} type="button" className="btn" aria-pressed={audience === v} style={audience === v ? { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' } : {}} onClick={() => setAudience(v)}>{text}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="bc-title" style={label}>Title {counter(title.length, TITLE_MAX)}</label>
          <input id="bc-title" style={{ width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short and clear, e.g. Payouts move to 4pm this Friday" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="bc-body" style={label}>Message {counter(body.length, BODY_MAX)}</label>
          <textarea id="bc-body" rows={5} style={{ width: '100%', resize: 'vertical' }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write it the way you would say it to them." />
        </div>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 16 }}>
          <div>
            <label htmlFor="bc-link" style={label}>Link (optional)</label>
            <input id="bc-link" style={{ width: '100%' }} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://… or /engager/dashboard" />
            {linkProblem && <div role="alert" style={{ fontSize: 13, color: 'var(--warn)', marginTop: 4 }}>Must start with https:// or be a page inside Primeloop.</div>}
          </div>
          <div>
            <label htmlFor="bc-label" style={label}>Button text</label>
            <input id="bc-label" style={{ width: '100%' }} value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Open" disabled={!link} />
          </div>
          <div>
            <label htmlFor="bc-exp" style={label}>Show for</label>
            <select id="bc-exp" style={{ width: '100%' }} value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)}>
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="0">Until I stop it</option>
            </select>
          </div>
        </div>

        {audience !== 'clients' && (
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, marginBottom: 16 }}>
            <input type="checkbox" checked={sendPush} onChange={(e) => setSendPush(e.target.checked)} style={{ marginTop: 3 }} />
            <span>Also send a browser notification to engagers who have alerts on ({r.pushDevices} device{r.pushDevices === 1 ? '' : 's'} right now). Everyone else sees the dashboard banner.</span>
          </label>
        )}
        {audience !== 'engagers' && (
          <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: '0 0 16px' }}>
            Clients see this as a banner the next time they open their dashboard. There are no browser alerts for clients yet, so use
            &ldquo;Copy for WhatsApp&rdquo; to reach them right away.
          </p>
        )}

        <div style={{ marginBottom: 18 }}>
          <span style={label}>Preview: what they will see</span>
          <div style={{ maxWidth: 560 }}>
            {draft.title || draft.body ? <AnnouncementCard a={{ ...draft, title: draft.title || 'Your title' }} /> : <p style={{ fontSize: 14, color: 'var(--ink-mute)', margin: 0 }}>Start typing to see it.</p>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn primary" disabled={!canSend} onClick={send}>{busy ? 'Sending...' : `Send to ${audienceCount} ${audienceName}`}</button>
          <button type="button" className="btn" disabled={!draft.title || !draft.body} onClick={copyWhatsapp}>{copied ? 'Copied' : 'Copy for WhatsApp'}</button>
        </div>
        {note && <p role={note.ok ? 'status' : 'alert'} style={{ margin: '14px 0 0', fontSize: 14.5, color: note.ok ? 'var(--good)' : 'var(--warn)' }}>{note.text}</p>}
      </div>

      <div className="section">
        <div className="section-head"><h2>Sent messages</h2><span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{data?.announcements?.length || 0}</span></div>
        {(!data?.announcements || data.announcements.length === 0) && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing sent yet.</p>}
        {(data?.announcements || []).map((a) => {
          const status = announcementStatus(a);
          return (
            <div key={a.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 700 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '2px 0 6px' }}>
                  {day(a.created_at)} · to {a.audience === 'all' ? 'everyone' : `all ${a.audience}`}
                  {a.push_attempted > 0 && ` · alert reached ${a.push_sent}/${a.push_attempted} devices`}
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{a.body.length > 220 ? `${a.body.slice(0, 220)}...` : a.body}</div>
              </div>
              <span className="badge" style={status === 'Showing' ? { background: 'var(--good-soft)', color: 'var(--good)' } : {}}>{status}</span>
              {status === 'Showing' && <button type="button" className="btn" style={{ fontSize: 13 }} onClick={() => stop(a.id)}>Stop showing</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
