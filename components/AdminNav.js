import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Logo from './Logo';
import { authedFetch } from '../lib/authClient';

// `superOnly` tabs are hidden from regular admins. The pages and their API
// routes enforce this too, so hiding a tab is a convenience, not the lock.
const LINKS = [
  { href: '/admin/tasks', label: 'Task board' },
  { href: '/admin/review', label: 'Review queue' },
  { href: '/admin/engagers', label: 'Engagers' },
  { href: '/admin/clients', label: 'Clients', superOnly: true },
  { href: '/admin/pricing', label: 'Pricing', superOnly: true },
  { href: '/admin/verification', label: 'Verification', superOnly: true },
  { href: '/admin/onboarding-tests', label: 'Onboarding tests' },
  { href: '/admin/admins', label: 'Admins', superOnly: true },
  { href: '/admin/accounting', label: 'Accounting', superOnly: true },
  { href: '/admin/enable-mfa', label: '2FA' },
  { href: '/admin/help', label: 'Help' },
];

// Every admin page renders <AdminNav /> as its first child, inside .app.
export default function AdminNav() {
  const router = useRouter();
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authedFetch('/api/auth/whoami')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setIsSuper(d?.admin?.role === 'super_admin'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ marginBottom: 22 }}>
      <a href="/" className="app-brand" aria-label="Primeloop home" style={{ marginBottom: 14 }}>
        <Logo size={28} />Primeloop <span style={{ fontWeight: 600, color: 'var(--ink-mute)', fontSize: 15, letterSpacing: 0 }}>Admin</span>
      </a>
      <nav className="admin-tabs app-bar-links" aria-label="Admin" style={{ justifyContent: 'flex-start', marginTop: 14, marginBottom: 0 }}>
        {LINKS.filter((l) => !l.superOnly || isSuper).map((l) => (
          <a key={l.href} href={l.href} aria-current={router.pathname === l.href ? 'page' : undefined}>{l.label}</a>
        ))}
      </nav>
    </div>
  );
}
