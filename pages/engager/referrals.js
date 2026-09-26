import { useState, useEffect } from 'react';
import AppBar from '../../components/AppBar';
import ReferralHub from '../../components/ReferralHub';
import WatchHow from '../../components/WatchHow';
import { useRequireRole, authedFetch } from '../../lib/authClient';

export default function Referrals() {
  const { loading, me } = useRequireRole('engager');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (loading) return;
    authedFetch('/api/engager/referrals')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setStats(d); })
      .catch(() => {});
  }, [loading]);

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <>
      <AppBar links={[
        { href: '/engager/dashboard', label: 'Tasks' },
        { href: '/engager/referrals', label: 'Refer & earn', current: true },
        { href: '/engager/screenshot-guide', label: 'Screenshot guide' },
        { href: '/engager/bank-details', label: 'Bank details' },
        { href: '/engager/profile', label: 'Profile' },
        { href: '/choose-dashboard', label: 'Switch dashboard' },
      ]} />
      <div className="app">
        <div className="page-head">
          <h1>Refer &amp; earn</h1>
          <p>Bring people to Primeloop and earn when they start doing tasks.</p>
        </div>
        <WatchHow video="referral" label="Watch: how to earn with referrals (3 minutes)" open />
        <ReferralHub code={me?.engager?.code} stats={stats} />
      </div>
    </>
  );
}
