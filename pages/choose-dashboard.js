import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { authedFetch } from '../lib/authClient';
import AuthShell from '../components/AuthShell';

const ROLE_INFO = {
  admin: { label: 'Admin dashboard', href: '/admin/pricing', desc: 'Manage pricing, engagers, and tasks.' },
  engager: { label: 'Engager dashboard', href: '/engager/dashboard', desc: 'Find tasks and track your earnings.' },
  client: { label: 'Client dashboard', href: '/client/dashboard', desc: 'Track your orders.' },
};

export default function ChooseDashboard() {
  const router = useRouter();
  const [roles, setRoles] = useState(null);

  useEffect(() => {
    async function resolve(session) {
      if (!session) {
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
    }

    // Same fix as lib/authClient.js — waits for Supabase to finish
    // processing any magic-link tokens before deciding there's no session.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') resolve(session);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!roles) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <AuthShell title="Which dashboard?" subtitle="This login is linked to more than one account." pageTitle="Choose a dashboard — Primeloop">
      <div className="auth-form">
        {roles.map((r) => (
          <a key={r} href={ROLE_INFO[r].href} className="auth-choice">
            <b>{ROLE_INFO[r].label}</b>
            <span>{ROLE_INFO[r].desc}</span>
          </a>
        ))}
      </div>
    </AuthShell>
  );
}
