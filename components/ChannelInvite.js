import { Chat } from './SiteIcons';

const CHANNEL_URL = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL;

// Invite to the free Primeloop WhatsApp Channel (task announcements).
// Renders nothing until NEXT_PUBLIC_WHATSAPP_CHANNEL_URL is set.
export default function ChannelInvite({ compact = false }) {
  if (!CHANNEL_URL) return null;

  if (compact) {
    return (
      <p className="auth-alt" style={{ marginTop: 20 }}>
        While you wait, <a href={CHANNEL_URL} target="_blank" rel="noreferrer">follow our WhatsApp Channel</a> to see new tasks as they open.
      </p>
    );
  }

  return (
    <div className="section" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 260px' }}>
        <div style={{ fontWeight: 700 }}>Follow our WhatsApp Channel</div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 2 }}>
          New tasks are announced there first. Free, and other followers can&apos;t see your number.
        </div>
      </div>
      <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="btn" style={{ gap: 8 }}>
        <Chat size={18} />Open the Channel
      </a>
    </div>
  );
}
