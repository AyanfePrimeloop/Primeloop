import Head from 'next/head';
import Logo from './Logo';
import Photo from './Photo';

// Split layout for login, signup and the small account screens: the form on
// the left, a real photograph on the right (hidden on phones).
export default function AuthShell({ title, subtitle, children, pageTitle, photo = 'engager-phone', photoPosition = '50% 40%' }) {
  return (
    <>
      <Head><title>{pageTitle || `${title} — Primeloop`}</title></Head>
      <div className="auth">
        <div className="auth-main">
          <a href="/" className="auth-brand" aria-label="Primeloop home"><Logo size={30} />Primeloop</a>
          <div className="auth-body">
            <div className="auth-card">
              <h1>{title}</h1>
              {subtitle && <p className="auth-sub">{subtitle}</p>}
              {children}
            </div>
          </div>
          <div className="auth-foot">
            <span>© {new Date().getFullYear()} Primeloop</span>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/refund-policy">Refunds</a>
          </div>
        </div>
        <div className="auth-photo" aria-hidden="true">
          <Photo
            name={photo}
            alt=""
            width={1200}
            height={photo === 'trial-creator' ? 800 : 1500}
            priority
            position={photoPosition}
            sizes="50vw"
          />
        </div>
      </div>
    </>
  );
}
