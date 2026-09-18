import LegalPage from '../components/LegalPage';

export default function RefundPolicy() {
  return (
    <LegalPage title="Refund Policy" updated="13 September 2026">
        <h3>Our guarantee</h3>
        <p>
          If we do not deliver the full quantity of engagement you paid for, you're entitled to a
          refund for the undelivered portion, under the terms below.
        </p>

        <h3>When a refund applies</h3>
        <ul>
          <li>Your task remained open with unfilled quantity for more than 5 days after payment</li>
          <li>Your post link was rejected by our automated check or an admin, and you don't want
            to provide a replacement link</li>
          <li>A payment was taken but no task was ever created due to a technical error on our side</li>
        </ul>

        <h3>When a refund does NOT apply</h3>
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

        <h3>How to request a refund</h3>
        <p>
          Contact us at <a href="mailto:info@primeloop.app">info@primeloop.app</a> or
          via the WhatsApp button on our site with your order reference. We aim to respond within
          2 business days and process approved refunds back to your original payment method via
          Paystack within 4 business days of approval.
        </p>
    </LegalPage>
  );
}
