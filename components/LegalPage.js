import Head from 'next/head';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function LegalPage({ title, updated, children }) {
  return (
    <>
      <Head><title>{title} — Primeloop</title></Head>
      <div className="site">
        <SiteHeader />
        <main className="prose-wrap">
          <h1 className="s-h1" style={{ fontSize: 'clamp(32px,4.4vw,44px)' }}>{title}</h1>
          {updated && <p className="prose-meta">Last updated: {updated}</p>}
          <div className="prose">{children}</div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
