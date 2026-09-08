import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function OrderSuccess() {
  const router = useRouter();
  const { reference, trxref } = router.query;
  const [status, setStatus] = useState('Checking your payment...');

  useEffect(() => {
    const ref = reference || trxref;
    if (!ref) return;
    // The actual task-creation already happened via the Paystack webhook
    // (pages/api/paystack/webhook.js) — this page is just a friendly
    // confirmation screen for the person who paid.
    setStatus('Payment received. Your task has been created and engagers can start now.');
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
