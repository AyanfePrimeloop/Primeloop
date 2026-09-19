import Head from 'next/head';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { Arrow } from '../components/SiteIcons';

export default function NotFound() {
  return (
    <>
      <Head><title>Page not found — Primeloop</title></Head>
      <div className="site">
        <SiteHeader />
        <main className="s-wrap" style={{ padding: '96px 24px 120px', maxWidth: 640 }}>
          <h1 className="s-h1" style={{ fontSize: 'clamp(34px,5vw,52px)' }}>We can&apos;t find that page.</h1>
          <p className="s-lead" style={{ marginTop: 16 }}>
            The link may be old or mistyped. These will get you where you were going:
          </p>
          <div className="s-cta-row">
            <a href="/try" className="s-btn s-btn-primary">Try it free <Arrow /></a>
            <a href="/" className="s-link">Back to home</a>
            <a href="/join" className="s-link">Earn as an engager</a>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
