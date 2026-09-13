import { useRouter } from 'next/router';

const LINKS = [
  { href: '/admin/tasks', label: 'Task board' },
  { href: '/admin/review', label: 'Review queue' },
  { href: '/admin/engagers', label: 'Engagers' },
  { href: '/admin/pricing', label: 'Pricing' },
  { href: '/admin/verification', label: 'Verification' },
  { href: '/admin/onboarding-tests', label: 'Onboarding tests' },
  { href: '/admin/admins', label: 'Admins' },
  { href: '/admin/accounting', label: 'Accounting' },
  { href: '/admin/enable-mfa', label: '2FA' },
];

export default function AdminNav() {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
      {LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          style={{
            fontSize: 12.5,
            padding: '6px 12px',
            borderRadius: 7,
            textDecoration: 'none',
            color: router.pathname === l.href ? '#fff' : 'var(--ink-soft)',
            background: router.pathname === l.href ? 'var(--navy)' : 'transparent',
          }}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
