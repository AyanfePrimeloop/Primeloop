import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import { downloadCSV } from '../../lib/csvExport';

function StatCard({ label, value, color, plain }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: color || 'var(--ink)' }}>
        {plain ? value : `₦${Number(value).toLocaleString()}`}
      </div>
    </div>
  );
}

function Attention({ data, onHandled }) {
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');
  async function markHandled(id) {
    if (!window.confirm('Mark this order as handled? It will disappear from this list. Only do this after you have refunded the customer or decided nothing is owed.')) return;
    setBusy(id);
    setErr('');
    const res = await authedFetch('/api/admin/resolve-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setErr(d.error || 'Could not save.');
    onHandled();
  }
  const none = !data || (!data.paidWithoutTasks.length && !data.overdue.length);
  const row = (o, extra) => (
    <div key={o.id} style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid var(--line)', fontSize: 14 }}>
      <div>
        <strong style={{ textTransform: 'capitalize' }}>{o.platform}</strong> · {o.email || 'no email'}
        <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Ref {String(o.reference || '').slice(0, 14)} · paid {new Date(o.paidAt).toLocaleDateString()}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 600 }}>₦{o.amount.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: 'var(--warn)' }}>{extra}</div>
        <button className="btn" style={{ fontSize: 13, padding: '5px 10px', marginTop: 6 }} disabled={busy === o.id} onClick={() => markHandled(o.id)}>
          {busy === o.id ? 'Saving...' : 'Mark handled'}
        </button>
      </div>
    </div>
  );
  return (
    <div className="section" style={{ padding: '16px 20px', marginTop: 16, borderColor: none ? 'var(--line)' : 'var(--warn)' }}>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{none ? 'Nothing needs your attention' : 'Needs your attention'}</div>
      {err && <p role="alert" style={{ fontSize: 14, color: 'var(--warn)', margin: '6px 0 0' }}>{err}</p>}
      {none && <p style={{ fontSize: 14, color: 'var(--ink-mute)', margin: '4px 0 0' }}>Every paid order has tasks, and none are past the 5-day refund promise.</p>}
      {data?.paidWithoutTasks.length > 0 && (
        <>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '8px 0 4px' }}>
            <strong>Paid, but no tasks were created.</strong> The customer has paid and nothing is being delivered. Create the tasks by hand or refund in Paystack.
          </p>
          {data.paidWithoutTasks.map((o) => row(o, 'No tasks'))}
        </>
      )}
      {data?.overdue.length > 0 && (
        <>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '12px 0 4px' }}>
            <strong>Past 5 days and not fully delivered.</strong> Per the refund policy the customer is owed a refund for the undelivered part. Refund in Paystack, then close the task.
          </p>
          {data.overdue.map((o) => row(o, `${o.unfilled} of ${o.needed} undelivered`))}
        </>
      )}
    </div>
  );
}

export default function Accounting() {
  const { loading, me } = useRequireRole('admin');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [backingUp, setBackingUp] = useState(false);

  const isSuperAdmin = me?.admin?.role === 'super_admin';

  function loadStats() {
    return authedFetch('/api/admin/accounting')
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setStats(d)));
  }

  useEffect(() => {
    if (!loading && isSuperAdmin) loadStats();
  }, [loading, isSuperAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function downloadBackup() {
    setBackingUp(true);
    const res = await authedFetch('/api/admin/backup');
    const data = await res.json();
    setBackingUp(false);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(`primeloop-backup-engagers-${dateStr}`, data.engagers);
    downloadCSV(`primeloop-backup-clients-${dateStr}`, data.clients);
    downloadCSV(`primeloop-backup-orders-${dateStr}`, data.orders);
    downloadCSV(`primeloop-backup-payouts-${dateStr}`, data.payouts);
  }

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
      <h1 style={{ fontSize: 30 }}>Accounting</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>The financial health of the business, at a glance.</p>

      {error && <p style={{ color: 'var(--warn)', fontSize: 14 }}>{error}</p>}

      {stats && (
        <>
          <Attention data={stats.attention} onHandled={loadStats} />
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
          {stats.trials && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, margin: '4px 0 8px' }}>Free trials</div>
              <div className="grid-3" style={{ marginBottom: 16 }}>
                <StatCard label="Trials granted (all time)" value={stats.trials.granted} plain />
                <StatCard label="Used this week (rolling 7 days)" value={`${stats.trials.last7d} of ${stats.trials.weeklyCap}`} plain color={stats.trials.last7d >= stats.trials.weeklyCap ? 'var(--warn)' : undefined} />
                <StatCard label="Trial engagements cost so far" value={stats.trials.cost} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '-6px 0 16px' }}>
                Trial cost is what engagers earn for completing trial tasks — it's already included in "paid out"
                above and reduces gross margin. Raise the weekly limit by setting TRIAL_WEEKLY_CAP in Vercel.
              </p>
            </>
          )}
          <div className="section" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 6 }}>Gross margin (revenue minus payouts and bonuses)</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: stats.grossMargin >= 0 ? 'var(--good)' : 'var(--warn)' }}>
              ₦{stats.grossMargin.toLocaleString()}
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 10 }}>
              This is a simple all-time snapshot — it doesn't yet subtract things like your AI
              verification costs, ad spend, or other operating expenses. Treat it as a starting
              point for a full P&L, not the whole picture.
            </p>
          </div>

          <div className="section" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Manual backup</div>
            <p style={{ fontSize: 14, color: 'var(--ink-mute)', marginBottom: 12 }}>
              Downloads engagers, clients, orders, and payouts as CSV files — an interim safety
              net until you're on a Supabase plan with automated point-in-time recovery. Worth
              doing weekly, or before any major change.
            </p>
            <button className="btn" onClick={downloadBackup} disabled={backingUp}>
              {backingUp ? 'Preparing...' : 'Download full backup'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
