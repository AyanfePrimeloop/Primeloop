import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Logo from '../components/Logo';
import WhatsAppButton from '../components/WhatsAppButton';
import Faq from '../components/Faq';
import StickyCta from '../components/StickyCta';
import CheckIcon from '../components/CheckIcon';
import { timeAgo, isFresh } from '../lib/timeAgo';

const FAQ_ITEMS = [
  {
    q: 'Is this actually legit? How do I know I’ll get paid?',
    a: 'Payouts run automatically every Friday to your bank account or Opay — no chasing anyone for money. 1,200+ people are already earning this way, and any payout you see above is a real, recent transfer, not a made-up example.',
  },
  {
    q: 'Do I need a big following or a professional account?',
    a: 'No. You use your own, ordinary account to like, comment, share and follow — the same things you already do on social media. There’s no follower minimum.',
  },
  {
    q: 'How much can I realistically earn?',
    a: 'It depends on how many tasks you do and your tier — Gold and Platinum engagers earn more per task. Use the calculator below for a realistic weekly estimate based on your own pace.',
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

export default function JoinAsEngager() {
  const router = useRouter();
  const { ref } = router.query;
  const [tasksPerDay, setTasksPerDay] = useState(5);
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
        <meta property="og:description" content="1,200+ people already earning weekly payouts. Register in 2 minutes, no startup cost." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://primeloop.app/join" />
        <meta property="og:image" content="https://primeloop.app/og-image-join.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://primeloop.app/og-image-join.png" />
        <link rel="canonical" href="https://primeloop.app/join" />
      </Head>
    <div className="app has-sticky-cta">
      <div className="fade-in" style={{ marginBottom: 18 }}><Logo size={36} /></div>

      <div className="hero2 fade-in-delay-1">
        <div>
          <h1>Earn from your phone. Watch the payouts roll in.</h1>
          <p className="lead">
            Like, comment, share and follow on tasks you already do. Paid every Friday, straight
            to your bank or Opay — no experience, no startup cost.
          </p>
          <div className="hero2-ctas">
            <a href="#signup" className="cta-bold">Start earning — free →</a>
            <a className="cta-ghost2" href="#how">See how payouts work</a>
          </div>
        </div>
        <div className="hero2-widget">
          <div className={`live-tag${payouts.length && isFresh(payouts[0].at) ? '' : ' stale'}`}>
            <span className="dot-live" />
            {payouts.length && isFresh(payouts[0].at) ? 'Live payouts' : 'Recent payouts'}
          </div>
          {payouts.length === 0 && (
            <div className="feed-row example">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon size={11} color="var(--ink-mute)" />
                <i>Example — ₦4,200 paid to an engager</i>
              </span>
              <span className="t">e.g. last Friday</span>
            </div>
          )}
          {payouts.map((p, i) => (
            <div className="feed-row" key={i}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon size={11} color="var(--good)" />
                <b>₦{p.amount.toLocaleString()}</b>&nbsp;paid to {p.name}
              </span>
              <span className="t">{timeAgo(p.at)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="trust-bar2 fade-in-delay-2">
        <div className="stat"><div className="n">Weekly</div><div className="l">Payouts, every Friday</div></div>
        <div className="stat"><div className="n">₦0</div><div className="l">To get started</div></div>
        <div className="stat"><div className="n">2 min</div><div className="l">To register</div></div>
        <div className="badges">
          <div className="badge"><CheckIcon size={11} color="var(--good)" />1,200+ already earning</div>
          <div className="badge"><CheckIcon size={11} color="var(--good)" />Bank or Opay</div>
          <div className="badge"><CheckIcon size={11} color="var(--good)" />No experience needed</div>
        </div>
      </div>

      <div className="case-study fade-in-delay-2">
        <p className="quote">"Got my first payout the same week I signed up. Didn't believe it was real until the alert came in."</p>
        <div className="who">— Tunde A., engager since March</div>
      </div>

      <div className="grid-main-side">
        <div>
          <div className="section" id="how">
            <div className="section-head"><h2>How it works</h2></div>
            <div style={{ padding: '4px 20px' }}>
              <div className="step-row">
                <div className="step-num">1</div>
                <div><strong>Register in 2 minutes</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Your name, WhatsApp number, and the platforms you use.</div></div>
              </div>
              <div className="step-row">
                <div className="step-num">2</div>
                <div><strong>Pass a quick onboarding test</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>One test task per platform confirms your account.</div></div>
              </div>
              <div className="step-row">
                <div className="step-num">3</div>
                <div><strong>Do tasks, upload proof</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>A quick screenshot. Most are checked in seconds.</div></div>
              </div>
              <div className="step-row">
                <div className="step-num">4</div>
                <div><strong>Get paid every Friday</strong><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Straight to your bank or Opay, automatically.</div></div>
              </div>
            </div>
          </div>

          <div className="section" id="faq">
            <div className="section-head"><h2>Questions before you join</h2></div>
            <div style={{ padding: '4px 20px 8px' }}>
              <Faq items={FAQ_ITEMS} />
            </div>
          </div>
        </div>

        <div>
          <div className="earn-calc">
            <label htmlFor="tasks-per-day" style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10, display: 'block' }}>Tasks you can realistically do per day</label>
            <input id="tasks-per-day" type="range" min="1" max="100" value={tasksPerDay} onChange={(e) => setTasksPerDay(+e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--ink-mute)' }}>
              <span>1</span><span>{tasksPerDay}</span><span>100</span>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Estimated weekly earning</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--good)' }}>₦{weeklyEstimate.toLocaleString()}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>Gold and Platinum tiers earn more per task.</div>
            </div>
          </div>

          <div className="section" id="signup">
            <div className="section-head"><h2>Ready to start?</h2></div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>
                Registration takes about 2 minutes. Your account activates immediately —
                you can browse tasks right away.
              </p>
              <a href={signupHref} className="btn accent" style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                Create my account
              </a>
              <p style={{ fontSize: 12.5, marginTop: 14, textAlign: 'center' }}>
                Already registered? <a href="/login" style={{ color: 'var(--navy)' }}>Log in</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <a
        href="/"
        className="section"
        style={{
          display: 'block', padding: '18px 20px', marginTop: 20, textDecoration: 'none',
          background: 'var(--navy)', color: '#fff', textAlign: 'center',
        }}
      >
        <strong>Want to promote your own post instead?</strong>
        <div style={{ fontSize: 12.5, color: 'var(--label-on-navy)', marginTop: 4 }}>Get real engagement from trained engagers →</div>
      </a>

      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 24 }}>
        <a href="/terms" style={{ color: 'var(--ink-soft)' }}>Terms</a> ·{' '}
        <a href="/privacy" style={{ color: 'var(--ink-soft)' }}>Privacy</a> ·{' '}
        <a href="/refund-policy" style={{ color: 'var(--ink-soft)' }}>Refund Policy</a>
      </p>

      <WhatsAppButton avoidSelectors={['#faq', '.earn-calc']} />
      <StickyCta label="Free to join" sublabel="Start earning" href="#signup" hideNearId="signup" />
    </div>
    </>
  );
}
