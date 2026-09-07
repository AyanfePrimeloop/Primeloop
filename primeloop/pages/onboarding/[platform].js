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
  const [currentAction, setCurrentAction] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!platform || loading) return;
    fetch(`/api/onboarding/test?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.test) {
          setTest(d.test);
          setCurrentAction(d.test.required_actions[0]);
        }
      });
  }, [platform, loading]);

  async function submitAction() {
    if (!file || !currentAction) {
      setResult({ error: 'Choose a screenshot first.' });
      return;
    }
    setSubmitting(true);
    const { base64: imageBase64, mediaType } = await compressImageFile(file);
    const res = await authedFetch('/api/onboarding/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, action: currentAction, imageBase64, imageMediaType: mediaType }),
    });
    const data = await res.json();
    setSubmitting(false);
    setResult(data);
    if (data.progress) {
      setProgress(data.progress);
      const next = test.required_actions.find((a) => !data.progress.approvedActions.includes(a));
      setCurrentAction(next || null);
    }
    setFile(null);
  }

  if (loading || !test) return <div className="app"><p style={{ padding: 20 }}>Loading onboarding test...</p></div>;

  const allDone = progress.allApproved;

  return (
    <div className="app">
      <h1 style={{ fontSize: 24, fontWeight: 600, textTransform: 'capitalize' }}>{platform} onboarding test</h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        Signed in as {me?.engager?.code}. Complete each action below on our test post, then upload proof.
        This confirms your account before you can claim real, paid tasks on {platform}.
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
        <div className="section">
          <div className="section-head"><h2>Submit proof: {currentAction}</h2></div>
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, display: 'block', marginBottom: 5 }}>Screenshot of your {currentAction}</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <button className="btn primary" onClick={submitAction} disabled={submitting}>
              {submitting ? 'Checking...' : `Submit ${currentAction} proof`}
            </button>
            {result && (
              <p style={{ marginTop: 12, fontSize: 13, color: result.error ? 'var(--warn)' : result.verdict === 'approved' ? 'var(--good)' : 'var(--ink-soft)' }}>
                {result.error || `${result.verdict.toUpperCase()}${result.reason ? ': ' + result.reason : ''}`}
                {result.attemptNumber > 2 && result.verdict === 'pending' && (
                  <span> This is attempt {result.attemptNumber} — an admin will review it directly.</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
