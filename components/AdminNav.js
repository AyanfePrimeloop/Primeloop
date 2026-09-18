import { useRouter } from 'next/router';
import Logo from './Logo';

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

// Every admin page renders <AdminNav /> as its first child, inside .app.
export default function AdminNav() {
  const router = useRouter();
  return (
    <div style={{ marginBottom: 22 }}>
      <a href="/" className="app-brand" aria-label="Primeloop home" style={{ marginBottom: 14 }}>
        <Logo size={28} />Primeloop <span style={{ fontWeight: 600, color: 'var(--ink-mute)', fontSize: 15, letterSpacing: 0 }}>Admin</span>
      </a>
      <nav className="admin-tabs app-bar-links" aria-label="Admin" style={{ justifyContent: 'flex-start', marginTop: 14, marginBottom: 0 }}>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} aria-current={router.pathname === l.href ? 'page' : undefined}>{l.label}</a>
        ))}
      </nav>
    </div>
  );
}
