import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: color || 'var(--ink)' }}>₦{Number(value).toLocaleString()}</div>
    </div>
  );
}

export default function Accounting() {
  const { loading, me } = useRequireRole('admin');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const isSuperAdmin = me?.admin?.role === 'super_admin';

  useEffect(() => {
    if (!loading && isSuperAdmin) {
      authedFetch('/api/admin/accounting')
        .then((r) => r.json())
        .then((d) => (d.error ? setError(d.error) : setStats(d)));
    }
  }, [loading, isSuperAdmin]);

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  if (!isSuperAdmin) {
    return (
      <div className="app">
        <AdminNav />
        <div className="section" style={{ padding: 20, color: 'var(--ink-mute)' }}>
          This page is restricted to super-admins.
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <AdminNav />
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Accounting</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>The financial health of the business, at a glance.</p>

      {error && <p style={{ color: 'var(--warn)', fontSize: 13 }}>{error}</p>}

      {stats && (
        <>
          <div className="grid-3" style={{ margin: '16px 0' }}>
            <StatCard label="Total revenue (all time)" value={stats.totalRevenue} color="var(--navy)" />
            <StatCard label="Revenue, last 30 days" value={stats.recentRevenue30d} />
            <StatCard label="Paid orders" value={stats.totalOrders} color="var(--ink)" />
          </div>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <StatCard label="Paid out to engagers" value={stats.totalPaidOut} />
            <StatCard label="Owed — next payout" value={stats.pendingPayout} color="var(--warn)" />
            <StatCard label="Referral bonuses paid" value={stats.bonusesPaid} />
          </div>
          <div className="section" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6 }}>Gross margin (revenue minus payouts and bonuses)</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: stats.grossMargin >= 0 ? 'var(--good)' : 'var(--bad, #b23434)' }}>
              ₦{stats.grossMargin.toLocaleString()}
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 10 }}>
              This is a simple all-time snapshot — it doesn't yet subtract things like your AI
              verification costs, ad spend, or other operating expenses. Treat it as a starting
              point for a full P&L, not the whole picture.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
