import { useEffect, useState } from 'react';

// Mobile-only bar that appears after the hero CTA scrolls away and hides
// again while the real form is on screen.
export default function SiteSticky({ label, sublabel, href, cta, hideNearId }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    function update() {
      const heroCta = document.querySelector('.s-hero .s-cta-row');
      const near = hideNearId ? document.getElementById(hideNearId) : null;
      const pastHero = heroCta ? heroCta.getBoundingClientRect().bottom < 0 : window.scrollY > 500;
      const r = near?.getBoundingClientRect();
      const nearInView = r ? r.top < window.innerHeight && r.bottom > 0 : false;
      setVisible(pastHero && !nearInView);
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
  }, [hideNearId]);

  return (
    <div className={`s-sticky${visible ? ' visible' : ''}`} aria-hidden={!visible}>
      <div>
        <div className="l1">{sublabel}</div>
        <div className="l2 s-num">{label}</div>
      </div>
      <a className="s-btn s-btn-primary s-btn-sm" href={href} tabIndex={visible ? 0 : -1}>{cta}</a>
    </div>
  );
}
