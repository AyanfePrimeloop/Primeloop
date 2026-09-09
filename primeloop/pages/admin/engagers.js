import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import { downloadCSV } from '../../lib/csvExport';

const TIERS = ['bronze', 'silver', 'gold', 'platinum'];
const STATUSES = ['active', 'warned', 'dismissed'];

export default function AdminEngagers() {
  const { loading } = useRequireRole('admin');
  const [engagers, setEngagers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!loading) load();
  }, [loading, statusFilter]);

  async function load() {
    const url = statusFilter ? `/api/admin/engagers?status=${statusFilter}` : '/api/admin/engagers';
    const res = await authedFetch(url);
    const data = await res.json();
    setEngagers(data.engagers || []);
  }

  async function updateEngager(id, field, value) {
    setBusyId(id);
    await authedFetch('/api/admin/engagers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value }),
    });
    setBusyId(null);
    load();
  }

  function exportCSV() {
    downloadCSV(
      `primeloop-engagers-${statusFilter || 'all'}-${new Date().toISOString().slice(0, 10)}`,
      engagers.map((e) => ({
        code: e.code,
        full_name: e.full_name,
        whatsapp: e.whatsapp,
        tier: e.tier,
        status: e.status,
        tasks_completed: e.tasks_completed,
        tasks_approved: e.tasks_approved,
        approval_rate: e.approval_rate,
        verified_platforms: (e.engager_platform_accounts || []).filter((p) => p.verification_status === 'verified').map((p) => p.platform).join('; '),
        created_at: e.created_at,
      }))
    );
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app">
      <AdminNav />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Engagers</h1>
        <button className="btn" onClick={exportCSV}>Download CSV</button>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        Your warning policy: first warning, discard the submission, then dismissal if it continues.
        Change status here when that happens.
      </p>

      <div style={{ display: 'flex', gap: 6, margin: '16px 0', flexWrap: 'wrap' }}>
        <button className="btn" style={!statusFilter ? { background: 'var(--navy)', color: '#fff' } : {}} onClick={() => setStatusFilter('')}>All</button>
        {STATUSES.map((s) => (
          <button key={s} className="btn" style={statusFilter === s ? { background: 'var(--navy)', color: '#fff' } : {}} onClick={() => setStatusFilter(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="section">
        {engagers.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>No engagers found.</p>}
        {engagers.map((e) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--line)', fontSize: 13, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--navy)' }}>{e.code}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{e.full_name} · {e.whatsapp}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                {e.tasks_completed} completed · {e.approval_rate}% approval
                {' · '}
                {(e.engager_platform_accounts || []).filter((p) => p.verification_status === 'verified').map((p) => p.platform).join(', ') || 'no platforms verified'}
              </div>
            </div>
            <select value={e.tier} onChange={(ev) => updateEngager(e.id, 'tier', ev.target.value)} disabled={busyId === e.id}>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={e.status} onChange={(ev) => updateEngager(e.id, 'status', ev.target.value)} disabled={busyId === e.id}
              style={{
                color: e.status === 'dismissed' ? 'var(--bad, #b23434)' : e.status === 'warned' ? 'var(--warn)' : 'var(--good)',
                fontWeight: 500,
              }}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
