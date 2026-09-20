import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import SiteFaq from '../components/SiteFaq';
import VideoCard from '../components/VideoCard';
import SiteSticky from '../components/SiteSticky';
import SiteWhatsApp from '../components/SiteWhatsApp';
import Photo from '../components/Photo';
import { Check, Arrow } from '../components/SiteIcons';
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

const STEPS = [
  { t: 'Paste your post link', d: 'Any public post on Facebook, Instagram, TikTok, YouTube or X.' },
  { t: 'Real people do it', d: 'Verified engagers get an alert and do it from their own phones and accounts — never a script.' },
  { t: 'See the proof', d: 'Every like and comment comes with a screenshot. Track it live from your dashboard — we email you a one-click link, no password.' },
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
      email: email.trim().toLowerCase(),
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
      <div className="site has-sticky">
        <SiteHeader
          cta={{ href: '#trial-form', label: 'Claim free trial' }}
          links={[
            { href: '#how', label: 'How the trial works' },
            { href: '#faq', label: 'Questions' },
            { href: '/#order', label: 'Pricing' },
          ]}
        />

        <main>
          <section className="s-hero">
            <div className="s-wrap s-hero-grid">
              <div className="s-hero-copy">
                <h1 className="s-h1">See it work before you pay a kobo.</h1>
                <p className="s-lead">
                  Paste a link to one of your posts. Real people will like it 5 times and comment on
                  it twice — and you&apos;ll see the proof for every single one. No card, no bots.
                </p>
                <ul className="s-assure" style={{ flexDirection: 'column', gap: 12, marginTop: 28 }}>
                  <li><Check size={18} color="var(--good)" />5 likes and 2 comments from real, verified people</li>
                  <li><Check size={18} color="var(--good)" />A screenshot behind every engagement, checked automatically</li>
                  <li><Check size={18} color="var(--good)" />Watch it arrive live on your own dashboard</li>
                </ul>
              </div>

              <div className="s-card s-card-lift s-enter" id="trial-form" aria-live="polite">
                {result ? (
                  <div>
                    <h2 className="s-card-title">Your free trial is live.</h2>
                    <p className="s-card-sub">
                      {result.linkPending
                        ? `We're double-checking your ${label} link first — a person reviews it, then engagers can start. That can take a few hours.`
                        : `${result.items.map((i) => `${i.quantity} ${i.action}${i.quantity > 1 ? 's' : ''}`).join(' and ')} are now open to our verified engagers on your ${label} post. Most start within minutes.`}
                    </p>
                    {linkSent ? (
                      <p style={{ fontSize: 15, color: 'var(--good)' }}>
                        Check <strong>{email}</strong> for your one-click login link (look in spam or
                        promotions if it isn&apos;t there in a minute).
                      </p>
                    ) : (
                      <>
                        <button className="s-btn s-btn-primary" style={{ width: '100%' }} onClick={sendTrackingLink} disabled={linkSending}>
                          {linkSending ? 'Sending…' : 'Email me my tracking link'}
                        </button>
                        {linkNote && <p className="s-error">{linkNote}</p>}
                      </>
                    )}
                    <p className="s-alt">
                      Want more on this post? <a href={orderMoreHref} className="s-link">Order more</a> — anything undelivered after 5 days is refunded.
                    </p>
                  </div>
                ) : soldOut ? (
                  <div>
                    <h2 className="s-card-title">
                      {status.reason === 'not_set_up' ? 'Free trials are opening soon.' : "This week's free trials are all taken."}
                    </h2>
                    <p className="s-card-sub">
                      {status.reason === 'not_set_up'
                        ? "We're getting ready to give out free trials."
                        : 'Spots free up as the week rolls forward, so check back tomorrow.'}{' '}
                      You don&apos;t have to wait to try us — {fromText}, with a 100% money-back guarantee on anything undelivered.
                    </p>
                    <a href="/#order" className="s-btn s-btn-primary" style={{ width: '100%' }}>Order now <Arrow /></a>
                  </div>
                ) : (
                  <form onSubmit={claim} noValidate>
                    <h2 className="s-card-title">Claim your free trial</h2>
                    <p className="s-card-sub">
                      5 likes + 2 comments · no card needed
                      {status?.remaining > 0 && status.remaining <= 15 && (
                        <span style={{ color: 'var(--warn)', fontWeight: 600 }}> · only {status.remaining} left this week</span>
                      )}
                    </p>

                    <div className="s-field">
                      <span className="s-label" id="trial-platform-label">Platform</span>
                      <div className="s-chips" role="group" aria-labelledby="trial-platform-label">
                        {PLATFORMS.map((p) => (
                          <button type="button" key={p} className="s-chip" aria-pressed={p === platform} onClick={() => setPlatform(p)}>
                            {platformLabel(p)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="s-field">
                      <label htmlFor="trial-link" className="s-label">Link to your {label} post</label>
                      <input
                        id="trial-link"
                        className={`s-input${linkError ? ' is-bad' : ''}`}
                        value={postLink}
                        onChange={(e) => setPostLink(e.target.value)}
                        placeholder={`https://${PLATFORM_DOMAINS[platform][0]}/…`}
                        inputMode="url"
                        autoCapitalize="none"
                        autoCorrect="off"
                        aria-invalid={!!linkError}
                        aria-describedby={linkError ? 'trial-link-error' : undefined}
                      />
                      {linkError && <p id="trial-link-error" className="s-error">{linkError}</p>}
                    </div>

                    <div className="s-field">
                      <label htmlFor="trial-email" className="s-label">Your email</label>
                      <input
                        id="trial-email"
                        type="email"
                        className="s-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        autoComplete="email"
                        autoCapitalize="none"
                        inputMode="email"
                      />
                    </div>

                    {error && <p role="alert" className="s-error">{error}</p>}

                    <button type="submit" className="s-btn s-btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={!canSubmit}>
                      {submitting ? 'Starting your trial…' : 'Start my free trial'}{!submitting && <Arrow />}
                    </button>
                    <p className="s-note" style={{ textAlign: 'center' }}>One free trial per person. Your post must be public.</p>
                  </form>
                )}
              </div>
            </div>
          </section>

          <section className="s-section" id="watch">
            <div className="s-wrap">
              <div className="s-section-head">
                <h2 className="s-h2">Watch how it works</h2>
                <p>Three minutes: ordering, paying and tracking real engagement.</p>
              </div>
              <VideoCard video="client" />
            </div>
          </section>

          <section className="s-section s-section-tint" id="how">
            <div className="s-wrap s-split photo-left">
              <div className="s-photo s-photo-wide">
                <Photo
                  name="trial-creator"
                  width={1200}
                  height={800}
                  position="50% 40%"
                  alt="A smiling woman in a red floral top standing outside a venue in Nigeria"
                  sizes="(max-width: 860px) 100vw, 540px"
                />
              </div>
              <div>
                <h2 className="s-h2">How the free trial works</h2>
                <ol className="s-steps" style={{ margin: '32px 0 0', padding: 0, listStyle: 'none', gridTemplateColumns: '1fr', gap: 24 }}>
                  {STEPS.map((st, i) => (
                    <li className="s-step" key={st.t}>
                      <div className="s-step-n s-num">{i + 1}</div>
                      <h3 className="s-h3">{st.t}</h3>
                      <p>{st.d}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="s-section" id="faq">
            <div className="s-wrap s-faq-wrap">
              <div className="s-faq-side">
                <h2 className="s-h2">Questions before you start</h2>
                <p>Anything else? Message an admin on WhatsApp and a person will reply.</p>
              </div>
              <SiteFaq items={FAQ_ITEMS.map((i) => ({ ...i, a: i.a.replace('{FROM}', fromText) }))} />
            </div>
          </section>

          {!result && !soldOut && (
            <section className="s-band">
              <div className="s-wrap s-final">
                <div>
                  <h2 className="s-h2">Ready to see it for yourself?</h2>
                  <p>Five likes and two comments, with proof, on a post of your choice.</p>
                </div>
                <a href="#trial-form" className="s-btn s-btn-primary">Claim your free trial <Arrow /></a>
              </div>
            </section>
          )}
        </main>

        <SiteFooter />

        <SiteWhatsApp avoidSelectors={['#trial-form']} />
        {!result && !soldOut && (
          <SiteSticky label="5 likes + 2 comments" sublabel="Free trial" href="#trial-form" cta="Claim it" hideNearId="trial-form" />
        )}
      </div>
    </>
  );
}
