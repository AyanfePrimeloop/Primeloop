import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Logo from '../components/Logo';
import WhatsAppButton from '../components/WhatsAppButton';
import Faq from '../components/Faq';
import StickyCta from '../components/StickyCta';
import CheckIcon from '../components/CheckIcon';
import { supabase } from '../lib/supabaseClient';
import { PLATFORM_DOMAINS, isKnownPlatform, platformLabel, linkMismatchMessage, linkMatchesPlatform, normalizeLink } from '../lib/platformDomains';
import { pixelStartTrial } from '../lib/metaPixel';
import { gaTrial } from '../lib/ga';
import { useMinPrice } from '../lib/useMinPrice';

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'youtube', 'x'];

const FAQ_ITEMS = [
  {
    q: "What's the catch?",
    a: "There isn't one. It's a small sample so you can judge the quality yourself before spending anything. If you want more, {FROM}, and anything we don't deliver within 5 days is refunded. If you don't, you've lost nothing.",
  },
  {
    q: 'Are these real people or bots?',
    a: 'Real people. Every engagement is done by a verified engager on their own account, and backed by a screenshot that is checked for authenticity and duplicates. That is the whole point of Primeloop.',
  },
  {
    q: 'Could this get my account flagged?',
    a: "Not the way bot panels do. Bot panels use scripts and fake accounts, which platforms detect. Primeloop engagers are real people on real accounts doing what any follower would do — a like, a comment.",
  },
  {
    q: 'How many free trials can I get?',
    a: "One per person and one per post, so it stays fair. We also limit how many we give out each week, which is why you'll sometimes see \"all taken\" — spots free up as the week rolls forward.",
  },
  {
    q: 'What do you do with my email?',
    a: "We use it to create your tracking dashboard and to send you a one-click login link. There's no password to remember. Details are on our Privacy Policy page.",
  },
];

