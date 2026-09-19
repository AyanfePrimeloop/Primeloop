import { platformLabel } from '../lib/platformDomains';

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'youtube', 'x'];

// "Start here" card for new engagers. Shows only until all three steps are
// done, so it never nags an active engager.
export default function GetStarted({ hasVerifiedPlatform, hasBank, hasApprovedTask }) {
  const steps = [
    {
      done: hasVerifiedPlatform,
      title: 'Verify one platform',
      body: 'Pass a short test on the platform you use most. It takes a few minutes and unlocks paid tasks there.',
      action: !hasVerifiedPlatform && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {PLATFORMS.map((p) => (
            <a key={p} href={`/onboarding/${p}`} className="btn" style={{ fontSize: 14 }}>{platformLabel(p)}</a>
          ))}
        </div>
      ),
    },
    {
      done: hasApprovedTask,
      title: 'Complete your first task',
      body: 'Pick a task below, do it on the post, then upload a screenshot as proof.',
    },
    {
      done: hasBank,
      title: 'Add your bank details',
      body: 'So we can pay you every Friday. You can earn first and add this later.',
      action: !hasBank && <a href="/engager/bank-details" className="btn" style={{ fontSize: 14, marginTop: 10 }}>Add bank details</a>,
    },
  ];
  if (steps.every((s) => s.done)) return null;
  const doneCount = steps.filter((s) => s.done).length;
  const currentIdx = steps.findIndex((s) => !s.done);

  return (
    <div className="section" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 19, margin: 0 }}>Start here</h2>
        <span style={{ fontSize: 14, color: 'var(--ink-mute)' }}>{doneCount} of 3 done</span>
      </div>
      <ol style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'grid', gap: 14 }}>
        {steps.map((s, i) => (
          <li key={s.title} style={{ display: 'flex', gap: 12, opacity: s.done ? 0.6 : 1 }}>
            <span
              aria-hidden="true"
              style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
                fontSize: 14, fontWeight: 700,
                background: s.done ? 'var(--good)' : i === currentIdx ? 'var(--navy)' : 'var(--paper)',
                color: s.done || i === currentIdx ? '#fff' : 'var(--ink-mute)',
                border: s.done || i === currentIdx ? 'none' : '1px solid var(--line-strong)',
              }}
            >
              {s.done ? '✓' : i + 1}
            </span>
            <div>
              <div style={{ fontWeight: 700, textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</div>
              {!s.done && <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', marginTop: 2 }}>{s.body}</div>}
              {s.action}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
