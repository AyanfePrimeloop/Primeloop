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
import ProofCard from '../components/ProofCard';
import { Check, Cross, Arrow } from '../components/SiteIcons';
import { useMinPrice } from '../lib/useMinPrice';
import { PACKS, buildPack, packLineLabel } from '../lib/packs';
import { MIN_ORDER } from '../lib/payoutRules';
import { linkMatchesPlatform, isKnownPlatform, normalizeLink, platformLabel, linkMismatchMessage, PLATFORM_DOMAINS } from '../lib/platformDomains';

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];

const FAQ_ITEMS = [
  {
    q: 'How do I know these are real people, not bots?',
    a: 'Every engagement is completed by a trained, verified engager account — never an automated script. Each one submits screenshot proof of the action, which is checked automatically for authenticity and duplicates. You see the same progress bar move in your dashboard as it happens.',
  },
  {
    q: 'Will the comments be generic?',
    a: 'No. Our rules require every comment to speak about your actual post, and generic lines like "this is awesome" are rejected. Comments must be at least 4 words unless you ask for shorter ones in the extra instructions when you order. On videos, engagers must watch to the end before commenting, and follows and subscribes must stay in place after they are paid.',
  },
  {
    q: 'Will this get my account flagged or banned?',
    a: "No — because nothing about it looks like bot activity to the platform. Real accounts, real devices, real behavior. That's the entire point of not using a bot panel.",
  },
  {
    q: "What if my order doesn't get fully delivered?",
    a: "If any part of your order is still unfilled 5 days after payment, you're entitled to a refund for the undelivered portion — never the part that was already completed. Full terms are on our Refund Policy page.",
  },
  {
    q: 'How fast will I see results?',
    a: 'Most orders see their first engagement within 4–12 minutes of payment. You can track live progress from your dashboard the entire time.',
  },
  {
    q: 'Is my payment secure?',
    a: "Payments are processed by Paystack — we never see or store your card details. You'll get an order confirmation and a dashboard link to track everything after payment.",
  },
];

const STEPS = [
  { t: 'Choose what you need', d: 'Pick a platform, paste your post link and choose likes, comments, shares or follows.' },
  { t: 'Real people do it', d: 'Verified engagers complete each task by hand from their own accounts. Comments are written about your post, never generic.' },
  { t: 'Every one is checked', d: 'Each engager uploads a screenshot. It is checked automatically for the real action and for duplicates.' },
];

const COMPARE = [
  ['Who does the engagement', 'Real, verified people', 'Automated or fake accounts'],
  ['Flagging risk to your account', 'Behaves like real activity', 'A detectable pattern'],
  ['Proof it happened', 'A screenshot, checked automatically', 'None'],
  ['Progress tracking', 'A live dashboard', '"Trust us"'],
  ['Undelivered portion', 'Refunded', 'Rarely, if ever'],
];

