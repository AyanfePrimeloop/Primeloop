import { useState, useEffect } from 'react';
import { useRequireRole, authedFetch } from '../../lib/authClient';

export default function ReviewQueue() {
  const { loading } = useRequireRole('admin');
  const [regular, setRegular] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!loading) load();
  }, [loading]);

  async function load() {
    const res = await authedFetch('/api/admin/review-queue');
    const data = await res.json();
    setRegular(data.regular || []);
    setOnboarding(data.onboarding || []);
  }

  async function decide(type, id, decision) {
    setBusyId(id);
    await authedFetch('/api/admin/review-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, decision }),
    });
    setBusyId(null);
    load();
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app">
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Review queue</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        Everything here was routed to manual review — either the verification setting for this
        action is Manual, it landed in the AI-sampled group that skips AI, or it's attempt 3+
        on an onboarding action (forced manual after repeated tries).
      </p>

      <div className="section">
        <div className="section-head">
          <h2>Task submissions</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{regular.length} pending</span>
        </div>
        {regular.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing pending.</p>}
        {regular.map((s) => (
          <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--navy)', fontWeight: 600 }}>
                {s.tasks?.task_code} <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>· {s.tasks?.platform} · {s.tasks?.action}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                {s.engagers?.code} — {s.engagers?.full_name} ({s.engagers?.tier})
              </div>
              {s.ai_reason && <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{s.ai_reason}</div>}
              {s.screenshot_url && (
                <img src={s.screenshot_url} alt="submission proof" style={{ maxWidth: 220, borderRadius: 6, marginTop: 8, border: '1px solid var(--line)' }} />
              )}
            </div>
            <a href={s.tasks?.post_link} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 11.5 }}>View post</a>
            <button className="btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} disabled={busyId === s.id} onClick={() => decide('regular', s.id, 'rejected')}>Reject</button>
            <button className="btn" style={{ borderColor: 'var(--good)', color: 'var(--good)' }} disabled={busyId === s.id} onClick={() => decide('regular', s.id, 'approved')}>Approve</button>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Onboarding test submissions</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{onboarding.length} pending</span>
        </div>
        {onboarding.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing pending.</p>}
        {onboarding.map((s) => (
          <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>
                {s.platform} — {s.action}
                {s.attemptNumber > 2 && (
                  <span className="badge" style={{ marginLeft: 8, background: 'var(--warn-soft)', color: 'var(--warn)' }}>
                    attempt {s.attemptNumber}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                {s.engagers?.code} — {s.engagers?.full_name}
              </div>
              {s.ai_reason && <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{s.ai_reason}</div>}
              {s.screenshot_url && (
                <img src={s.screenshot_url} alt="onboarding proof" style={{ maxWidth: 220, borderRadius: 6, marginTop: 8, border: '1px solid var(--line)' }} />
              )}
            </div>
            <button className="btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} disabled={busyId === s.id} onClick={() => decide('onboarding', s.id, 'rejected')}>Reject</button>
            <button className="btn" style={{ borderColor: 'var(--good)', color: 'var(--good)' }} disabled={busyId === s.id} onClick={() => decide('onboarding', s.id, 'approved')}>Approve</button>
          </div>
        ))}
      </div>
    </div>
  );
}
