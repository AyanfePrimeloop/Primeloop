import { ENGAGER_RULES } from '../lib/engagerRules';

// The engagement quality rules, shown to engagers. `defaultOpen` keeps it
// expanded for people who have not had a task approved yet.
export default function QualityRules({ defaultOpen = false }) {
  return (
    <details className="section" open={defaultOpen} style={{ padding: '4px 20px' }}>
      <summary style={{ cursor: 'pointer', padding: '14px 0', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-display)' }}>
        Our quality rules: real, specific engagement is what clients pay for
      </summary>
      <ol style={{ margin: '0 0 12px', padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
        {ENGAGER_RULES.map((r, i) => (
          <li key={r.title} style={{ display: 'flex', gap: 12 }}>
            <span
              aria-hidden="true"
              style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--navy)', color: '#fff', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}
            >
              {i + 1}
            </span>
            <div>
              <div style={{ fontWeight: 700 }}>{r.title}</div>
              <div style={{ fontSize: 14.5, color: 'var(--ink-soft)' }}>{r.body}</div>
            </div>
          </li>
        ))}
      </ol>
      <p style={{ fontSize: 14, color: 'var(--ink-mute)', margin: '0 0 14px' }}>
        Submissions that break these rules are rejected. Repeat or serious breaches can lose the payment and end your account.
      </p>
    </details>
  );
}
