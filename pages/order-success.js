import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { pixelPurchase } from '../lib/metaPixel';
import { gaPurchase } from '../lib/ga';

export default function OrderSuccess() {
  const router = useRouter();
  const { reference, trxref } = router.query;
  const [status, setStatus] = useState('Checking your payment...');

  useEffect(() => {
    const ref = reference || trxref;
    if (!ref) return;

    // The actual task-creation happens via the Paystack webhook
    // (pages/api/paystack/webhook.js), asynchronously — this page doesn't
    // create anything, so it shouldn't declare success on its own say-so
    // either. A reference showing up in the URL only means Paystack
    // redirected the browser here; it doesn't mean the webhook has landed
    // yet (or ever will, if it fails). Ask the backend what actually
    // happened instead of assuming.
    fetch(`/api/orders/lookup-amount?reference=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'paid') {
          setStatus('Payment received. Your task has been created and engagers can start now.');

          // Fire the Purchase pixel exactly once per order, even across a
          // refresh — sessionStorage survives that but not a new tab, which
          // is the right scope for "don't double count".
          const firedKey = `pixel-purchase-fired:${ref}`;
          if (typeof window !== 'undefined' && !sessionStorage.getItem(firedKey)) {
            if (data.amount) {
              pixelPurchase(data.amount);
              gaPurchase(data.amount, ref);
              sessionStorage.setItem(firedKey, '1');
            }
          }
        } else if (data.status) {
          setStatus("Payment is still being confirmed — this can take a minute. Refresh this page, or check your order in a few minutes from the tracking link below.");
        } else {
          setStatus("We couldn't find this order. If you were just charged, contact us on WhatsApp and we'll sort it out.");
        }
      })
      .catch(() => {
        setStatus("We couldn't confirm your payment status right now. If you were just charged, check your order from the tracking link below in a few minutes.");
      });
  }, [reference, trxref]);

  return (
    <div className="app" style={{ maxWidth: 480, textAlign: 'center', paddingTop: 60 }}>
      <div className="section" style={{ padding: 30 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Thank you</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{status}</p>
        <a href="/client-login" className="btn primary" style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none' }}>
          Track this order
        </a>
        <p style={{ marginTop: 10 }}>
          <a href="/" style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>Back to home</a>
        </p>
      </div>
    </div>
  );
}
