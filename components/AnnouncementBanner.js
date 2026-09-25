import { useState, useEffect } from 'react';
import { authedFetch } from '../lib/authClient';

const KEY = 'primeloop-dismissed-announcements';

function readDismissed() {
  try { return JSON.parse(window.localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
}

// One message card. Also used by the super-admin's live preview, so what they
// see while writing is exactly what recipients get.
export function AnnouncementCard({ a, onDismiss }) {
  return (
    <div role="status" className="section" style={{ margin: 0, padding: '16px 20px', borderColor: 'var(--accent)', borderLeftWidth: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}>{a.title}</div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label={`Dismiss: ${a.title}`} style={{ background: 'none', border: 0, color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: 0, flexShrink: 0 }}>
            Dismiss
          </button>
        )}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 14.5, color: 'var(--ink-soft)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{a.body}</p>
      {a.link_url && (
        <a href={a.link_url} className="btn primary" style={{ marginTop: 12, fontSize: 14 }} {...(a.link_url.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>
          {a.link_label || 'Open'}
        </a>
      )}
    </div>
  );
}

// Messages the Primeloop team has sent to everyone in this dashboard's
// audience. Each can be dismissed (remembered on this device only). Renders
// nothing when there is nothing to show, or if anything at all goes wrong.
export default function AnnouncementBanner() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    authedFetch('/api/announcements')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const dismissed = readDismissed();
        setItems((d.announcements || []).filter((a) => !dismissed.includes(a.id)).slice(0, 3));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  function dismiss(id) {
    setItems((list) => list.filter((a) => a.id !== id));
    try { window.localStorage.setItem(KEY, JSON.stringify([...readDismissed(), id].slice(-100))); } catch (e) { /* remembered only when storage works */ }
  }

  if (!items.length) return null;
  return (
    <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
      {items.map((a) => <AnnouncementCard key={a.id} a={a} onDismiss={() => dismiss(a.id)} />)}
    </div>
  );
}
