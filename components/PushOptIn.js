import { useEffect, useState } from 'react';
import { authedFetch } from '../lib/authClient';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyToBytes(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Card on the engager dashboard: turn free task alerts on or off for this
// device. States: checking, unsupported, needs-install (iPhone), blocked,
// off, on.
export default function PushOptIn() {
  const [state, setState] = useState('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!PUBLIC_KEY) return setState('hidden');
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!supported) {
        const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        return setState(iOS ? 'needs-install' : 'unsupported');
      }
      if (Notification.permission === 'denied') return setState('blocked');
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
      } catch {
        setState('off');
      }
    })();
  }, []);

  async function turnOn() {
    setBusy(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(PUBLIC_KEY) }));
      const res = await authedFetch('/api/engager/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not switch alerts on. Please try again.');
        return;
      }
      setState('on');
    } catch {
      setError('Could not switch alerts on in this browser. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError('');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await authedFetch('/api/engager/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('off');
    } catch {
      setError('Could not switch alerts off. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'checking' || state === 'hidden') return null;

  const copy = {
    off: ['Get a tap on the shoulder when a task opens', 'Free. Works even when the site is closed. You can turn it off any time.'],
    on: ['Task alerts are on for this device', "You'll get a notification when a new task opens for you."],
    blocked: ['Task alerts are blocked in your browser', 'Allow notifications for primeloop.app in your browser settings, then come back here.'],
    unsupported: ['This browser can’t show task alerts', 'Try Chrome on Android, or check the dashboard often for new tasks.'],
    'needs-install': ['On iPhone, add Primeloop to your Home Screen first', 'Tap Share, then “Add to Home Screen”, and open Primeloop from there to turn alerts on.'],
  }[state];

  return (
    <div className="section" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 260px' }}>
        <div style={{ fontWeight: 700 }}>{copy[0]}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 2 }}>{copy[1]}</div>
        {error && <div role="alert" style={{ fontSize: 14, color: 'var(--warn)', marginTop: 6 }}>{error}</div>}
      </div>
      {state === 'off' && <button className="btn accent" onClick={turnOn} disabled={busy}>{busy ? 'Turning on...' : 'Turn on task alerts'}</button>}
      {state === 'on' && <button className="btn" onClick={turnOff} disabled={busy}>{busy ? 'Turning off...' : 'Turn off'}</button>}
    </div>
  );
}
