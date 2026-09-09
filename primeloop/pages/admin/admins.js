import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { useRequireRole, authedFetch } from '../../lib/authClient';

export default function AdminAdmins() {
  const { loading, me } = useRequireRole('admin');
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState(false);

  const isSuperAdmin = me?.admin?.role === 'super_admin';

  useEffect(() => {
    if (!loading && isSuperAdmin) load();
  }, [loading, isSuperAdmin]);

  async function load() {
    const res = await authedFetch('/api/admin/admins');
    const data = await res.json();
    setAdmins(data.admins || []);
  }

  async function invite() {
    setInviting(true);
    setError('');
    const res = await authedFetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEmail('');
    load();
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
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Admins</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        Invite a new admin — they'll get an email to set their own password.
      </p>

      <div className="section">
        <div style={{ padding: 20, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Email</label>
            <input style={{ width: '100%' }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="newadmin@email.com" />
          </div>
          <div>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super-admin</option>
            </select>
          </div>
          <button className="btn primary" onClick={invite} disabled={inviting || !email}>
            {inviting ? 'Sending invite...' : 'Invite admin'}
          </button>
        </div>
        {error && <p style={{ color: 'var(--warn)', fontSize: 13, padding: '0 20px 16px' }}>{error}</p>}
      </div>

      <div className="section">
        {admins.map((a) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
            <div>{a.email}</div>
            <span className="badge" style={{ background: a.role === 'super_admin' ? 'var(--good-soft)' : 'var(--paper)', color: a.role === 'super_admin' ? 'var(--good)' : 'var(--ink-soft)' }}>
              {a.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
