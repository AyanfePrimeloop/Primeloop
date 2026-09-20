import { platformLabel } from '../lib/platformDomains';

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'youtube', 'x'];

// Shown after an engager's first approved task: more verified platforms means
// more tasks to choose from. `statuses` maps platform -> verification_status
// for platforms they have already started.
export default function EarnMore({ hasApprovedTask, statuses }) {
  if (!hasApprovedTask) return null;
  const remaining = PLATFORMS.filter((p) => statuses[p] !== 'verified');
  if (!remaining.length) return null;

  return (
    <div className="section" style={{ padding: '18px 20px' }}>
      <h2 style={{ fontSize: 19, margin: 0 }}>Earn more: add another platform</h2>
      <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', margin: '6px 0 12px' }}>
        Each platform you verify opens up its own tasks. It's the same quick test you just did.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {remaining.map((p) => (
          <a key={p} href={`/onboarding/${p}`} className="btn" style={{ fontSize: 14 }}>
            {statuses[p] ? `Continue ${platformLabel(p)}` : `Verify ${platformLabel(p)}`}
          </a>
        ))}
      </div>
    </div>
  );
}
