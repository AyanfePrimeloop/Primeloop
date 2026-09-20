import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { compressImageFile } from '../../lib/compressImage';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import AppBar from '../../components/AppBar';
import PushOptIn from '../../components/PushOptIn';
import ChannelInvite from '../../components/ChannelInvite';
import GetStarted from '../../components/GetStarted';
import EarnMore from '../../components/EarnMore';
import VideoCard from '../../components/VideoCard';
import QualityRules from '../../components/QualityRules';
import { MIN_COMMENT_WORDS } from '../../lib/engagerRules';
import { MIN_PAYOUT } from '../../lib/payoutRules';

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
  const [verifiedPlatforms, setVerifiedPlatforms] = useState(new Set());
  const [platformStatuses, setPlatformStatuses] = useState({});

  useEffect(() => {
    if (!loading) {
      loadTasks();
      loadEarnings();
      loadReferrals();
      loadPlatformStatus();
    }
  }, [loading]);

  async function loadPlatformStatus() {
    const { data } = await supabase.from('engager_platform_accounts').select('platform, verification_status');
    setVerifiedPlatforms(new Set((data || []).filter((p) => p.verification_status === 'verified').map((p) => p.platform)));
    setPlatformStatuses(Object.fromEntries((data || []).map((p) => [p.platform, p.verification_status])));
  }

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    // If this same login also has a client account, never show them tasks
    // from their own orders — completing your own task and collecting the
    // engager payout is a conflict of interest, not a real engagement.
    const ownClientId = me?.client?.id;
    const filtered = ownClientId ? (data || []).filter((t) => t.client_id !== ownClientId) : (data || []);
    setTasks(filtered);
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
    const res = await authedFetch('/api/engager/referrals');
    const data = await res.json();
    setReferrals({ count: data.count || 0, earned: data.earned || 0 });
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

  function selectTask(code) {
    setTaskCode(code);
    // The proof form is further down the page; without this, tapping Select looks like nothing happened.
    const el = document.getElementById('submit-proof');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => document.getElementById('proof-file')?.focus({ preventScroll: true }), 400);
    }
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  const totalEarned = approved.reduce((sum, s) => sum + Number(s.tasks?.price_per_unit || 0), 0);

  return (
    <>
    <AppBar links={[
      { href: '/engager/dashboard', label: 'Tasks', current: true },
      { href: '/engager/bank-details', label: 'Bank details' },
      { href: '/engager/profile', label: 'Profile' },
      { href: '/choose-dashboard', label: 'Switch dashboard' },
      { label: 'Log out', onClick: handleLogout },
    ]} />
    <div className="app">
      <div className="page-head">
        <h1>Open tasks</h1>
        <p>{me?.engager?.full_name} · {me?.engager?.code}</p>
      </div>

      <GetStarted
        hasVerifiedPlatform={verifiedPlatforms.size > 0}
        hasBank={!!me?.engager?.paystack_recipient_code}
        hasApprovedTask={approved.length > 0}
      />

      {approved.length === 0 && (
        <details className="section" style={{ padding: '14px 20px' }}>
          <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Watch: how to earn (under 4 minutes)</summary>
          <div style={{ marginTop: 14 }}><VideoCard video="engager" /></div>
        </details>
      )}

      <EarnMore hasApprovedTask={approved.length > 0} statuses={platformStatuses} />

      {!me?.engager?.paystack_recipient_code && verifiedPlatforms.size > 0 && approved.length > 0 && (
        <div className="section" style={{ padding: '14px 20px', background: 'var(--warn-soft)', border: '1px solid var(--warn)' }}>
          <strong style={{ color: 'var(--warn)' }}>Add your bank details to get paid.</strong>{' '}
          <span style={{ color: 'var(--ink-soft)', fontSize: 14 }}>You've earned money, but we can't pay you until this is done.</span>{' '}
          <a href="/engager/bank-details" style={{ color: 'var(--navy)', fontWeight: 600 }}>Add bank details →</a>
        </div>
      )}

      <PushOptIn />
      <ChannelInvite />

      <div className="grid-3" style={{ margin: '16px 0 20px' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 6 }}>Total earned (approved)</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>₦{totalEarned.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 6 }}>Already paid out</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>₦{totalPaid.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 6 }}>Pending next payout</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--good)' }}>₦{Math.max(0, totalEarned - totalPaid).toLocaleString()}</div>
          {MIN_PAYOUT > 0 && (
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>
              {Math.max(0, totalEarned - totalPaid) >= MIN_PAYOUT
                ? 'Comes to you this Friday.'
                : `Paid on a Friday once you reach ₦${MIN_PAYOUT.toLocaleString()}. You are ₦${(MIN_PAYOUT - Math.max(0, totalEarned - totalPaid)).toLocaleString()} away.`}
            </div>
          )}
        </div>
      </div>

      <QualityRules defaultOpen={approved.length === 0} />

      <div className="section">
        <div className="section-head"><h2>Available now</h2></div>
        {tasks.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>No open tasks right now — check back soon.</p>}
        {tasks.map((t) => (
          <div className="task-row" key={t.id}>
            <div>
              <div className="task-id">{t.task_code}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>{t.platform}</div>
            </div>
            <div style={{ textTransform: 'capitalize' }}>
              {t.action}
              {['comment', 'reply'].includes(t.action) && (
                <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', textTransform: 'none' }}>Specific to the post, {MIN_COMMENT_WORDS}+ words</div>
              )}
              {['watch'].includes(t.action) && (
                <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', textTransform: 'none' }}>Watch to the end</div>
              )}
              {['follow', 'subscribe'].includes(t.action) && (
                <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', textTransform: 'none' }}>Keep it, never remove</div>
              )}
            </div>
            <div><span className="badge">{t.quantity_filled}/{t.quantity_needed}</span></div>
            <div style={{ fontFamily: 'var(--mono)' }} title="What you earn for this task">₦{t.price_per_unit}</div>
            <a href={t.post_link} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>
              Open post
            </a>
            {verifiedPlatforms.has(t.platform) ? (
              <button className="btn primary" onClick={() => selectTask(t.task_code)}>Select</button>
            ) : (
              <a href={`/onboarding/${t.platform}`} className="btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)', textDecoration: 'none', textAlign: 'center' }}>
                Onboarding needed
              </a>
            )}
            {t.special_instructions && (
              <div style={{
                gridColumn: '1 / -1', fontSize: 13, color: 'var(--ink-soft)', background: 'var(--paper)',
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
          <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{pending.length} waiting</span>
        </div>
        <p style={{ padding: '0 20px', fontSize: 14, color: 'var(--ink-mute)', marginTop: 12 }}>
          You've already submitted proof for these — no need to submit again. They'll move to
          Approved tasks once reviewed.
        </p>
        {pending.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing waiting right now.</p>}
        {pending.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--navy)', fontWeight: 600 }}>{s.tasks?.task_code}</span>
              <span style={{ color: 'var(--ink-mute)', marginLeft: 8, textTransform: 'capitalize' }}>{s.tasks?.platform} · {s.tasks?.action}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
            <span className="badge" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>Waiting for review</span>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Approved tasks</h2>
          <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{approved.length} total</span>
        </div>
        {approved.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing approved yet — complete a task above to see it here.</p>}
        {approved.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--navy)', fontWeight: 600 }}>{s.tasks?.task_code}</span>
              <span style={{ color: 'var(--ink-mute)', marginLeft: 8, textTransform: 'capitalize' }}>{s.tasks?.platform} · {s.tasks?.action}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{new Date(s.submitted_at).toLocaleDateString()}</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--good)' }}>+₦{s.tasks?.price_per_unit}</div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head"><h2>Refer other engagers</h2></div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 12 }}>
            Share your link. Once someone you refer completes 10 approved tasks, you earn a bonus —
            paid automatically with your next weekly payout.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              readOnly
              style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 14 }}
              value={typeof window !== 'undefined' ? `${window.location.origin}/join?ref=${me?.engager?.code}` : ''}
              onClick={(e) => e.target.select()}
            />
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 14 }}>
            <div><strong>{referrals.count}</strong> people referred</div>
            <div><strong style={{ color: 'var(--good)' }}>₦{referrals.earned.toLocaleString()}</strong> earned from referrals</div>
          </div>
        </div>
      </div>

      <div className="section" id="submit-proof">
        <div className="section-head"><h2>Submit proof</h2></div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 14, display: 'block', marginBottom: 5 }}>Task code</label>
            <input style={{ width: '100%' }} value={taskCode} onChange={(e) => setTaskCode(e.target.value)} placeholder="FB-5714-A6" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, display: 'block', marginBottom: 5 }}>Screenshot</label>
            <input id="proof-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <button className="btn primary" onClick={submitProof} disabled={submitting}>
            {submitting ? 'Checking...' : 'Submit proof'}
          </button>
          {result && (
            <p style={{ marginTop: 12, fontSize: 14, color: result.error ? 'var(--warn)' : result.verdict === 'approved' ? 'var(--good)' : 'var(--ink-soft)' }}>
              {result.error || `${result.verdict.toUpperCase()}: ${result.reason}`}
              {result.needsOnboarding && result.platform && (
                <>
                  {' '}
                  <a href={`/onboarding/${result.platform}`} style={{ color: 'var(--navy)', fontWeight: 600 }}>
                    Complete {result.platform} onboarding →
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, marginTop: 20 }}>
        Need engagement for your own post instead? <a href="/" style={{ color: 'var(--navy)' }}>Order here</a>
      </p>
    </div>
    </>
  );
}