export default function ClientLanding() {
  const router = useRouter();
  const minPrice = useMinPrice();
  // The free trial leads the page — unless it isn't set up yet (database
  // migration not run), in which case fall back to the plain order CTA
  // instead of sending visitors to a "coming soon" page.
  const [trialOpen, setTrialOpen] = useState(true);
  const [platform, setPlatform] = useState('facebook');
  const [rules, setRules] = useState([]);
  const [selected, setSelected] = useState({}); // { like: { checked, qty } }
  const [postLink, setPostLink] = useState('');
  const [email, setEmail] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activity, setActivity] = useState([]);
  const [pack, setPack] = useState(null); // id of the pack that filled the form, cleared on manual edits

  useEffect(() => {
    fetch(`/api/admin/pricing?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => {
        setRules(d.rules || []);
        const initial = {};
        (d.rules || []).forEach((r) => (initial[r.action] = { checked: false, qty: 30 }));
        setSelected(initial);
        setPack(null);
      })
      .catch(() => {});
  }, [platform]);

  // Deep links (e.g. from the free-trial success screen) can pre-fill the
  // order form: /?platform=instagram&link=...&email=...#order
  useEffect(() => {
    if (!router.isReady) return;
    const { platform: p, link, email: e } = router.query;
    if (isKnownPlatform(p)) setPlatform(p);
    if (typeof link === 'string') setPostLink(link);
    if (typeof e === 'string') setEmail(e);
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/trial/status')
      .then((r) => r.json())
      .then((d) => setTrialOpen(d.reason !== 'not_set_up'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/public/recent-activity')
      .then((r) => r.json())
      .then((d) => setActivity(d.activity || []))
      .catch(() => {});
  }, []);

  const total = rules.reduce((sum, r) => {
    const s = selected[r.action];
    return s?.checked ? sum + s.qty * r.client_price : sum;
  }, 0);
  const hasSelection = Object.values(selected).some((s) => s?.checked);
  const postLinkError = postLink && !linkMatchesPlatform(postLink, platform)
    ? linkMismatchMessage(platform)
    : '';
  const hasFollowSelected = rules.some((r) => ['follow', 'subscribe'].includes(r.action) && selected[r.action]?.checked);
  const belowMinimum = total > 0 && total < MIN_ORDER;
  const canCheckout = !!email && !!postLink && hasSelection && !postLinkError && !belowMinimum;

  function applyPack(id) {
    const def = PACKS.find((x) => x.id === id);
    const lines = buildPack(rules, platform, def.budget);
    if (!lines.length) return;
    const next = {};
    rules.forEach((r) => (next[r.action] = { checked: false, qty: 30 }));
    lines.forEach((l) => (next[l.action] = { checked: true, qty: l.qty }));
    setSelected(next);
    setPack(id);
  }

  async function checkout() {
    setErrorMsg('');
    if (!email || !postLink) {
      setErrorMsg('Add your email and post link.');
      return;
    }
    if (postLinkError) {
      setErrorMsg(postLinkError);
      return;
    }
    const items = rules
      .filter((r) => selected[r.action]?.checked)
      .map((r) => ({ action: r.action, quantity: selected[r.action].qty }));
    if (!items.length) {
      setErrorMsg('Select at least one engagement type.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the link with "https://" added if they pasted it without.
        body: JSON.stringify({ email, platform, postLink: normalizeLink(postLink) || postLink, items, specialInstructions }),
      });
      // A server hiccup can return a non-JSON error page; never let that
      // leave the button stuck on "Redirecting...".
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.authorization_url) {
        setErrorMsg(data.error || 'Something went wrong. Please try again, or message us on WhatsApp.');
        setLoading(false);
        return;
      }
      window.location.href = data.authorization_url; // send them to Paystack
    } catch {
      setErrorMsg("We couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Primeloop — Real Facebook, Instagram & TikTok Engagement | No Bots</title>
        <meta name="description" content="Get real likes, comments, shares and follows from trained Nigerian engagers — not bots. Live tracking, 100% money-back guarantee. Starting from ₦5 per engagement." />
        <meta property="og:title" content="Primeloop — Real Social Media Engagement, No Bots" />
        <meta property="og:description" content="Real people. Real engagement. Watch it happen live on Facebook, Instagram, TikTok, YouTube and X." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://primeloop.app/" />
        <meta property="og:image" content="https://primeloop.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://primeloop.app/og-image.png" />
        <link rel="canonical" href="https://primeloop.app/" />
      </Head>
      <div className="site has-sticky">
        <SiteHeader
          cta={trialOpen ? { href: '/try', label: 'Try it free' } : { href: '#order', label: 'Order now' }}
        />

        <main>
          <section className="s-hero">
            <div className="s-wrap s-hero-grid">
              <div className="s-hero-copy">
                <h1 className="s-h1">Real engagement, watched in real time.</h1>
                <p className="s-lead">
                  Built for creators and businesses tired of bot panels that get pages flagged. Every
                  like, comment and share comes from a trained, verified Nigerian engager, and you
                  watch it happen live.
                </p>
                <div className="s-cta-row">
                  {trialOpen ? (
                    <>
                      <a href="/try" className="s-btn s-btn-primary">Try it free: 5 likes + 2 comments <Arrow /></a>
                      <a href="#order" className="s-link">Or order now{minPrice ? ` from ₦${minPrice}` : ''}</a>
                    </>
                  ) : (
                    <a href="#order" className="s-btn s-btn-primary">Get engagement{minPrice ? ` from ₦${minPrice}` : ''} <Arrow /></a>
                  )}
                </div>
                <ul className="s-assure">
                  <li><Check color="var(--good)" />Verified people, never bots</li>
                  <li><Check color="var(--good)" />A screenshot behind every one</li>
                  <li><Check color="var(--good)" />Refund on anything undelivered</li>
                </ul>
              </div>
              <div className="s-photo">
                <Photo
                  name="client-owner"
                  width={1200}
                  height={1800}
                  priority
                  position="50% 30%"
                  alt="A smiling man in a grey shirt, arms folded, standing outside a venue in Nigeria"
                  sizes="(max-width: 860px) 100vw, 460px"
                />
                <ProofCard kind="activity" rows={activity} exampleText="Instagram comment verified" exampleWhen="e.g. 3m ago" />
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
            <div className="s-wrap">
              <div className="s-section-head">
                <h2 className="s-h2">How it works</h2>
                <p>Three steps between your post and real people engaging with it.</p>
              </div>
              <ol className="s-steps" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {STEPS.map((st, i) => (
                  <li className="s-step" key={st.t}>
                    <div className="s-step-n s-num">{i + 1}</div>
                    <h3 className="s-h3">{st.t}</h3>
                    <p>{st.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="s-band">
            <div className="s-wrap">
              <div className="s-section-head">
                <h2 className="s-h2">Real people, not a bot panel</h2>
                <p>Bot panels sell numbers. Primeloop sells engagement you can check.</p>
              </div>
              <table className="s-compare">
                <thead>
                  <tr>
                    <th scope="col"><span className="s-sr">Feature</span></th>
                    <th scope="col" className="us">Primeloop</th>
                    <th scope="col" className="them">Typical bot panel</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(([k, us, them]) => (
                    <tr key={k}>
                      <th scope="row">{k}</th>
                      <td className="us" data-label="Primeloop"><span className="cell"><Check size={16} color="#7fe0a8" />{us}</span></td>
                      <td className="them" data-label="Typical bot panel"><span className="cell"><Cross size={16} color="#8f97c4" />{them}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="s-section" id="order">
            <div className="s-wrap s-builder">
              <div className="s-builder-copy">
                <h2 className="s-h2">Build your order</h2>
                <p>Choose the platform and the engagement you want. You only pay for what you pick, and you see the total before you go to Paystack.</p>
                <ul>
                  <li><Check color="var(--good)" />Paid securely with Paystack</li>
                  <li><Check color="var(--good)" />Live tracking from your dashboard</li>
                  <li><Check color="var(--good)" />Undelivered after 5 days? Refunded for that portion</li>
                </ul>
                <p className="s-small" style={{ marginTop: 26 }}>
                  Already ordered? <a href="/client-login" className="s-link">Track your order</a>
                </p>
              </div>

              <div className="s-card s-card-lift">
                <div className="s-field">
                  <span className="s-label" id="platform-label">Platform</span>
                  <div className="s-chips" role="group" aria-labelledby="platform-label">
                    {PLATFORMS.map((p) => (
                      <button key={p} type="button" className="s-chip" aria-pressed={p === platform} onClick={() => setPlatform(p)}>
                        {platformLabel(p)}
                      </button>
                    ))}
                  </div>
                </div>

                {rules.length > 0 && (
                  <div className="s-field">
                    <span className="s-label" id="pack-label">Start with a pack, or build your own below</span>
                    <div className="s-packs" role="group" aria-labelledby="pack-label">
                      {PACKS.map((pk) => (
                        <button key={pk.id} type="button" className="s-pack" aria-pressed={pack === pk.id} onClick={() => applyPack(pk.id)}>
                          <span className="s-pack-name">{pk.name}</span>
                          <span className="s-pack-price">₦{pk.budget.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                    {pack && (() => {
                      const lines = buildPack(rules, platform, PACKS.find((x) => x.id === pack).budget);
                      return (
                        <p className="s-hint">
                          {lines.map(packLineLabel).join(' · ')}. Change any amount below.
                        </p>
                      );
                    })()}
                  </div>
                )}

                <div className="s-field">
                  <label className="s-label" htmlFor="client-email">Your email</label>
                  <input
                    id="client-email"
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

                <div className="s-field">
                  <label className="s-label" htmlFor="post-link">{hasFollowSelected ? 'Post or profile link' : 'Post link'}</label>
                  <input
                    id="post-link"
                    className={`s-input${postLinkError ? ' is-bad' : ''}`}
                    value={postLink}
                    onChange={(e) => setPostLink(e.target.value)}
                    placeholder={`https://${PLATFORM_DOMAINS[platform][0]}/...`}
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    aria-invalid={!!postLinkError}
                    aria-describedby={postLinkError ? 'post-link-error' : hasFollowSelected ? 'post-link-hint' : undefined}
                  />
                  {postLinkError && <p id="post-link-error" className="s-error">{postLinkError}</p>}
                  {!postLinkError && hasFollowSelected && (
                    <p id="post-link-hint" className="s-hint">
                      For {platform === 'youtube' ? 'subscribers' : 'follows'}, paste your profile link (like{' '}
                      {platform === 'youtube' ? 'youtube.com/@yourchannel' : `${PLATFORM_DOMAINS[platform][0]}/yourname`}) so each
                      engager only follows you once.
                    </p>
                  )}
                </div>

                <div className="s-field">
                  <label className="s-label" htmlFor="extra-instructions">
                    Extra instructions <span className="s-muted" style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    id="extra-instructions"
                    className="s-input"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. comments should mention the product name. Comments are 4+ words and specific to your post unless you say short ones are fine."
                  />
                </div>

                <div>
                  {rules.map((r) => (
                    <div className="s-eng" key={r.action}>
                      <input
                        id={`engage-${r.action}`}
                        type="checkbox"
                        checked={!!selected[r.action]?.checked}
                        onChange={(e) =>
                          { setPack(null); setSelected((s) => ({ ...s, [r.action]: { ...s[r.action], checked: e.target.checked } })); }
                        }
                      />
                      <label htmlFor={`engage-${r.action}`}>{r.action}</label>
                      <div className="price">₦{r.client_price}/unit</div>
                      <input
                        type="number"
                        min="1"
                        className="s-input"
                        aria-label={`${r.action} quantity`}
                        style={{ padding: '9px 10px' }}
                        value={selected[r.action]?.qty || 30}
                        onChange={(e) =>
                          { setPack(null); setSelected((s) => ({ ...s, [r.action]: { ...s[r.action], qty: Math.max(1, Math.floor(+e.target.value || 1)) } })); }
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="s-total">
                  <div>
                    <div className="label">Total</div>
                    <div className="amt">₦{total.toLocaleString()}</div>
                  </div>
                  <button className="s-btn s-btn-primary" onClick={checkout} disabled={loading || !canCheckout}>
                    {loading ? 'Redirecting...' : 'Pay with Paystack'}
                  </button>
                </div>
                {belowMinimum && (
                  <p className="s-error" role="status">
                    The minimum order is ₦{MIN_ORDER.toLocaleString()}. Add ₦{(MIN_ORDER - total).toLocaleString()} more, or pick a pack above.
                  </p>
                )}
                {errorMsg && <p className="s-error" role="alert">{errorMsg}</p>}
                <p className="s-note">Undelivered after 5 days? Full refund for that portion — no questions asked.</p>
                {trialOpen && (
                  <p className="s-alt">
                    Not ready to pay yet? <a href="/try" className="s-link">Try 5 likes + 2 comments free first</a>
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="s-section s-section-tint" id="faq">
            <div className="s-wrap s-faq-wrap">
              <div className="s-faq-side">
                <h2 className="s-h2">Questions before you order</h2>
                <p>Can&apos;t find your answer? Message an admin on WhatsApp and a person will reply.</p>
              </div>
              <SiteFaq items={FAQ_ITEMS} />
            </div>
          </section>

          <section className="s-section">
            <div className="s-wrap">
              <div className="s-cross">
                <div className="s-cross-copy">
                  <h2 className="s-h2">Want to earn instead?</h2>
                  <p>Engagers are paid every Friday, straight to a bank account or Opay, for likes, comments, shares and follows they complete from their own phones. Payouts start from ₦500; smaller amounts carry over.</p>
                  <a href="/join" className="s-btn s-btn-navy">See how engagers earn <Arrow /></a>
                </div>
                <Photo
                  name="engager-corper"
                  width={1200}
                  height={1800}
                  position="50% 30%"
                  alt="A young person in a green and white uniform checking their phone on a street in Nigeria"
                  sizes="(max-width: 860px) 100vw, 40vw"
                />
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />

        <SiteWhatsApp avoidSelectors={['#order .s-card']} />
        <SiteSticky
          label={total > 0 ? `₦${total.toLocaleString()}` : trialOpen ? '5 likes + 2 comments' : minPrice ? `From ₦${minPrice}/unit` : 'Real engagement'}
          sublabel={total > 0 ? 'Your order' : trialOpen ? 'Free trial' : 'Real engagement'}
          href={total > 0 || !trialOpen ? '#order' : '/try'}
          cta={total > 0 || !trialOpen ? 'Get started' : 'Try it free'}
          hideNearId="order"
        />
      </div>
    </>
  );
}