export default function TryFree() {
  const router = useRouter();
  const [platform, setPlatform] = useState('instagram');
  const [postLink, setPostLink] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null); // { available, remaining, reason }
  const [result, setResult] = useState(null);
  const [linkSent, setLinkSent] = useState(false);
  const [linkSending, setLinkSending] = useState(false);
  const [linkNote, setLinkNote] = useState('');

  useEffect(() => {
    fetch('/api/trial/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  // Ads can deep-link straight to the right platform, e.g. /try?platform=tiktok
  useEffect(() => {
    if (!router.isReady) return;
    const { platform: p, link, email: e } = router.query;
    if (isKnownPlatform(p)) setPlatform(p);
    if (typeof link === 'string') setPostLink(link);
    if (typeof e === 'string') setEmail(e);
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const minPrice = useMinPrice();
  const fromText = minPrice ? `orders start from ₦${minPrice} per engagement` : 'you can order any time';
  const label = platformLabel(platform);
  const linkError =
    postLink && !linkMatchesPlatform(postLink, platform)
      ? linkMismatchMessage(platform)
      : '';
  const canSubmit = !!email && !!postLink && !linkError && !submitting;
  const soldOut = status && status.available === false;

  async function claim(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/trial/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, platform, postLink: normalizeLink(postLink) || postLink }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === 'cap_reached') setStatus((s) => ({ ...(s || {}), available: false, remaining: 0 }));
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setResult(data);
      pixelStartTrial();
      gaTrial();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendTrackingLink() {
    setLinkSending(true);
    setLinkNote('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/client/dashboard` },
    });
    setLinkSending(false);
    if (err) {
      setLinkNote(
        /rate limit/i.test(err.message)
          ? "We've hit a temporary limit on login emails. Try again in a few minutes, or message us on WhatsApp and we'll send you your tracking link."
          : err.message
      );
      return;
    }
    setLinkSent(true);
  }

  const orderMoreHref = `/?platform=${platform}&link=${encodeURIComponent(postLink)}&email=${encodeURIComponent(email)}#order`;

  return (
    <>
      <Head>
        <title>Try Primeloop free — 5 real likes + 2 real comments on your post</title>
        <meta name="description" content="See real engagement on your own post before you pay anything. 5 likes and 2 comments from real, verified Nigerian engagers — with proof for every one. No card, no bots." />
        <meta property="og:title" content="Try Primeloop free — see real engagement before you pay" />
        <meta property="og:description" content="5 real likes + 2 real comments on your post, with proof. No card, no bots." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://primeloop.app/try" />
        <meta property="og:image" content="https://primeloop.app/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://primeloop.app/try" />
      </Head>
      <div className="app has-sticky-cta">
        <div className="fade-in" style={{ marginBottom: 18 }}>
          <a href="/" aria-label="Primeloop home"><Logo size={36} /></a>
        </div>

        <div className="hero2 fade-in-delay-1">
          <div>
            <h1>See it work before you pay a kobo.</h1>
            <p className="lead">
              Paste a link to one of your posts. Real people will like it 5 times and comment on
              it twice — and you'll see the proof for every single one. No card, no bots.
            </p>
            <ul className="trial-points">
              <li><CheckIcon size={13} color="var(--good)" />5 likes and 2 comments from real, verified people</li>
              <li><CheckIcon size={13} color="var(--good)" />A screenshot behind every engagement, checked automatically</li>
              <li><CheckIcon size={13} color="var(--good)" />Watch it arrive live on your own dashboard</li>
            </ul>
          </div>

          <div className="trial-card" id="trial-form" aria-live="polite">
            {result ? (
              <div>
                <h2 className="trial-title">Your free trial is live.</h2>
                <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 14px' }}>
                  {result.linkPending
                    ? `We're double-checking your ${label} link first — a person reviews it, then engagers can start. That can take a few hours.`
                    : `${result.items.map((i) => `${i.quantity} ${i.action}${i.quantity > 1 ? 's' : ''}`).join(' and ')} are now open to our verified engagers on your ${label} post. Most start within minutes.`}
                </p>
                {linkSent ? (
                  <p style={{ fontSize: 13, color: 'var(--good)', margin: '0 0 14px' }}>
                    Check <strong>{email}</strong> for your one-click login link (look in spam or
                    promotions if it isn't there in a minute).
                  </p>
                ) : (
                  <>
                    <button className="cta-bold" style={{ width: '100%', justifyContent: 'center' }} onClick={sendTrackingLink} disabled={linkSending}>
                      {linkSending ? 'Sending…' : 'Email me my tracking link →'}
                    </button>
                    {linkNote && <p style={{ color: 'var(--warn)', fontSize: 12.5, marginTop: 8 }}>{linkNote}</p>}
                  </>
                )}
                <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '14px 0 0' }}>
                  Want more on this post? <a href={orderMoreHref} style={{ color: 'var(--navy)', fontWeight: 600 }}>Order more</a> — anything undelivered after 5 days is refunded.
                </p>
              </div>
            ) : soldOut ? (
              <div>
                <h2 className="trial-title">
                  {status.reason === 'not_set_up' ? 'Free trials are opening soon.' : "This week's free trials are all taken."}
                </h2>
                <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 14px' }}>
                  {status.reason === 'not_set_up'
                    ? "We're getting ready to give out free trials."
                    : 'Spots free up as the week rolls forward, so check back tomorrow.'}{' '}
                  You don't have to wait to try us — {fromText}, with a 100% money-back guarantee on anything undelivered.
                </p>
                <a href="/#order" className="cta-bold" style={{ width: '100%', justifyContent: 'center' }}>Order now →</a>
              </div>
            ) : (
              <form onSubmit={claim} noValidate>
                <h2 className="trial-title">Claim your free trial</h2>
                <p className="trial-sub">
                  5 likes + 2 comments · no card needed
                  {status?.remaining > 0 && status.remaining <= 15 && (
                    <span style={{ color: 'var(--warn)', fontWeight: 600 }}> · only {status.remaining} left this week</span>
                  )}
                </p>

                <div role="group" aria-label="Platform" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '0 0 14px' }}>
                  {PLATFORMS.map((p) => (
                    <button
                      type="button"
                      key={p}
                      className="btn"
                      aria-pressed={p === platform}
                      style={p === platform ? { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' } : {}}
                      onClick={() => setPlatform(p)}
                    >
                      {platformLabel(p)}
                    </button>
                  ))}
                </div>

                <label htmlFor="trial-link" className="trial-label">Link to your {label} post</label>
                <input
                  id="trial-link"
                  style={{ width: '100%', ...(linkError ? { borderColor: 'var(--warn)' } : {}) }}
                  value={postLink}
                  onChange={(e) => setPostLink(e.target.value)}
                  placeholder={`https://${PLATFORM_DOMAINS[platform][0]}/…`}
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  aria-invalid={!!linkError}
                  aria-describedby={linkError ? 'trial-link-error' : undefined}
                />
                {linkError && <p id="trial-link-error" className="trial-error">{linkError}</p>}

                <label htmlFor="trial-email" className="trial-label" style={{ marginTop: 12 }}>Your email</label>
                <input
                  id="trial-email"
                  type="email"
                  style={{ width: '100%' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                />

                {error && <p role="alert" className="trial-error" style={{ marginTop: 12 }}>{error}</p>}

                <button
                  type="submit"
                  className="cta-bold"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 16, opacity: canSubmit ? 1 : 0.55, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                  disabled={!canSubmit}
                >
                  {submitting ? 'Starting your trial…' : 'Start my free trial →'}
                </button>
                <p className="trial-fine">One free trial per person. Your post must be public.</p>
              </form>
            )}
          </div>
        </div>

        <div className="section" id="how">
          <div className="section-head"><h2>How the free trial works</h2></div>
          <div style={{ padding: '4px 20px' }}>
            <div className="step-row">
              <div className="step-num">1</div>
              <div><strong>Paste your post link</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Any public post on Facebook, Instagram, TikTok, YouTube or X.</div></div>
            </div>
            <div className="step-row">
              <div className="step-num">2</div>
              <div><strong>Real people do it</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Verified engagers get an alert and do it from their own phones and accounts — never a script.</div></div>
            </div>
            <div className="step-row">
              <div className="step-num">3</div>
              <div><strong>See the proof</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Every like and comment comes with a screenshot. Track it live from your dashboard — we email you a one-click link, no password.</div></div>
            </div>
          </div>
        </div>

        <div className="section" id="faq">
          <div className="section-head"><h2>Questions before you start</h2></div>
          <div style={{ padding: '4px 20px 8px' }}>
            <Faq items={FAQ_ITEMS.map((i) => ({ ...i, a: i.a.replace('{FROM}', fromText) }))} />
          </div>
        </div>

        {!result && !soldOut && (
          <a
            href="#trial-form"
            className="section"
            style={{ display: 'block', padding: '18px 20px', marginTop: 20, textDecoration: 'none', background: 'var(--navy)', color: '#fff', textAlign: 'center' }}
          >
            <strong>Ready to see it for yourself?</strong>
            <div style={{ fontSize: 12.5, color: 'var(--label-on-navy)', marginTop: 4 }}>Claim your free trial →</div>
          </a>
        )}

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 24 }}>
          <a href="/terms" style={{ color: 'var(--ink-soft)' }}>Terms</a> ·{' '}
          <a href="/privacy" style={{ color: 'var(--ink-soft)' }}>Privacy</a> ·{' '}
          <a href="/refund-policy" style={{ color: 'var(--ink-soft)' }}>Refund Policy</a>
        </p>

        <WhatsAppButton avoidSelectors={['#trial-form', '#faq']} />
        {!result && !soldOut && (
          <StickyCta label="5 likes + 2 comments" sublabel="Free trial" href="#trial-form" cta="Claim it →" hideNearId="trial-form" />
        )}
      </div>
    </>
  );
}
