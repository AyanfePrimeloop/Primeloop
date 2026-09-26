import { useEffect, useRef, useState } from 'react';
import { linkPlacement } from '../lib/referral';

const FONT = '"Bricolage Grotesque", "Hanken Grotesk", system-ui, sans-serif';

// One viral graphic with THIS engager's own link drawn onto it, in their
// browser, at full size. Nothing is uploaded or stored: the template is a
// plain image and the link is text drawn over the blank area the template
// leaves for it. `linkText` is what appears on the image (the short link).
export default function ReferralGraphic({ graphic, linkText, code }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = async () => {
      try {
        // Draw only once the display font is ready, or the link falls back to a plain font.
        if (document.fonts && document.fonts.load) await document.fonts.load(`800 40px ${FONT}`);
      } catch (e) { /* the fallback font is fine */ }
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = graphic.w;
      canvas.height = graphic.h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, graphic.w, graphic.h);

      const p = linkPlacement(graphic);
      let size = p.size;
      ctx.font = `800 ${size}px ${FONT}`;
      // Shrink until the link fits the space it has (a long code on a post shares the footer with the button).
      while (ctx.measureText(linkText).width > p.maxWidth && size > 22) {
        size -= 2;
        ctx.font = `800 ${size}px ${FONT}`;
      }
      ctx.fillStyle = p.color;
      ctx.textAlign = p.align;
      ctx.textBaseline = 'middle';
      ctx.fillText(linkText, p.x, p.y + 2);
    };
    img.onerror = () => { if (!cancelled) setFailed(true); };
    img.src = graphic.file;
    return () => { cancelled = true; };
  }, [graphic, linkText]);

  function toBlob() {
    return new Promise((resolve) => canvasRef.current.toBlob(resolve, 'image/png'));
  }

  async function download() {
    setBusy(true);
    try {
      const blob = await toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `primeloop-${graphic.id}-${code}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setBusy(false);
    }
  }

  // On phones this opens the share sheet with the image itself, so it can go
  // straight to WhatsApp Status, Instagram or Facebook.
  async function share() {
    setBusy(true);
    try {
      const blob = await toBlob();
      const file = new File([blob], `primeloop-${graphic.id}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        await download();
      }
    } catch (e) { /* the person closed the share sheet */ } finally {
      setBusy(false);
    }
  }

  // Decided in the browser only, after the first render, so the server's HTML and the
  // browser's first render always match (a button that exists only on one side is a hydration error).
  const [canShareFiles, setCanShareFiles] = useState(false);
  useEffect(() => { setCanShareFiles(typeof navigator !== 'undefined' && !!navigator.canShare); }, []);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {failed ? (
        <div style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink-mute)', fontSize: 14 }}>This graphic could not load. Reload the page.</div>
      ) : (
        <canvas ref={canvasRef} role="img" aria-label={`${graphic.label}, with your referral link`} style={{ width: '100%', height: 'auto', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--navy)' }} />
      )}
      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{graphic.label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn primary" style={{ fontSize: 13 }} onClick={download} disabled={busy || failed}>Download</button>
        {canShareFiles && <button type="button" className="btn" style={{ fontSize: 13 }} onClick={share} disabled={busy || failed}>Share image</button>}
      </div>
    </div>
  );
}
