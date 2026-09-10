import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRequireRole } from '../../lib/authClient';
import Logo from '../../components/Logo';
import WhatsAppButton from '../../components/WhatsAppButton';

export default function ClientDashboard() {
  const { loading, me } = useRequireRole('client');
  const [orders, setOrders] = useState([]);
  const [tasksByOrder, setTasksByOrder] = useState({});

  useEffect(() => {
    if (!loading) load();
  }, [loading]);

  async function load() {
    // RLS restricts this to the logged-in client's own orders —
    // see the "clients see own orders" policy in schema.sql.
    const { data: orderRows } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(orderRows || []);

    const grouped = {};
    for (const order of orderRows || []) {
      const { data: taskRows } = await supabase.from('tasks').select('*').eq('order_id', order.id);
      grouped[order.id] = taskRows || [];
    }
    setTasksByOrder(grouped);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={28} />
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Your orders</h1>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>
          {me?.client?.email}
          <a href="/choose-dashboard" style={{ marginLeft: 10, fontSize: 11.5, color: 'var(--ink-mute)' }}>Switch dashboard</a>
          <button className="btn" style={{ marginLeft: 10, fontSize: 11.5 }} onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="section" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-mute)' }}>
          No orders yet. <a href="/" style={{ color: 'var(--navy)' }}>Place your first order</a>
        </div>
      )}

      {orders.map((order) => {
        const tasks = tasksByOrder[order.id] || [];
        const totalNeeded = tasks.reduce((sum, t) => sum + t.quantity_needed, 0);
        const totalFilled = tasks.reduce((sum, t) => sum + t.quantity_filled, 0);
        const pct = totalNeeded ? Math.round((totalFilled / totalNeeded) * 100) : 0;

        return (
          <div className="section" key={order.id}>
            <div className="section-head">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{order.platform} order</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-mute)' }}>
                  {new Date(order.created_at).toLocaleDateString()} · ₦{Number(order.amount_total).toLocaleString()}
                </div>
              </div>
              <span className="badge" style={{
                background: order.payment_status === 'paid' ? 'var(--good-soft)' : 'var(--warn-soft)',
                color: order.payment_status === 'paid' ? 'var(--good)' : 'var(--warn)',
              }}>
                {order.payment_status}
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6, wordBreak: 'break-all' }}>{order.post_link}</div>
              {order.payment_status === 'paid' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--navy)' }} />
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>{totalFilled}/{totalNeeded} done</div>
                  </div>
                  <div className="grid-tasks">
                    {tasks.map((t) => (
                      <div key={t.id} style={{ background: 'var(--paper)', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{t.quantity_filled}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'capitalize' }}>{t.action}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      <p style={{ textAlign: 'center', fontSize: 13, marginTop: 20 }}>
        Want to earn money as an engager instead? <a href="/join" style={{ color: 'var(--navy)' }}>Join here</a>
      </p>

      <WhatsAppButton />
    </div>
  );
}
