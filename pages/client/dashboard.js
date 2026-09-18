import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import Logo from '../../components/Logo';
import WhatsAppButton from '../../components/WhatsAppButton';
import { platformLabel } from '../../lib/platformDomains';

export default function ClientDashboard() {
  const { loading, me } = useRequireRole('client');
  const [orders, setOrders] = useState([]);
  const [tasksByOrder, setTasksByOrder] = useState({});
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading) load();
  }, [loading]);

  async function load() {
    // Goes through a server-side route (lib/requireClient.js) instead of a
    // direct RLS-only query — it can self-heal the client/login link if
    // it's ever out of sync, instead of just silently showing nothing.
    setOrdersLoading(true);
    const res = await authedFetch('/api/client/orders');
    const data = await res.json();
    setOrders(data.orders || []);
    setTasksByOrder(data.tasksByOrder || {});
    setOrdersLoading(false);
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

      {ordersLoading && (
        <div className="section" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-mute)' }}>
          Loading your orders...
        </div>
      )}

      {!ordersLoading && orders.length === 0 && (
        <div className="section" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-mute)' }}>
          No orders yet. <a href="/" style={{ color: 'var(--navy)' }}>Place your first order</a>
        </div>
      )}

      {orders.map((order) => {
        const tasks = tasksByOrder[order.id] || [];
        const totalNeeded = tasks.reduce((sum, t) => sum + t.quantity_needed, 0);
        const totalFilled = tasks.reduce((sum, t) => sum + t.quantity_filled, 0);
        const pct = totalNeeded ? Math.round((totalFilled / totalNeeded) * 100) : 0;
        const isTrial = order.payment_status === 'trial';
        const showProgress = order.payment_status === 'paid' || isTrial;
        const awaitingLinkReview = tasks.some((t) => t.status === 'pending_review');
        // Prefilled order form for this same post — one tap from "it worked" to "more".
        const orderMoreHref = `/?platform=${order.platform}&link=${encodeURIComponent(order.post_link)}&email=${encodeURIComponent(me?.client?.email || '')}#order`;

        return (
          <div className="section" key={order.id}>
            <div className="section-head">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{platformLabel(order.platform)} {isTrial ? 'free trial' : 'order'}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-mute)' }}>
                  {new Date(order.created_at).toLocaleDateString()} · {isTrial ? 'Free' : `₦${Number(order.amount_total).toLocaleString()}`}
                </div>
              </div>
              <span className="badge" style={{
                background: order.payment_status === 'paid' || isTrial ? 'var(--good-soft)' : 'var(--warn-soft)',
                color: order.payment_status === 'paid' || isTrial ? 'var(--good)' : 'var(--warn)',
              }}>
                {isTrial ? 'free trial' : order.payment_status}
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6, wordBreak: 'break-all' }}>{order.post_link}</div>
              {awaitingLinkReview && (
                <p style={{ fontSize: 12.5, color: 'var(--warn)', margin: '0 0 12px' }}>
                  We're double-checking this link before engagers can start — this usually takes a few hours at most.
                </p>
              )}
              {showProgress && (
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
                  {isTrial && totalFilled > 0 && (
                    <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--good-soft)', borderRadius: 10 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                        {pct === 100 ? 'Your free trial is complete.' : 'Real engagement is arriving.'}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '4px 0 10px' }}>
                        Like what you see? Get more on this same post — anything we don't deliver within 5 days is refunded.
                      </div>
                      <a href={orderMoreHref} className="btn accent" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        Order more on this post →
                      </a>
                    </div>
                  )}
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
