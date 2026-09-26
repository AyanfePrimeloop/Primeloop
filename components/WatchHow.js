import VideoCard from './VideoCard';
import { hasVideo } from '../lib/videos';

// A collapsed "Watch: ..." block for a page, holding a video (or one chapter of
// it). Shows nothing until that video has somewhere to play from.
export default function WatchHow({ video, chapter, label, open = false }) {
  if (!hasVideo(video)) return null;
  return (
    <details className="section" open={open} style={{ padding: '14px 20px' }}>
      <summary style={{ fontWeight: 700, cursor: 'pointer' }}>{label}</summary>
      <div style={{ marginTop: 14 }}><VideoCard video={video} chapter={chapter} /></div>
    </details>
  );
}
