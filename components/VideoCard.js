import { useState } from 'react';
import { VIDEOS, hasVideo } from '../lib/videos';

// Click-to-play video. Nothing loads until the visitor presses play (keeps
// pages fast, and a YouTube video sets nothing until then). Pass `chapter` to
// play only that part. A video is either on YouTube (has an `id`) or hosted on
// this site (has a `file`), see lib/videos.js.
export default function VideoCard({ video, chapter, title, compact = false }) {
  const [playing, setPlaying] = useState(false);
  if (!hasVideo(video)) return null; // no link yet: show nothing rather than a broken player
  const v = VIDEOS[video];
  const ch = chapter && v.chapters[chapter];
  const label = title || (ch ? ch.title : v.title);

  const youtubeSrc = v.id
    ? `https://www.youtube-nocookie.com/embed/${v.id}?${new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', ...(ch ? { start: Math.floor(ch.start), end: Math.ceil(ch.end) } : {}) })}`
    : null;
  // #t=start,end is the browser's own way of playing just a part of a file.
  const fileSrc = v.file ? `${v.file}${ch ? `#t=${ch.start},${ch.end}` : ''}` : null;
  const poster = v.file ? v.poster : `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

  function play() {
    setPlaying(true);
    try {
      if (typeof window !== 'undefined' && window.gtag) window.gtag('event', 'video_play', { video_name: video, chapter: chapter || 'full' });
    } catch (e) { /* analytics must never break the page */ }
  }

  return (
    <div style={{ maxWidth: compact ? 420 : 760, margin: compact ? 0 : '0 auto' }}>
      <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', background: '#1c2340', boxShadow: '0 10px 30px rgba(28,35,64,.18)' }}>
        {playing && fileSrc ? (
          <video
            src={fileSrc}
            title={label}
            controls
            autoPlay
            playsInline
            preload="auto"
            poster={poster}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#1c2340' }}
          />
        ) : playing ? (
          <iframe
            src={youtubeSrc}
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
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, padding: 0, cursor: 'pointer', background: `#1c2340 url(${poster}) center/cover` }}
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
