import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { authedFetch } from '../lib/authClient';
import Logo from '../components/Logo';

const ROLE_INFO = {
  admin: { label: 'Admin dashboard', href: '/admin/pricing', desc: 'Manage pricing, engagers, and tasks.' },
  engager: { label: 'Engager dashboard', href: '/engager/dashboard', desc: 'Find tasks and track your earnings.' },
  client: { label: 'Client dashboard', href: '/client/dashboard', desc: 'Track your orders.' },
};

export default function ChooseDashboard() {
  const router = useRouter();
  const [roles, setRoles] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.replace('/login');
        return;
      }
      const res = await authedFetch('/api/auth/whoami');
      const data = await res.json();
      if (!data.roles || data.roles.length === 0) {
        router.replace('/login');
        return;
      }
      if (data.roles.length === 1) {
        router.replace(ROLE_INFO[data.roles[0]].href);
        return;
      }
      setRoles(data.roles);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!roles) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app" style={{ maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Logo size={44} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center' }}>Which dashboard?</h1>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)' }}>
        This login is linked to more than one account.
      </p>
      <div className="section" style={{ padding: 8 }}>
        {roles.map((r) => (
          <a
            key={r}
            href={ROLE_INFO[r].href}
            style={{
              display: 'block', padding: '14px 16px', textDecoration: 'none', color: 'var(--ink)',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{ROLE_INFO[r].label}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>{ROLE_INFO[r].desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
