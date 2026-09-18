import Logo from './Logo';

// Top bar for signed-in areas. `links` are { href, label, onClick?, current? }.
export default function AppBar({ links = [] }) {
  return (
    <header className="app-bar">
      <div className="app-bar-in">
        <a href="/" className="app-brand" aria-label="Primeloop home"><Logo size={28} />Primeloop</a>
        <nav className="app-bar-links" aria-label="Account">
          {links.map((l) =>
            l.onClick ? (
              <button key={l.label} type="button" onClick={l.onClick}>{l.label}</button>
            ) : (
              <a key={l.label} href={l.href} aria-current={l.current ? 'page' : undefined}>{l.label}</a>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
