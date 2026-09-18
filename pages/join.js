import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import SiteFaq from '../components/SiteFaq';
import SiteSticky from '../components/SiteSticky';
import SiteWhatsApp from '../components/SiteWhatsApp';
import Photo from '../components/Photo';
import ProofCard from '../components/ProofCard';
import { Check, Arrow } from '../components/SiteIcons';

const FAQ_ITEMS = [
  {
    q: 'Is this actually legit? How do I know I’ll get paid?',
    a: 'Payouts run automatically every Friday to your bank account or Opay, so there is no chasing anyone for money. When real payouts have gone out recently they appear in the card at the top of this page; until then it shows a clearly labelled example.',
  },
  {
    q: 'Do I need a big following or a professional account?',
    a: 'No. You use your own, ordinary account to like, comment, share and follow — the same things you already do on social media. There’s no follower minimum.',
  },
  {
    q: 'How much can I realistically earn?',
    a: 'It depends on how many tasks you do and your tier — Gold and Platinum engagers earn more per task. Use the calculator on this page for a realistic weekly estimate based on your own pace.',
  },
  {
    q: 'What if my proof gets rejected?',
    a: 'Most submissions are checked automatically within seconds. If something looks off, it goes to manual review instead of an automatic rejection — a real person looks at it before any final decision.',
  },
  {
    q: 'Is there any cost to join?',
    a: 'None. Registration is free, and your account activates immediately after you pass a short onboarding test for each platform you want to work on.',
  },
];

const STEPS = [
  { t: 'Register in 2 minutes', d: 'Your name, WhatsApp number, and the platforms you use.' },
  { t: 'Pass a quick onboarding test', d: 'One test task per platform confirms your account.' },
  { t: 'Do tasks, upload proof', d: 'A quick screenshot. Most are checked in seconds.' },
  { t: 'Get paid every Friday', d: 'Straight to your bank or Opay, automatically.' },
];

export default function JoinAsEngager() {
  const router = useRouter();
  const { ref } = router.query;
  const [tasksPerDay, setTasksPerDay] = useState(20);
  const weeklyEstimate = Math.round(tasksPerDay * 7 * 16);
  const signupHref = ref ? `/signup?ref=${encodeURIComponent(ref)}` : '/signup';
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    fetch('/api/public/recent-payouts')
      .then((r) => r.json())
      .then((d) => setPayouts(d.payouts || []))
      .catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <title>Earn Money Online in Nigeria — Join Primeloop as an Engager</title>
        <meta name="description" content="Earn from your phone doing tasks you already do — like, comment, share and follow on Facebook, Instagram, TikTok, YouTube and X. Paid every Friday, no experience needed." />
        <meta property="og:title" content="Earn Money From Your Phone — Join Primeloop" />
        <meta property="og:description" content="Weekly payouts every Friday. Register in 2 minutes, no startup cost." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://primeloop.app/join" />
        <meta property="og:image" content="https://primeloop.app/og-image-join.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://primeloop.app/og-image-join.png" />
        <link rel="canonical" href="https://primeloop.app/join" />
      </Head>
      <div className="site has-sticky">
        <SiteHeader
          cta={{ href: signupHref, label: 'Start earning' }}
          links={[
            { href: '#how', label: 'How it works' },
            { href: '#earnings', label: 'Earnings' },
            { href: '/', label: 'Buy engagement' },
          ]}
        />

        <main>
          <section className="s-hero">
            <div className="s-wrap s-hero-grid">
              <div className="s-hero-copy">
                <h1 className="s-h1">Earn from your phone. Watch the payouts roll in.</h1>
                <p className="s-lead">
                  Like, comment, share and follow on tasks you already do. Paid every Friday, straight
                  to your bank or Opay — no experience, no startup cost.
                </p>
                <div className="s-cta-row">
                  <a href="#signup" className="s-btn s-btn-primary">Start earning free <Arrow /></a>
                  <a href="#how" className="s-link">See how payouts work</a>
                </div>
                <ul className="s-assure">
                  <li><Check color="var(--good)" />Paid every Friday</li>
                  <li><Check color="var(--good)" />Bank or Opay</li>
                  <li><Check color="var(--good)" />No experience needed</li>
                </ul>
              </div>
              <div className="s-photo">
                <Photo
                  name="engager-phone"
                  width={1200}
                  height={1500}
                  priority
                  position="50% 40%"
                  alt="A young man in a grey t-shirt smiling at his phone against a plain wall"
                  sizes="(max-width: 860px) 100vw, 460px"
                />
                <ProofCard kind="payouts" rows={payouts} exampleText="₦4,200 paid to an engager" exampleWhen="e.g. last Friday" />
              </div>
            </div>
          </section>

          <section className="s-section s-section-tint" id="how">
            <div className="s-wrap">
              <div className="s-section-head">
                <h2 className="s-h2">How it works</h2>
                <p>From sign-up to your first payout, in four steps.</p>
              </div>
              <ol className="s-steps four" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
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

          <section className="s-section" id="earnings">
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
                <h2 className="s-h2">See what your pace could earn</h2>
                <p className="s-lead" style={{ marginTop: 14 }}>
                  Move the slider to the number of tasks you could do in a day. Referring friends earns a bonus on top.
                </p>
                <div className="s-card s-card-lift earn-calc" style={{ marginTop: 28 }}>
                  <label className="s-label" htmlFor="tasks-per-day">Tasks you can realistically do per day</label>
                  <input
                    id="tasks-per-day"
                    className="s-range"
                    type="range"
                    min="1"
                    max="100"
                    value={tasksPerDay}
                    onChange={(e) => setTasksPerDay(+e.target.value)}
                    style={{ '--fill': `${((tasksPerDay - 1) / 99) * 100}%` }}
                  />
                  <div className="s-calc-scale s-num"><span>1</span><span>{tasksPerDay} per day</span><span>100</span></div>
                  <div className="s-calc-out">
                    <div className="s-small s-muted">Estimated weekly earning</div>
                    <div className="big">₦{weeklyEstimate.toLocaleString()}</div>
                    <div className="s-small s-muted">An estimate, not a guarantee. Gold and Platinum tiers earn more per task.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="s-section s-section-tint" id="faq">
            <div className="s-wrap s-faq-wrap">
              <div className="s-faq-side">
                <h2 className="s-h2">Questions before you join</h2>
                <p>Still unsure? Message an admin on WhatsApp and a person will reply.</p>
              </div>
              <SiteFaq items={FAQ_ITEMS} />
            </div>
          </section>

          <section className="s-band" id="signup">
            <div className="s-wrap s-final">
              <div>
                <h2 className="s-h2">Ready to start?</h2>
                <p>Registration takes about 2 minutes. Your account activates immediately, so you can browse tasks right away.</p>
                <p className="s-small" style={{ marginTop: 14 }}>
                  Already registered? <a href="/login" className="s-link" style={{ color: '#fff' }}>Log in</a>
                </p>
              </div>
              <a href={signupHref} className="s-btn s-btn-primary">Create my account <Arrow /></a>
            </div>
          </section>

          <section className="s-section">
            <div className="s-wrap">
              <p className="s-lead" style={{ maxWidth: 'none' }}>
                Want to promote your own post instead?{' '}
                <a href="/" className="s-link">Get real engagement from trained engagers</a>
              </p>
            </div>
          </section>
        </main>

        <SiteFooter />

        <SiteWhatsApp avoidSelectors={['.earn-calc']} />
        <SiteSticky label="Free to join" sublabel="Start earning" href="#signup" cta="Start earning" hideNearId="signup" />
      </div>
    </>
  );
}
