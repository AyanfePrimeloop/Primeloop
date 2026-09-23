import { Check, Cross } from './SiteIcons';

// Small, illustrative "what a good screenshot looks like" diagrams — drawn
// with CSS, not real app screenshots, so they never claim to be an exact
// copy of any platform's actual interface. Used on /engager/screenshot-guide
// and matched to lib/screenshotGuide.js's `mock` field per action.

const frame = { background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 14, width: '100%', maxWidth: 320, boxSizing: 'border-box' };
const row = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 };
const avatar = (bg) => ({ width: 28, height: 28, borderRadius: '50%', background: bg || 'var(--paper)', flexShrink: 0 });
const photo = { height: 70, borderRadius: 8, background: 'linear-gradient(135deg,#dfe3ee,#c9cee8)', marginBottom: 10 };
const badge = (good) => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
  color: good ? 'var(--good)' : 'var(--warn)', background: good ? 'var(--good-soft)' : 'var(--warn-soft)',
  borderRadius: 999, padding: '3px 9px', marginBottom: 8,
});

function Heart({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#e0632b' : 'none'} aria-hidden="true">
      <path d="M12 20s-7-4.35-9.5-8.8C.86 8 2.2 4.6 5.6 4c2-.35 3.8.6 6.4 3 2.6-2.4 4.4-3.35 6.4-3 3.4.6 4.74 4 3.1 7.2C19 15.65 12 20 12 20z" stroke={filled ? '#e0632b' : 'currentColor'} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function Bookmark({ filled }) {
  return (
    <svg width="16" height="18" viewBox="0 0 20 24" fill={filled ? '#1c2340' : 'none'} aria-hidden="true">
      <path d="M3 2h14a1 1 0 011 1v19l-8-5-8 5V3a1 1 0 011-1z" stroke={filled ? '#1c2340' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function Like() {
  return (
    <div style={frame}>
      <div style={photo} />
      <div style={{ ...row, fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>
        <Heart filled /> <strong style={{ color: 'var(--ink)' }}>24 likes</strong>
        <span style={{ marginLeft: 'auto' }}>You and 13 others liked this</span>
      </div>
      <div style={badge(true)}><Check size={12} color="var(--good)" /> Icon filled in, count visible</div>
    </div>
  );
}

function Follow() {
  return (
    <div style={frame}>
      <div style={row}>
        <div style={avatar('#dfe3ee')} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Business Page</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Page · Local business</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--good)', borderRadius: 999, padding: '6px 14px' }}>✓ Following</div>
      </div>
      <div style={{ ...badge(true), marginTop: 10 }}><Check size={12} color="var(--good)" /> Button already shows "Following"</div>
    </div>
  );
}

function Save() {
  return (
    <div style={frame}>
      <div style={row}>
        <div style={{ ...photo, height: 44, width: 44, marginBottom: 0, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Saved</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>This post is in your collection</div>
        </div>
        <Bookmark filled />
      </div>
      <div style={{ ...badge(true), marginTop: 10 }}><Check size={12} color="var(--good)" /> Icon filled in, or shown inside Saved</div>
    </div>
  );
}

function CommentGood() {
  return (
    <div style={frame}>
      <div style={row}>
        <div style={avatar('#e0632b')} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>You</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>The price on the room-self option is way better than I expected for this location.</div>
        </div>
      </div>
      <div style={{ ...badge(true), marginTop: 10 }}><Check size={12} color="var(--good)" /> Specific, 4+ words, your name visible</div>
      <div style={{ ...badge(false) }}><Cross size={12} color="var(--warn)" /> Not: "Nice post!" or "🔥🔥🔥"</div>
    </div>
  );
}

function Share() {
  // flex + wrap, not a fixed two-column grid, so the two cards stack on
  // narrow screens instead of getting squeezed and clipped off the edge.
  const card = { ...frame, maxWidth: 220, flex: '1 1 200px', minWidth: 0 };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: '100%' }}>
      <div style={card}>
        <div style={badge(false)}><Cross size={12} color="var(--warn)" /> Not proof</div>
        <div style={photo} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Just viewing the original post — this never shows that you shared it.</div>
      </div>
      <div style={card}>
        <div style={badge(true)}><Check size={12} color="var(--good)" /> Proof</div>
        <div style={row}>
          <div style={avatar('#e0632b')} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>You</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>Just now</div>
          </div>
        </div>
        <div style={{ ...photo, height: 40, marginTop: 8, marginBottom: 4 }} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>On YOUR OWN profile, with the original post embedded below it.</div>
      </div>
    </div>
  );
}

function Watch() {
  return (
    <div style={frame}>
      <div style={{ ...photo, position: 'relative', marginBottom: 8 }}>
        <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.5)' }}>
          <div style={{ width: '94%', height: '100%', borderRadius: 2, background: '#e0632b' }} />
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>0:58 / 1:02</div>
      <div style={{ ...badge(true), marginTop: 8 }}><Check size={12} color="var(--good)" /> Progress bar near the end</div>
    </div>
  );
}

const MOCKS = { like: Like, follow: Follow, save: Save, 'comment-good': CommentGood, share: Share, watch: Watch };

export default function ScreenshotMock({ type }) {
  const Mock = MOCKS[type];
  if (!Mock) return null;
  return <Mock />;
}
