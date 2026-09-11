import Logo from '../components/Logo';

export default function RefundPolicy() {
  return (
    <div className="app" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Logo size={28} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Refund Policy</h1>
      </div>
      <div className="section" style={{ padding: '24px 28px', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
        <p style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Last updated: [DATE]</p>

        <h3 style={{ color: 'var(--ink)' }}>Our guarantee</h3>
        <p>
          If we do not deliver the full quantity of engagement you paid for, you're entitled to a
          refund for the undelivered portion, under the terms below.
        </p>

        <h3 style={{ color: 'var(--ink)' }}>When a refund applies</h3>
        <ul>
          <li>Your task remained open with unfilled quantity for more than [X days] after payment</li>
          <li>Your post link was rejected by our automated check or an admin, and you don't want
            to provide a replacement link</li>
          <li>A payment was taken but no task was ever created due to a technical error on our side</li>
        </ul>

        <h3 style={{ color: 'var(--ink)' }}>When a refund does NOT apply</h3>
        <ul>
          <li>Engagement that was already delivered and verified — you're only refunded for the
            undelivered portion of an order, never the completed part</li>
          <li>Your post, page, or account was taken down, restricted, or banned by the social
            platform itself (Facebook, Instagram, TikTok, YouTube, X) for reasons unrelated to
            our engagement — we aren't responsible for the platform's own moderation decisions</li>
          <li>You provided an incorrect, private, or inaccessible post link and didn't correct it
            when asked</li>
          <li>Follow/subscribe orders where our system indicated limited availability before you
            confirmed the order — partial delivery within the stated limit isn't refundable</li>
        </ul>

        <h3 style={{ color: 'var(--ink)' }}>How to request a refund</h3>
        <p>
          Contact us via the WhatsApp button on our site with your order reference. We aim to
          respond within [X business days] and process approved refunds back to your original
          payment method via Paystack within [X business days] of approval.
        </p>

        <div style={{ marginTop: 24, padding: 14, background: 'var(--warn-soft)', borderRadius: 8, fontSize: 12.5, color: 'var(--warn)' }}>
          This is a starting template, not legal advice — and the bracketed placeholders
          ([X days], [DATE]) need real numbers filled in that match what you can actually commit
          to operationally. Have a Nigerian-licensed lawyer review the final version, since this
          document directly affects consumer rights and chargeback disputes.
        </div>
      </div>
    </div>
  );
}
