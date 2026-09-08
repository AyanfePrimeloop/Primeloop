import { useState } from 'react';
import Logo from '../components/Logo';
import WhatsAppButton from '../components/WhatsAppButton';

export default function JoinAsEngager() {
  const [tasksPerDay, setTasksPerDay] = useState(5);
  const weeklyEstimate = Math.round(tasksPerDay * 7 * 16);

  return (
    <div className="app">
      <div className="hero">
        <Logo size={40} light />
        <div className="hero-eyebrow" style={{ marginTop: 18 }}>Facebook · Instagram · TikTok · YouTube · X</div>
        <h1>Earn from your phone, doing what you already do.</h1>
        <p>
          Like, comment, share and follow on real tasks. Get paid every week, straight to your
          bank or Opay — no experience, no startup cost.
        </p>
        <div className="hero-ctas">
          <a href="#signup" className="btn accent" style={{ textDecoration: 'none' }}>Start earning today</a>
        </div>
        <div className="trust-row">
          <div className="trust-item"><span className="n">1,200+</span> active engagers</div>
          <div className="trust-item"><span className="n">Every Friday</span> automatic payout</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div>
          <div className="section">
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

          <div className="section">
            <div className="section-head"><h2>Paid out this week</h2></div>
            <div style={{ padding: '16px 20px' }}>
              <div className="payout-item"><span>Damilola O. · Gold tier</span><strong style={{ color: 'var(--good)', fontFamily: 'var(--mono)' }}>₦6,240</strong></div>
              <div className="payout-item"><span>Ese M. · Silver tier</span><strong style={{ color: 'var(--good)', fontFamily: 'var(--mono)' }}>₦4,980</strong></div>
              <div className="payout-item"><span>ThankGod E. · Platinum tier</span><strong style={{ color: 'var(--good)', fontFamily: 'var(--mono)' }}>₦9,150</strong></div>
            </div>
          </div>
        </div>

        <div>
          <div className="earn-calc">
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>Tasks you can realistically do per day</div>
            <input type="range" min="1" max="100" value={tasksPerDay} onChange={(e) => setTasksPerDay(+e.target.value)} style={{ width: '100%' }} />
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
              <a href="/signup" className="btn accent" style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                Create my account
              </a>
              <p style={{ fontSize: 12.5, marginTop: 14, textAlign: 'center' }}>
                Already registered? <a href="/login" style={{ color: 'var(--navy)' }}>Log in</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppButton />
    </div>
  );
}
