import AppBar from '../../components/AppBar';
import ScreenshotMock from '../../components/ScreenshotMock';
import QualityRules from '../../components/QualityRules';
import { useRequireRole } from '../../lib/authClient';
import { PLATFORM_GUIDE } from '../../lib/screenshotGuide';
import { platformLabel } from '../../lib/platformDomains';

export default function ScreenshotGuide() {
  const { loading } = useRequireRole('engager');
  if (loading) return <div className="app"><p style={{ padding: 20 }}>Loading...</p></div>;

  return (
    <>
      <AppBar links={[
        { href: '/engager/dashboard', label: 'Tasks' },
        { href: '/engager/referrals', label: 'Refer & earn' },
        { href: '/engager/screenshot-guide', label: 'Screenshot guide', current: true },
        { href: '/engager/bank-details', label: 'Bank details' },
        { href: '/engager/profile', label: 'Profile' },
        { href: '/choose-dashboard', label: 'Switch dashboard' },
      ]} />
      <div className="app">
        <div className="page-head">
          <h1>Screenshot guide</h1>
          <p>Exactly what to capture for every action, on every platform, so your first screenshot gets approved.</p>
        </div>

        <div className="section" style={{ padding: 20, background: 'var(--good-soft)' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>The one rule that matters most:</p>
          <p style={{ margin: '6px 0 0', fontSize: 14.5 }}>
            Don&apos;t just screenshot the post. Screenshot the PROOF that you did something to it —
            the icon after you tap it, the button after it changes, or the post after it moves
            somewhere new (your own profile, your own Saved collection). A screenshot of the post by
            itself, with nothing activated, is the single biggest reason a submission gets sent to
            review instead of approved right away.
          </p>
        </div>

        {Object.entries(PLATFORM_GUIDE).map(([platform, items]) => (
          <div className="section" key={platform} id={platform}>
            <div className="section-head"><h2>{platformLabel(platform)}</h2></div>
            <div style={{ padding: 20, display: 'grid', gap: 22 }}>
              {items.map((item) => (
                <div key={item.action} id={`${platform}-${item.action}`} style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start', scrollMarginTop: 90 }}>
                  <div style={{ flex: '1 1 260px', minWidth: 0, maxWidth: 320 }}><ScreenshotMock type={item.mock} /></div>
                  <div style={{ flex: '1 1 220px', minWidth: 220 }}>
                    <div style={{ fontWeight: 700, textTransform: 'capitalize', marginBottom: 4 }}>{item.action}</div>
                    <div style={{ fontSize: 14.5, color: 'var(--ink-soft)' }}>{item.how}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <QualityRules />

        <div className="section" style={{ padding: 20 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-mute)' }}>
            Still not approved after following this? It may just need a human to look at it — that
            happens automatically, and you&apos;ll see the result on your dashboard. You never lose
            a submission for an honest mistake; you just wait a little longer for it.
          </p>
        </div>
      </div>
    </>
  );
}
