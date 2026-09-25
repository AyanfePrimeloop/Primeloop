import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import { downloadCSV } from '../../lib/csvExport';

const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
const day = (d) => (d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never');

export default function AdminClients() {
  const { loading, me } = useRequireRole('admin');
  const [clients, setClients] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [onlyBuyers, setOnlyBuyers] = useState(false);

  const isSuperAdmin = me?.admin?.role === 'super_admin';

  useEffect(() => {
    if (loading || !isSuperAdmin) return;
    authedFetch('/api/admin/clients')
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setClients(d.clients)))
      .catch(() => setError('Could not load clients.'));
  }, [loading, isSuperAdmin]);

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  if (!isSuperAdmin) {
    return (
      <div className="app">
        <AdminNav />
        <div className="section" style={{ padding: 20, color: 'var(--ink-mute)' }}>This page is restricted to super-admins.</div>
      </div>
    );
  }

  const term = q.trim().toLowerCase();
  const shown = (clients || []).filter((c) => (!onlyBuyers || c.paid_orders > 0)
    && (!term || [c.full_name, c.email, c.whatsapp].some((v) => (v || '').toLowerCase().includes(term))));
  const buyers = (clients || []).filter((c) => c.paid_orders > 0).length;
  const revenue = (clients || []).reduce((s, c) => s + c.total_spent, 0);

  return (
    <div className="app">
      <AdminNav />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 30 }}>Clients</h1>
          {clients && <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{clients.length} total</span>}
        </div>
        <button className="btn" onClick={() => downloadCSV('primeloop-clients-' + new Date().toISOString().slice(0, 10), shown.map((c) => ({
          name: c.full_name, email: c.email, whatsapp: c.whatsapp, status: c.status, paid_orders: c.paid_orders, total_spent: c.total_spent, last_order: c.last_order_at || '', joined: c.created_at,
        })))}>Download CSV</button>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>Everyone who has ordered or tried Primeloop. Spend counts paid orders only.</p>

      {error && <p role="alert" style={{ color: 'var(--warn)' }}>{error}</p>}

      {clients && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0' }}>
          <span className="badge">{clients.length} clients</span>
          <span className="badge">{buyers} have paid</span>
          <span className="badge">{naira(revenue)} total spent</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or WhatsApp" aria-label="Search clients" style={{ flex: 1, minWidth: 220 }} />
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
          <input type="checkbox" checked={onlyBuyers} onChange={(e) => setOnlyBuyers(e.target.checked)} /> Paying clients only
        </label>
      </div>

      <div className="section">
        {!clients && !error && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Loading clients...</p>}
        {clients && shown.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>No clients found.</p>}
        {shown.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--line)', fontSize: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{c.full_name || 'No name'}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{c.email}{c.whatsapp ? ' · ' + c.whatsapp : ''}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 2 }}>Joined {day(c.created_at)} · Last order {day(c.last_order_at)}</div>
            </div>
            <span className="badge">{c.paid_orders} paid {c.paid_orders === 1 ? 'order' : 'orders'}</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, minWidth: 90, textAlign: 'right' }}>{naira(c.total_spent)}</span>
            {c.whatsapp && (
              <a className="btn" style={{ fontSize: 13 }} target="_blank" rel="noreferrer" href={'https://wa.me/' + String(c.whatsapp).replace(/\D/g, '')}>WhatsApp</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
