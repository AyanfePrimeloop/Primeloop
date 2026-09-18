import { useEffect, useState } from 'react';

// Shows a slim CTA bar pinned to the bottom once the visitor scrolls past
// the hero's own CTA, and hides it again once the real form/signup section
// (identified by hideNearId) is actually in view — no point stacking a
// second CTA on top of the one they're already looking at.
export default function StickyCta({ label, sublabel, href, hideNearId, cta = 'Get started →' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    function update() {
      const heroCta = document.querySelector('.hero2-ctas');
      const hideNear = hideNearId ? document.getElementById(hideNearId) : null;
      const pastHero = heroCta ? heroCta.getBoundingClientRect().bottom < 0 : window.scrollY > 400;
      // "in view", not just "scrolled past its top" — otherwise this stays
      // true forever once you pass a tall section, and the bar never comes
      // back even after you've scrolled well past it toward the FAQ/footer.
      const targetRect = hideNear?.getBoundingClientRect();
      const nearTarget = targetRect ? targetRect.top < window.innerHeight && targetRect.bottom > 0 : false;
      setVisible(pastHero && !nearTarget);
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
  }, [hideNearId]);

  return (
    <div className={`sticky-cta${visible ? ' visible' : ''}`}>
      <div className="price">
        {sublabel}
        <b>{label}</b>
      </div>
      <a className="btn-cta" href={href}>{cta}</a>
    </div>
  );
}
