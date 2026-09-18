import { useEffect, useState } from 'react';
import { Chat } from './SiteIcons';

// Fades out while any avoidSelectors section sits under it.
export default function SiteWhatsApp({ number = '2348085176399', avoidSelectors = [] }) {
  const [hidden, setHidden] = useState(false);
  const avoidKey = avoidSelectors.join('|');

  useEffect(() => {
    if (!avoidSelectors.length) return;
    let ticking = false;
    function update() {
      const fab = document.querySelector('.s-wa');
      if (!fab) return;
      const f = fab.getBoundingClientRect();
      setHidden(avoidSelectors.some((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top < f.bottom && r.bottom > f.top && r.left < f.right && r.right > f.left;
      }));
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [avoidKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noreferrer"
      className="s-wa"
      aria-label="Chat with an admin on WhatsApp"
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      style={{ opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' }}
    >
      <Chat size={20} /><span className="label">Chat with an admin</span>
    </a>
  );
}
