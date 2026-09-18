import { useEffect, useState } from 'react';

// A simple stroke chat-bubble, matching CheckIcon's line weight, instead of
// the 💬 emoji — keeps the icon system consistent across the site.
function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        d="M2 3.5C2 2.67 2.67 2 3.5 2h9c.83 0 1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5H6l-2.8 2.1c-.32.24-.78 0-.78-.4V11h-.92C.67 11 0 10.33 0 9.5"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Some pages pass `avoidSelectors` (e.g. the order form, the FAQ) so this
// fixed button fades out while one of those sections is scrolled into the
// same bottom-right band it occupies, instead of sitting on top of it.
export default function WhatsAppButton({ number = '2348085176399', avoidSelectors = [] }) {
  const [hidden, setHidden] = useState(false);
  // Pages pass a fresh array literal every render; depend on its contents
  // instead, so typing in a form doesn't tear down and re-add the scroll
  // listeners on every keystroke.
  const avoidKey = avoidSelectors.join('|');

  useEffect(() => {
    if (!avoidSelectors.length) return;
    let ticking = false;
    function update() {
      const fab = document.querySelector('.whatsapp-fab');
      if (!fab) return;
      const fabRect = fab.getBoundingClientRect();
      const overlaps = avoidSelectors.some((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top < fabRect.bottom && r.bottom > fabRect.top && r.left < fabRect.right && r.right > fabRect.left;
      });
      setHidden(overlaps);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
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
      className="whatsapp-fab"
      aria-hidden={hidden}
      style={{
        position: 'fixed', bottom: 22, right: 22, background: '#25D366', color: '#fff',
        padding: '12px 18px', borderRadius: 99, textDecoration: 'none', fontSize: 13.5,
        fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 14px rgba(0,0,0,.2)', zIndex: 50,
        opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto', transition: 'opacity .15s ease',
      }}
    >
      <ChatIcon /> Chat with an admin
    </a>
  );
}
