import { useState } from 'react';
import { VIDEOS } from '../lib/videos';

// Click-to-play YouTube video. Nothing from YouTube loads until the visitor
// presses play (privacy-friendly and keeps pages fast). Pass `chapter` to play
// only that part of the video.
export default function VideoCard({ video, chapter, title, compact = false }) {
  const [playing, setPlaying] = useState(false);
  const v = VIDEOS[video];
  const ch = chapter && v.chapters[chapter];
  const label = title || (ch ? ch.title : v.title);
  const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1' });
  if (ch) { params.set('start', ch.start); params.set('end', ch.end); }
  const src = `https://www.youtube-nocookie.com/embed/${v.id}?${params}`;

  function play() {
    setPlaying(true);
    try {
      if (typeof window !== 'undefined' && window.gtag) window.gtag('event', 'video_play', { video_name: video, chapter: chapter || 'full' });
    } catch (e) { /* analytics must never break the page */ }
  }

  return (
    <div style={{ maxWidth: compact ? 420 : 760, margin: compact ? 0 : '0 auto' }}>
      <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', background: '#1c2340', boxShadow: '0 10px 30px rgba(28,35,64,.18)' }}>
        {playing ? (
          <iframe
            src={src}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <button
            type="button"
            onClick={play}
            aria-label={`Play video: ${label}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, padding: 0, cursor: 'pointer', background: `#1c2340 url(https://i.ytimg.com/vi/${v.id}/hqdefault.jpg) center/cover` }}
          >
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(28,35,64,.75), rgba(28,35,64,.15))' }} />
            <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)', width: 68, height: 68, borderRadius: '50%', background: '#e0632b', display: 'grid', placeItems: 'center' }}>
              <span style={{ borderStyle: 'solid', borderWidth: '11px 0 11px 18px', borderColor: 'transparent transparent transparent #fff', marginLeft: 4 }} />
            </span>
            <span style={{ position: 'absolute', left: 16, right: 16, bottom: 12, color: '#fff', fontWeight: 700, fontSize: compact ? 15 : 17, textAlign: 'left' }}>{label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
