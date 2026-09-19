import Logo from './Logo';
import { Arrow } from './SiteIcons';

export default function SiteHeader({ cta = { href: '/try', label: 'Try it free' }, links }) {
  const nav = links || [
    { href: '/#how', label: 'How it works' },
    { href: '/#order', label: 'Pricing' },
    { href: '/join', label: 'Earn with Primeloop' },
  ];
  return (
    <header className="s-header">
      <div className="s-header-in">
        <a href="/" className="s-brand" aria-label="Primeloop home"><Logo size={30} />Primeloop</a>
        <nav className="s-nav" aria-label="Main">
          {nav.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <div className="s-header-actions">
          <a href="/login" className="s-login">Log in</a>
          <a href={cta.href} className="s-btn s-btn-primary s-btn-sm">{cta.label}<Arrow size={14} /></a>
        </div>
      </div>
    </header>
  );
}
