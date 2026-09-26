import AdminNav from '../../components/AdminNav';
import VideoCard from '../../components/VideoCard';
import { VIDEOS, hasVideo } from '../../lib/videos';
import { useRequireRole } from '../../lib/authClient';

const grid = { display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 20 };

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

      {hasVideo('adminTools') && (
        <>
          <h2 style={{ fontSize: 19, margin: '0 0 10px' }}>New tools: placing orders, messaging engagers, broadcasts</h2>
          <div className="section">
            <VideoCard video="adminTools" />
          </div>
          <div style={grid}>
            {Object.keys(VIDEOS.adminTools.chapters).map((c) => (
              <div key={c}><VideoCard video="adminTools" chapter={c} compact /></div>
            ))}
          </div>
          <h2 style={{ fontSize: 19, margin: '0 0 10px' }}>The full admin walkthrough</h2>
        </>
      )}

      <div className="section">
        <VideoCard video="admin" />
      </div>
      <div style={grid}>
        {Object.keys(VIDEOS.admin.chapters).map((c) => (
          <div key={c}><VideoCard video="admin" chapter={c} compact /></div>
        ))}
      </div>
    </div>
  );
}
