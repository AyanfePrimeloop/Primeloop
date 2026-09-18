import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AuthShell from '../components/AuthShell';
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
    <AuthShell title="Thank you" subtitle={status} pageTitle="Thank you — Primeloop" photo="trial-creator" photoPosition="50% 35%">
      <div className="auth-form">
        <a href="/client-login" className="btn accent auth-btn">Track this order</a>
        <p className="auth-alt"><a href="/">Back to home</a></p>
      </div>
    </AuthShell>
  );
}
