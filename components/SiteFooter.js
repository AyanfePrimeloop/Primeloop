import Logo from './Logo';

export default function SiteFooter() {
  return (
    <footer className="s-footer">
      <div className="s-wrap">
        <div className="s-footer-grid">
          <div>
            <a href="/" className="s-brand" aria-label="Primeloop home"><Logo size={30} />Primeloop</a>
            <p>Real engagement from verified people in Nigeria, with a screenshot behind every one.</p>
          </div>
          <div>
            <h4>For businesses</h4>
            <ul>
              <li><a href="/try">Free trial</a></li>
              <li><a href="/#order">Order engagement</a></li>
              <li><a href="/client-login">Track an order</a></li>
            </ul>
          </div>
          <div>
            <h4>For engagers</h4>
            <ul>
              <li><a href="/join">Earn with Primeloop</a></li>
              <li><a href="/signup">Create an account</a></li>
              <li><a href="/login">Log in</a></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/refund-policy">Refund policy</a></li>
            </ul>
          </div>
        </div>
        <div className="s-legal">
          <span>© {new Date().getFullYear()} Primeloop</span>
        </div>
      </div>
    </footer>
  );
}
