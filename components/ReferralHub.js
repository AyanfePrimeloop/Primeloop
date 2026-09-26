import { useState } from 'react';
import ReferralGraphic from './ReferralGraphic';
import { GRAPHICS, captions, shareLinks, referralLinks, REFERRAL_BONUS, REFERRAL_MILESTONE } from '../lib/referral';

const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');

function CopyButton({ text, label = 'Copy', primary = false }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      window.prompt('Copy this:', text);
    }
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }
  return <button type="button" className={`btn${primary ? ' primary' : ''}`} style={{ fontSize: 13 }} onClick={copy}>{done ? 'Copied' : label}</button>;
}

function Tile({ value, label, tone }) {
  return (
    <div style={{ padding: '14px 16px', background: 'var(--paper)', borderRadius: 12 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: tone || 'var(--navy)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{label}</div>
    </div>
  );
}

const CHANNELS = [
  {
    title: 'WhatsApp Status and groups (start here)',
    steps: [
      'Post one graphic to your Status every day for a week, with the "WhatsApp Status" caption. Your contacts already know you, which is why this converts best.',
      'Post between 7pm and 10pm, when most people are checking Status. Change the graphic each day so it does not look repeated.',
      'Only post in groups where promotions are allowed. Ask an admin first. Posting links in groups that ban them gets you removed and looks like spam.',
      'When someone replies, answer within minutes. Send them your link and tell them to read the Screenshot guide before their first task.',
    ],
  },
  {
    title: 'Facebook',
    steps: [
      'Post a graphic on your own profile with the Facebook caption. Pin it if you can.',
      'In side-hustle, student and job groups that allow it, share the post. Read the group rules first.',
      'When someone asks "how can I make money online?", reply helpfully and mention Primeloop with your link. A helpful reply beats a copy-pasted post.',
    ],
  },
  {
    title: 'Instagram',
    steps: [
      'Put your link in your bio. Captions are not clickable, so say "link in bio".',
      'Use the story graphic (the tall one) as an Instagram Story and add a link sticker with your link.',
      'Post a short Reel or screen recording of how a task works. Hide your bank details and anything private.',
    ],
  },
  {
    title: 'TikTok',
    steps: [
      'Put your link in your bio.',
      'Make a short video: "How I earn from my phone in Nigeria". Show the steps (sign up, pick a task, upload proof) and be honest about what it is.',
      'Reply to comments that ask "how?" with a video reply or your link.',
    ],
  },
  {
    title: 'X (Twitter)',
    steps: [
      'Post the "X" caption with a graphic and pin it to your profile.',
      'Reply to people asking about side hustles or earning online, with something useful first and your link second.',
    ],
  },
];

const FAQ = [
  ['When do I get the bonus?', `As soon as the person you referred has ${REFERRAL_MILESTONE} approved tasks. It is added to your next Friday payout. You do not need to ask for it.`],
  ['Is there a limit to how many people I can refer?', 'No limit. Each person who reaches the milestone earns you the bonus.'],
  ['Does it reduce what the person I referred earns?', 'No. They keep everything they earn from tasks. The bonus is separate and paid by Primeloop.'],
  ['What if someone signs up without my link?', 'It cannot be added afterwards, so the referral is only recorded when they sign up through your link. Send them the link before they register.'],
  ['Can I refer myself or use extra accounts?', 'No. Fake or duplicate accounts, and referring yourself, can lose you the bonus and your account.'],
  ['Why has my referral not reached the bonus yet?', `They need ${REFERRAL_MILESTONE} tasks that are approved, not just submitted. Help them with the Screenshot guide so their proofs get approved quickly.`],
];

export default function ReferralHub({ code, stats }) {
  const links = referralLinks(code);
  const cap = links ? captions(links.short) : [];
  const first = cap[0];
  const share = links && first ? shareLinks(links.short, first.text) : null;
  const s = stats || { count: 0, earned: 0, waiting: 0, active: 0, reached: 0, people: [] };
  const stillToEarn = Math.max(0, s.count - s.reached) * REFERRAL_BONUS;

  if (!links) return <div className="section" style={{ padding: 20, color: 'var(--ink-mute)' }}>We could not find your referral code. Reload the page.</div>;

  return (
    <>
      <div className="section" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 6px' }}>Your referral link</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 12px' }}>
          Earn <strong>{naira(REFERRAL_BONUS)}</strong> for every person you refer who completes <strong>{REFERRAL_MILESTONE} approved tasks</strong>. Paid with your Friday payout.
        </p>
        <input readOnly aria-label="Your referral link" value={links.short} onClick={(e) => e.target.select()} style={{ width: '100%', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 16, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CopyButton text={links.short} label="Copy link" primary />
          <a className="btn" style={{ fontSize: 13 }} href={share.whatsapp} target="_blank" rel="noreferrer">Share on WhatsApp</a>
          <a className="btn" style={{ fontSize: 13 }} href={share.facebook} target="_blank" rel="noreferrer">Facebook</a>
          <a className="btn" style={{ fontSize: 13 }} href={share.x} target="_blank" rel="noreferrer">X</a>
          <a className="btn" style={{ fontSize: 13 }} href={share.telegram} target="_blank" rel="noreferrer">Telegram</a>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '12px 0 0' }}>
          If the short link does not open for someone, send this one: <span style={{ fontFamily: 'var(--mono)', overflowWrap: 'anywhere' }}>{links.full}</span> <CopyButton text={links.full} label="Copy" />
        </p>
      </div>

      <div className="section" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 12px' }}>Your results</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <Tile value={s.count} label="people joined with your link" />
          <Tile value={s.active} label="have had a task approved" />
          <Tile value={s.reached} label={`reached ${REFERRAL_MILESTONE} tasks`} />
          <Tile value={naira(s.earned)} label="earned from referrals" tone="var(--good)" />
        </div>
        {s.waiting > 0 && <p style={{ fontSize: 14, margin: '12px 0 0', color: 'var(--good)' }}>{naira(s.waiting)} of that is waiting for your next Friday payout.</p>}
        {stillToEarn > 0 && <p style={{ fontSize: 13.5, margin: '10px 0 0', color: 'var(--ink-mute)' }}>If everyone who has joined reaches {REFERRAL_MILESTONE} approved tasks, that is another {naira(stillToEarn)}. It depends on them doing real work.</p>}

        {s.people.length > 0 && (
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {s.people.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 110, fontWeight: 600, overflowWrap: 'anywhere' }}>{p.name}</div>
                <div style={{ flex: 1, minWidth: 120, height: 8, background: 'var(--paper)', borderRadius: 99, overflow: 'hidden' }} aria-hidden="true">
                  <div style={{ width: `${Math.round((p.approved / REFERRAL_MILESTONE) * 100)}%`, height: '100%', background: p.reached ? 'var(--good)' : 'var(--accent)' }} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-mute)', minWidth: 96, textAlign: 'right' }}>{p.dismissed ? 'Removed' : p.reached ? 'Bonus earned' : `${p.approved} of ${REFERRAL_MILESTONE} tasks`}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 12px' }}>How it works</h2>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, fontSize: 14.5, color: 'var(--ink-soft)' }}>
          <li>Share your link or a graphic below, where your people already are.</li>
          <li>Someone joins through your link and registers. The link is what connects them to you, so it has to be used when they sign up.</li>
          <li>They pass the short test on a platform and start doing tasks. Every task they do is checked in the normal way.</li>
          <li>When they reach {REFERRAL_MILESTONE} approved tasks, you earn {naira(REFERRAL_BONUS)}. It goes into your next Friday payout automatically.</li>
        </ol>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '12px 0 0' }}>
          Example, not a promise: 10 people who each reach {REFERRAL_MILESTONE} approved tasks would earn you {naira(10 * REFERRAL_BONUS)}. Every person is different, and the bonus only comes from real people doing real work.
        </p>
      </div>

      <div className="section" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 6px' }}>Your graphics, with your link on them</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 14px' }}>Your link is already on each one. Download it, or on your phone use Share image to send it straight to Status, Instagram or Facebook. The tall one is for Stories.</p>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {GRAPHICS.map((g) => <ReferralGraphic key={g.id} graphic={g} linkText={links.display} code={code} />)}
        </div>
      </div>

      <div className="section" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 17, margin: '0 0 6px' }}>Captions to copy</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 14px' }}>Your link is already in each one. Feel free to change the words. If you have been paid, adding a true line about it, in your own voice, works better than anything we write.</p>
        <div style={{ display: 'grid', gap: 16 }}>
          {cap.map((c) => (
            <div key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <strong>{c.label}</strong>
                <CopyButton text={c.text} label="Copy caption" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 6 }}>{c.hint}</div>
              <pre style={{ margin: 0, padding: 12, background: 'var(--paper)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 14, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.text}</pre>
            </div>
          ))}
        </div>
      </div>

      <div className="section" style={{ padding: '4px 20px 12px' }}>
        <h2 style={{ fontSize: 17, margin: '16px 0 4px' }}>Where and how to post</h2>
        {CHANNELS.map((c, i) => (
          <details key={c.title} open={i === 0} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{c.title}</summary>
            <ul style={{ margin: '10px 0 4px', paddingLeft: 20, display: 'grid', gap: 6, fontSize: 14.5, color: 'var(--ink-soft)' }}>
              {c.steps.map((st) => <li key={st}>{st}</li>)}
            </ul>
          </details>
        ))}
        <h3 style={{ fontSize: 15, margin: '18px 0 6px' }}>What makes people actually join</h3>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 14.5, color: 'var(--ink-soft)' }}>
          <li>Tell them what it really is: simple tasks, paid every Friday, free to join. People trust a plain explanation more than big claims.</li>
          <li>Post for a full week, not once. Most people do not act the first time they see something.</li>
          <li>Answer quickly and kindly. Then follow up with the people who joined: help them pick a platform, pass the test and use the Screenshot guide. Your bonus only arrives when they get {REFERRAL_MILESTONE} tasks approved, so helping them succeed is how you earn.</li>
          <li>Say you get a bonus. Being upfront builds trust, and the captions above already include it.</li>
        </ul>
      </div>

      <div className="section" style={{ padding: 20, background: 'var(--warn-soft)' }}>
        <h2 style={{ fontSize: 17, margin: '0 0 8px' }}>Please do not</h2>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 14.5 }}>
          <li>Promise how much someone will earn, or say it is guaranteed. Only real, honest statements.</li>
          <li>Spam groups or send the link to strangers in bulk. It gets you blocked and reflects on Primeloop.</li>
          <li>Refer yourself, or make fake or extra accounts. It loses the bonus and can end your account.</li>
          <li>Post someone else&apos;s payout or proof as if it were yours.</li>
          <li>Break the rules of the platform or group you are posting in.</li>
        </ul>
      </div>

      <div className="section" style={{ padding: '4px 20px 12px' }}>
        <h2 style={{ fontSize: 17, margin: '16px 0 4px' }}>Questions</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{q}</summary>
            <p style={{ margin: '8px 0 2px', fontSize: 14.5, color: 'var(--ink-soft)' }}>{a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
