import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { compressImageFile } from '../../lib/compressImage';
import { useRequireRole, authedFetch } from '../../lib/authClient';

export default function EngagerDashboard() {
  const { loading, me } = useRequireRole('engager');
  const [tasks, setTasks] = useState([]);
  const [taskCode, setTaskCode] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading) loadTasks();
  }, [loading]);

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    setTasks(data || []);
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
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <div className="app">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Open tasks</h1>
        <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>
          {me?.engager?.code} — {me?.engager?.full_name}
          <button className="btn" style={{ marginLeft: 10, fontSize: 11.5 }} onClick={handleLogout}>Log out</button>
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
          </div>
        ))}
      </div>

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
