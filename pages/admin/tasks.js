import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import { downloadCSV } from '../../lib/csvExport';

const STATUSES = ['open', 'closed', 'pending_review', 'rejected'];

export default function AdminTasks() {
  const { loading } = useRequireRole('admin');
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('open');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!loading) load();
  }, [loading, statusFilter]);

  async function load() {
    const url = statusFilter ? `/api/admin/tasks?status=${statusFilter}` : '/api/admin/tasks';
    const res = await authedFetch(url);
    const data = await res.json();
    setTasks(data.tasks || []);
  }

  async function closeTask(id) {
    setBusyId(id);
    await authedFetch('/api/admin/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'closed' }),
    });
    setBusyId(null);
    load();
  }

  function exportCSV() {
    downloadCSV(
      `primeloop-tasks-${statusFilter || 'all'}-${new Date().toISOString().slice(0, 10)}`,
      tasks.map((t) => ({
        task_code: t.task_code,
        platform: t.platform,
        action: t.action,
        quantity_needed: t.quantity_needed,
        quantity_filled: t.quantity_filled,
        price_per_unit: t.price_per_unit,
        status: t.status,
        post_link: t.post_link,
        special_instructions: t.special_instructions || '',
        created_at: t.created_at,
      }))
    );
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app">
      <AdminNav />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Task board</h1>
        <button className="btn" onClick={exportCSV}>Download CSV</button>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>Every task, most recent first. Showing up to 200.</p>

      <div style={{ display: 'flex', gap: 6, margin: '16px 0', flexWrap: 'wrap' }}>
        <button className="btn" style={!statusFilter ? { background: 'var(--navy)', color: '#fff' } : {}} onClick={() => setStatusFilter('')}>All</button>
        {STATUSES.map((s) => (
          <button key={s} className="btn" style={statusFilter === s ? { background: 'var(--navy)', color: '#fff' } : {}} onClick={() => setStatusFilter(s)}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="section">
        {tasks.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>No tasks match this filter.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="task-row" style={{ gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr 1fr' }}>
            <div>
              <div className="task-id">{t.task_code}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{t.platform}</div>
            </div>
            <div style={{ textTransform: 'capitalize' }}>{t.action}</div>
            <div><span className="badge">{t.quantity_filled}/{t.quantity_needed}</span></div>
            <div style={{ fontFamily: 'var(--mono)' }}>₦{t.price_per_unit}</div>
            <div>
              <span className="badge" style={{
                background: t.status === 'open' ? 'var(--good-soft)' : t.status === 'pending_review' ? 'var(--warn-soft)' : 'var(--paper)',
                color: t.status === 'open' ? 'var(--good)' : t.status === 'pending_review' ? 'var(--warn)' : 'var(--ink-soft)',
              }}>
                {t.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={t.post_link} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 11.5 }}>Link</a>
              {t.status === 'open' && (
                <button className="btn" style={{ fontSize: 11.5 }} disabled={busyId === t.id} onClick={() => closeTask(t.id)}>Close</button>
              )}
            </div>
            {t.special_instructions && (
              <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: 'var(--ink-soft)', background: 'var(--paper)', borderRadius: 6, padding: '6px 10px' }}>
                <strong>Client note:</strong> {t.special_instructions}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
