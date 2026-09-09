import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { compressImageFile } from '../../lib/compressImage';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import Logo from '../../components/Logo';

export default function EngagerDashboard() {
  const { loading, me } = useRequireRole('engager');
  const [tasks, setTasks] = useState([]);
  const [taskCode, setTaskCode] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState([]);
  const [pending, setPending] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [referrals, setReferrals] = useState({ count: 0, earned: 0 });

  useEffect(() => {
    if (!loading) {
      loadTasks();
      loadEarnings();
      loadReferrals();
    }
  }, [loading]);

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setTasks(data || []);
  }

  async function loadEarnings() {
    // RLS already restricts this to the logged-in engager's own rows —
    // see the "engagers see own submissions" policy in schema.sql.
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, submitted_at, final_status, tasks(task_code, platform, action, price_per_unit)')
      .in('final_status', ['approved', 'pending'])
      .order('submitted_at', { ascending: false });
    setApproved((submissions || []).filter((s) => s.final_status === 'approved'));
    setPending((submissions || []).filter((s) => s.final_status === 'pending'));

    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount')
      .eq('status', 'paid');
    setTotalPaid((payouts || []).reduce((sum, p) => sum + Number(p.amount), 0));
  }

  async function loadReferrals() {
    // RLS restricts this to bonuses where the logged-in engager is the referrer.
    const { data: bonuses } = await supabase.from('referral_bonuses').select('*');
    const earned = (bonuses || [])
      .filter((b) => ['earned_unpaid', 'paid'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.bonus_amount), 0);
    setReferrals({ count: (bonuses || []).length, earned });
  }

  async function submitProof() {
    if (!taskCode || !file) {
      setResult({ error: 'Choose a task and a screenshot.' });
      return;
    }
    setSubmitting(true);
    const { base64: imageBase64, mediaType } = await compressImageFile(file);
    const res = await authedFetch('/api/submissions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskCode, imageBase64, imageMediaType: mediaType }),
    });
    const data = await res.json();
    setSubmitting(false);
    setResult(data);
    loadTasks();
    loadEarnings();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  const totalEarned = approved.reduce((sum, s) => sum + Number(s.tasks?.price_per_unit || 0), 0);

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={28} />
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Open tasks</h1>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>
          {me?.engager?.code} — {me?.engager?.full_name}
          <a href="/choose-dashboard" style={{ marginLeft: 10, fontSize: 11.5, color: 'var(--ink-mute)' }}>Switch dashboard</a>
          <a href="/engager/bank-details" className="btn" style={{ marginLeft: 10, fontSize: 11.5, textDecoration: 'none' }}>Bank details</a>
          <button className="btn" style={{ marginLeft: 10, fontSize: 11.5 }} onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div className="grid-3" style={{ margin: '16px 0 20px' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6 }}>Total earned (approved)</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>₦{totalEarned.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6 }}>Already paid out</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>₦{totalPaid.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6 }}>Pending next payout</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--good)' }}>₦{Math.max(0, totalEarned - totalPaid).toLocaleString()}</div>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Available now</h2></div>
        {tasks.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>No open tasks right now — check back soon.</p>}
        {tasks.map((t) => (
          <div className="task-row" key={t.id}>
            <div>
              <div className="task-id">{t.task_code}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{t.platform}</div>
            </div>
            <div style={{ textTransform: 'capitalize' }}>{t.action}</div>
            <div><span className="badge">{t.quantity_filled}/{t.quantity_needed}</span></div>
            <div style={{ fontFamily: 'var(--mono)' }} title="What you earn for this task">₦{t.price_per_unit}</div>
            <a href={t.post_link} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 11.5, textDecoration: 'none', textAlign: 'center' }}>
              Open post
            </a>
            <button className="btn primary" onClick={() => setTaskCode(t.task_code)}>Select</button>
            {t.special_instructions && (
              <div style={{
                gridColumn: '1 / -1', fontSize: 12, color: 'var(--ink-soft)', background: 'var(--paper)',
                borderRadius: 6, padding: '8px 10px', marginTop: 4,
              }}>
                <strong style={{ color: 'var(--ink)' }}>Client note:</strong> {t.special_instructions}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Pending review</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{pending.length} waiting</span>
        </div>
        <p style={{ padding: '0 20px', fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 12 }}>
          You've already submitted proof for these — no need to submit again. They'll move to
          Approved tasks once reviewed.
        </p>
        {pending.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing waiting right now.</p>}
        {pending.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--navy)', fontWeight: 600 }}>{s.tasks?.task_code}</span>
              <span style={{ color: 'var(--ink-mute)', marginLeft: 8, textTransform: 'capitalize' }}>{s.tasks?.platform} · {s.tasks?.action}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
            <span className="badge" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>Waiting for review</span>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Approved tasks</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{approved.length} total</span>
        </div>
        {approved.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing approved yet — complete a task above to see it here.</p>}
        {approved.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--navy)', fontWeight: 600 }}>{s.tasks?.task_code}</span>
              <span style={{ color: 'var(--ink-mute)', marginLeft: 8, textTransform: 'capitalize' }}>{s.tasks?.platform} · {s.tasks?.action}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--good)' }}>+₦{s.tasks?.price_per_unit}</div>
          </div>
        ))}
      </div>

      {['gold', 'platinum'].includes(me?.engager?.tier) ? (
        <div className="section">
          <div className="section-head"><h2>Refer other engagers</h2></div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
              Share your link. Once someone you refer completes 10 approved tasks, you earn a bonus —
              paid automatically with your next weekly payout.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                readOnly
                style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 12.5 }}
                value={typeof window !== 'undefined' ? `${window.location.origin}/join?ref=${me?.engager?.code}` : ''}
                onClick={(e) => e.target.select()}
              />
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
              <div><strong>{referrals.count}</strong> people referred</div>
              <div><strong style={{ color: 'var(--good)' }}>₦{referrals.earned.toLocaleString()}</strong> earned from referrals</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="section" style={{ padding: 20, color: 'var(--ink-mute)', fontSize: 13 }}>
          Reach Gold tier to unlock your referral link and start earning bonuses for bringing in new engagers.
        </div>
      )}

      <div className="section">
        <div className="section-head"><h2>Submit proof</h2></div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Task code</label>
            <input style={{ width: '100%' }} value={taskCode} onChange={(e) => setTaskCode(e.target.value)} placeholder="FB-5714-A6" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Screenshot</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <button className="btn primary" onClick={submitProof} disabled={submitting}>
            {submitting ? 'Checking...' : 'Submit proof'}
          </button>
          {result && (
            <p style={{ marginTop: 12, fontSize: 13, color: result.error ? 'var(--warn)' : result.verdict === 'approved' ? 'var(--good)' : 'var(--ink-soft)' }}>
              {result.error || `${result.verdict.toUpperCase()}: ${result.reason}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
