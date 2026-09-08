import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { compressImageFile } from '../../lib/compressImage';
import { useRequireRole, authedFetch } from '../../lib/authClient';

export default function OnboardingTest() {
  const router = useRouter();
  const { platform } = router.query;
  const { loading, me } = useRequireRole('engager');

  const [test, setTest] = useState(null);
  const [progress, setProgress] = useState({ approvedActions: [] });
  // Per-action state, keyed by action name: { file, result, submitting }
  const [actionState, setActionState] = useState({});

  useEffect(() => {
    if (!platform || loading) return;
    fetch(`/api/onboarding/test?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.test) {
          setTest(d.test);
          const initial = {};
          d.test.required_actions.forEach((a) => (initial[a] = { file: null, result: null, submitting: false }));
          setActionState(initial);
        }
      });
  }, [platform, loading]);

  function setFileFor(action, file) {
    setActionState((s) => ({ ...s, [action]: { ...s[action], file } }));
  }

  async function submitAction(action) {
    const entry = actionState[action];
    if (!entry?.file) {
      setActionState((s) => ({ ...s, [action]: { ...s[action], result: { error: 'Choose a screenshot first.' } } }));
      return;
    }
    setActionState((s) => ({ ...s, [action]: { ...s[action], submitting: true } }));

    const { base64: imageBase64, mediaType } = await compressImageFile(entry.file);
    const res = await authedFetch('/api/onboarding/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, action, imageBase64, imageMediaType: mediaType }),
    });
    const data = await res.json();

    setActionState((s) => ({ ...s, [action]: { file: null, result: data, submitting: false } }));
    if (data.progress) setProgress(data.progress);
  }

  if (loading || !test) return <div className="app"><p style={{ padding: 20 }}>Loading onboarding test...</p></div>;

  const allDone = progress.allApproved;
  const remainingActions = test.required_actions.filter((a) => !progress.approvedActions?.includes(a));

  return (
    <div className="app">
      <h1 style={{ fontSize: 24, fontWeight: 600, textTransform: 'capitalize' }}>{platform} onboarding test</h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        Signed in as {me?.engager?.code}. Complete every action below on our test post, then upload proof for
        each one — you can submit them all now, no need to wait between actions. This confirms your account
        before you can claim real, paid tasks on {platform}.
      </p>

      <div className="section">
        <div className="section-head"><h2>Test post</h2></div>
        <div style={{ padding: 20 }}>
          <a href={test.post_link} target="_blank" rel="noreferrer" style={{ color: 'var(--navy)', wordBreak: 'break-all' }}>
            {test.post_link}
          </a>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {test.required_actions.map((a) => (
              <span
                key={a}
                className="badge"
                style={{
                  textTransform: 'capitalize',
                  background: progress.approvedActions?.includes(a) ? 'var(--good-soft)' : 'var(--paper)',
                  color: progress.approvedActions?.includes(a) ? 'var(--good)' : 'var(--ink-soft)',
                }}
              >
                {progress.approvedActions?.includes(a) ? '✓ ' : ''}{a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {allDone ? (
        <div className="section" style={{ padding: 20, background: 'var(--good-soft)' }}>
          <p style={{ color: 'var(--good)', fontWeight: 600, margin: 0 }}>
            All actions verified — your {platform} account is confirmed. You can now claim real tasks on this platform.
          </p>
        </div>
      ) : (
        remainingActions.map((action) => {
          const entry = actionState[action] || {};
          return (
            <div className="section" key={action}>
              <div className="section-head"><h2 style={{ textTransform: 'capitalize' }}>Submit proof: {action}</h2></div>
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Screenshot of your {action}</label>
                  <input type="file" accept="image/*" onChange={(e) => setFileFor(action, e.target.files[0])} />
                </div>
                <button className="btn primary" onClick={() => submitAction(action)} disabled={entry.submitting}>
                  {entry.submitting ? 'Checking...' : `Submit ${action} proof`}
                </button>
                {entry.result && (
                  <p style={{ marginTop: 12, fontSize: 13, color: entry.result.error ? 'var(--warn)' : entry.result.verdict === 'approved' ? 'var(--good)' : 'var(--ink-soft)' }}>
                    {entry.result.error || `${entry.result.verdict.toUpperCase()}${entry.result.reason ? ': ' + entry.result.reason : ''}`}
                    {entry.result.attemptNumber > 2 && entry.result.verdict === 'pending' && (
                      <span> This is attempt {entry.result.attemptNumber} — an admin will review it directly.</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
