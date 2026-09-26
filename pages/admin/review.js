import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import WatchHow from '../../components/WatchHow';
import { ENGAGER_RULES } from '../../lib/engagerRules';
import { useRequireRole, authedFetch } from '../../lib/authClient';
import { buildEngagerMessage, whatsappHref } from '../../lib/whatsappLink';

// Opens WhatsApp with a ready-written message explaining why the automatic
// check could not confirm this proof and what to send instead. The admin
// reads it and presses Send. Hidden if the engager has no usable number.
function WhatsAppButton({ engager, platform, action, taskCode, reason, isOnboarding }) {
  const href = whatsappHref(engager?.whatsapp, buildEngagerMessage({ name: engager?.full_name, platform, action, taskCode, reason, isOnboarding }));
  if (!href) return <span className="badge" title="This engager has no valid WhatsApp number on file">No WhatsApp number</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 13, borderColor: '#25a55a', color: '#12703a' }}>
      Message on WhatsApp
    </a>
  );
}

export default function ReviewQueue() {
  const { loading } = useRequireRole('admin');
  const [regular, setRegular] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [links, setLinks] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!loading) load();
  }, [loading]);

  async function load() {
    const res = await authedFetch('/api/admin/review-queue');
    const data = await res.json();
    setRegular(data.regular || []);
    setOnboarding(data.onboarding || []);
    setLinks(data.links || []);
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
      <AdminNav />
      <h1 style={{ fontSize: 30 }}>Review queue</h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>
        Link reviews are held back automatically before ever reaching engagers. Task and onboarding
        submissions land here when the verification setting is Manual, an AI-sampled check was
        skipped, or it's attempt 3+ on an onboarding action (forced manual after repeated tries).
      </p>

      <WatchHow video="adminTools" chapter="review" label="Watch: how to message an engager about their proof (20 seconds)" />

      <details className="section" style={{ padding: '4px 20px' }}>
        <summary style={{ cursor: 'pointer', padding: '12px 0', fontWeight: 600 }}>Reject if it breaks our quality rules (tap to see)</summary>
        <ul style={{ margin: '0 0 14px', paddingLeft: 20, fontSize: 14.5, color: 'var(--ink-soft)' }}>
          {ENGAGER_RULES.map((r) => <li key={r.title} style={{ marginBottom: 6 }}><strong>{r.title}.</strong> {r.body}</li>)}
        </ul>
      </details>

      <div className="section">
        <div className="section-head">
          <h2>Link reviews</h2>
          <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{links.length} pending</span>
        </div>
        <p style={{ padding: '0 20px', fontSize: 14, color: 'var(--ink-mute)', marginTop: 12 }}>
          The automated check flagged these — the link didn't load, or its domain doesn't match the
          platform paid for. None of these have gone live to engagers yet.
        </p>
        {links.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing pending.</p>}
        {links.map((t) => (
          <div key={t.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--navy)', fontWeight: 600 }}>
                {t.task_code} <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>· {t.platform} · {t.action} · qty {t.quantity_needed}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2, wordBreak: 'break-all' }}>{t.post_link}</div>
              {t.link_check_reason && (
                <div style={{ fontSize: 13, color: 'var(--warn)', marginTop: 4 }}>{t.link_check_reason}</div>
              )}
            </div>
            <a href={t.post_link} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 13 }}>Open link</a>
            <button className="btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} disabled={busyId === t.id} onClick={() => decide('link', t.id, 'rejected')}>Reject</button>
            <button className="btn" style={{ borderColor: 'var(--good)', color: 'var(--good)' }} disabled={busyId === t.id} onClick={() => decide('link', t.id, 'approved')}>Approve — open to engagers</button>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Task submissions</h2>
          <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{regular.length} pending</span>
        </div>
        {regular.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing pending.</p>}
        {regular.map((s) => (
          <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--navy)', fontWeight: 600 }}>
                {s.tasks?.task_code} <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>· {s.tasks?.platform} · {s.tasks?.action}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                {s.engagers?.code} — {s.engagers?.full_name} ({s.engagers?.tier})
              </div>
              {s.ai_reason && <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>{s.ai_reason}</div>}
              {s.screenshot_url && (
                <img src={s.screenshot_url} alt="submission proof" style={{ maxWidth: 220, borderRadius: 6, marginTop: 8, border: '1px solid var(--line)' }} />
              )}
            </div>
            <WhatsAppButton engager={s.engagers} platform={s.tasks?.platform} action={s.tasks?.action} taskCode={s.tasks?.task_code} reason={s.ai_reason} />
            <a href={s.tasks?.post_link} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 13 }}>View post</a>
            <button className="btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} disabled={busyId === s.id} onClick={() => decide('regular', s.id, 'rejected')}>Reject</button>
            <button className="btn" style={{ borderColor: 'var(--good)', color: 'var(--good)' }} disabled={busyId === s.id} onClick={() => decide('regular', s.id, 'approved')}>Approve</button>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Onboarding test submissions</h2>
          <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{onboarding.length} pending</span>
        </div>
        {onboarding.length === 0 && <p style={{ padding: 20, color: 'var(--ink-mute)' }}>Nothing pending.</p>}
        {onboarding.map((s) => (
          <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>
                {s.platform} — {s.action}
                {s.attemptNumber > 2 && (
                  <span className="badge" style={{ marginLeft: 8, background: 'var(--warn-soft)', color: 'var(--warn)' }}>
                    attempt {s.attemptNumber}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                {s.engagers?.code} — {s.engagers?.full_name}
              </div>
              {s.ai_reason && <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>{s.ai_reason}</div>}
              {s.screenshot_url && (
                <img src={s.screenshot_url} alt="onboarding proof" style={{ maxWidth: 220, borderRadius: 6, marginTop: 8, border: '1px solid var(--line)' }} />
              )}
            </div>
            <WhatsAppButton engager={s.engagers} platform={s.platform} action={s.action} reason={s.ai_reason} isOnboarding />
            <button className="btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} disabled={busyId === s.id} onClick={() => decide('onboarding', s.id, 'rejected')}>Reject</button>
            <button className="btn" style={{ borderColor: 'var(--good)', color: 'var(--good)' }} disabled={busyId === s.id} onClick={() => decide('onboarding', s.id, 'approved')}>Approve</button>
          </div>
        ))}
      </div>
    </div>
  );
}
