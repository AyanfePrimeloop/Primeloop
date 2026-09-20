import AdminNav from '../../components/AdminNav';
import VideoCard from '../../components/VideoCard';
import { VIDEOS } from '../../lib/videos';
import { useRequireRole } from '../../lib/authClient';

export default function AdminHelp() {
  const { loading } = useRequireRole('admin');
  if (loading) return <div className="app"><p>Loading…</p></div>;
  return (
    <div className="app">
      <AdminNav />
      <div className="page-head">
        <h1>Help videos</h1>
        <p>The full walkthrough, and the short parts you will need most.</p>
      </div>
      <div className="section">
        <VideoCard video="admin" />
      </div>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {Object.keys(VIDEOS.admin.chapters).map((c) => (
          <div key={c}><VideoCard video="admin" chapter={c} compact /></div>
        ))}
      </div>
    </div>
  );
}
