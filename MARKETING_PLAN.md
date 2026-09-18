# Primeloop Acquisition Playbook

How to get the two groups Primeloop needs — **clients** who pay, and **engagers** who deliver —
without burning money, trust, or your ad accounts. Written for a founder running this from a
phone and WhatsApp, not a marketing department.

> Numbers in this document are either (a) taken from your real pricing table, (b) labelled
> "scenario", or (c) targets to measure against. Nothing here is a fact about your traction.
> Update the scenarios with real numbers as soon as you have them.

---

## 0. Read this first: the platform-policy reality

Primeloop's product is real people liking and commenting on other people's posts, for money.
Platforms treat that as buying and selling engagement, whoever the people are:

- **Meta (Facebook + Instagram)** prohibits "selling, buying, or exchanging for engagement, such
  as likes, shares, views, follows" and enforces with ad disapproval, ad-account restrictions and
  permanent bans ([Meta Prohibited Commercial Practices](https://transparency.meta.com/policies/community-standards/prohibited-commercial-practices/),
  [Meta Advertising Standards](https://transparency.meta.com/policies/ad-standards/)).
- **TikTok** treats inauthentic engagement as an integrity violation
  ([TikTok integrity & authenticity](https://www.tiktok.com/safety/en/policies-and-engagement/integrity-authenticity)).
- Please re-read the current wording yourself before spending — policies change.

What that means in practice:

1. **Paid ads for the *client* offer on Meta/TikTok are likely to be rejected or to put the ad
   account at risk.** Treat paid social as a small experiment, never the plan.
2. **Keep ads in a separate Meta Business Portfolio** from the one holding your WhatsApp Business
   Platform number. A restricted ad account must never be able to take your engager alerts down.
3. **Don't try to trick review** (vague creatives, cloaked landing pages, "growth services"
   euphemisms). It escalates to permanent bans and it's the opposite of your brand.
4. **Your best channels are the ones where the offer is welcome:** WhatsApp, referrals, direct
   outreach, communities, partnerships with social media managers, and organic content that
   *educates* (how to spot fake engagement) rather than pitches.
5. **"Won't get you flagged" is a promise you can't keep** — the platforms decide, not you. Your
   own Terms already disclaim platform actions. Soften the homepage FAQ ("No — because nothing
   about it looks like bot activity") to "designed to look like normal activity; we can't control
   platform decisions". The new `/try` page already uses the softer wording.

This is a business-model risk to keep your eyes open about, not a reason to stop. It just decides
*where* you spend effort: earn trust in channels you control.

---

## 1. The two-sided sequence (why order matters)

A marketplace dies from an empty side. Yours has a specific failure mode: **a client who pays or
tries a free trial and gets no engagement in the first hour never comes back.**

**Rule 1 — supply before demand.** Don't send client traffic to a platform until at least
**25 onboarding-verified engagers exist for that platform.** (A trial's 5 likes need 5 *different*
engagers, and only some will respond in the first hour.)

**Rule 2 — throttle by fill time.** Watch the admin task board weekly:
| You see | Do this |
|---|---|
| Trial/order tasks waiting more than ~30 min for first engagement | Pause client outreach. Push engager recruitment. |
| Engagers active but few tasks to do | Push client outreach and the free trial. |
| Both healthy | Scale whichever is cheaper per result. |

**Rule 3 — the free trial is the client wedge; Friday payouts are the engager wedge.** Everything
below is built on those two.

---

## 2. Unit economics (so you know what you can afford to spend)

From your seeded pricing (check `/admin/pricing` for live values):

| Action (Facebook) | Client pays | Engager earns | You keep | Margin |
|---|---|---|---|---|
| Like | ₦6 | ₦3.50 | ₦2.50 | 42% |
| Comment | ₦14 | ₦8.50 | ₦5.50 | 39% |
| Follow | ₦30 | ₦19 | ₦11 | 37% |

**Cost of one free trial** (5 likes + 2 comments): about **₦33–₦42** depending on platform, and
capped at 40 trials/week (≈ ₦1,300–₦1,700 worst case per week) by `TRIAL_WEEKLY_CAP`.

**Break-even trial → paid conversion** (scenario: your margin on a first order is ~40%):

| First paid order | Your margin | Break-even conversion at ₦35 trial cost |
|---|---|---|
| ₦1,500 | ₦600 | 5.8% |
| ₦3,000 | ₦1,200 | 2.9% |
| ₦6,000 | ₦2,400 | 1.5% |

So a free trial repays itself if roughly **1 in 20–35 trial users** places a first order. Repeat
orders make it better. That's why the trial is worth giving away.

**If you pay for traffic** (cost per trial sign-up = CPL), break-even conversion on a ₦3,000 first
order is `(CPL + ₦35) ÷ ₦1,200`:

| CPL | Break-even conversion |
|---|---|
| ₦100 | 11% |
| ₦250 | 24% |
| ₦500 | 45% |

**Decision rule:** only put money behind a channel once you've *measured* CPL ≤ ₦150 **and**
trial→paid ≥ 15% from that channel. Until then, organic and referral only.

---

## 3. Winning clients

### Who to go after (in this order)

1. **Social media managers and small agencies** — they manage several brands and need engagement
   *every month*. One relationship = recurring revenue. Offer them the trial on a client's post.
2. **Instagram/TikTok sellers** (fashion, thrift, beauty, food, phone/gadget vendors) — sales depend
   on looking established; they post daily.
3. **Creators, skit makers, artists and their managers** — launches (song, skit, EP) need a strong
   first hour of engagement.
4. **Event promoters, churches/ministries with YouTube, authors, real-estate agents, coaches.**

### The offer ladder

| Step | Offer | Goal |
|---|---|---|
| 1 | **Free trial** — 5 likes + 2 comments, proof for each | See it's real |
| 2 | **Starter order** on the *same post* (one tap from the trial success page/dashboard) | First payment |
| 3 | **Reorder** for the next post | Second payment — where profit is |
| 4 | **Agency price / monthly plan** (not built yet — see §6) | Recurring |

### Message angles (all true, all testable)

| # | Angle | One-line hook |
|---|---|---|
| 1 | Try before you pay | "See it work before you pay a kobo." |
| 2 | Proof, not promises | "Every like has a screenshot behind it." |
| 3 | Bot-burned | "Bought followers, got zero reach? That's the bots." |
| 4 | Launch moment | "Don't launch to silence — the first hour decides reach." |
| 5 | Comments that read like customers | "40 comments that say 'Nice one 🔥' aren't social proof." |
| 6 | Safety net | "Anything we don't deliver in 5 days is refunded." |
| 7 | Local | "Built in Nigeria. Pay in naira. From ₦5." |

**Approved claims you can make today:** real, verified people · screenshot proof for every
engagement · checked automatically for authenticity and duplicates · live tracking on a dashboard
· free trial of 5 likes + 2 comments · no card needed for the trial · 5-day refund on undelivered
work · prices from the live "from ₦X" · pay in naira via Paystack.

**Do not say (yet):** "1,200+ engagers", any payout total, any client result or testimonial that
isn't real and permitted, "guaranteed not to be flagged", "no risk", "instant".

### Channel playbook (client side)

**1. Direct outreach on WhatsApp/DM (highest conversion, zero cost).** 10–15 personalised messages a
day to people you can name. Scripts:

*Business owner (Instagram seller):*
> Hi {name}, I saw your page — the {product} photos are great. Quick one: I run Primeloop. We get
> real people to like and comment on posts, and every one comes with a screenshot. I'd like to do
> a free test on one of your posts so you can see it for yourself — no card, no strings. Want me to
> send the link? primeloop.app/try?platform=instagram

*Social media manager (B2B):*
> Hi {name}, you handle a few brands' pages, right? I built Primeloop for managers who need real
> engagement without bot risk. Try it free on one client post (5 likes + 2 comments, with proof).
> If your client likes what they see, I'll set you up with agency pricing. primeloop.app/try

*Follow-up after 24h if no reply:*
> Just checking the free test didn't get buried 🙂 It takes 1 minute — link again: {link}

**2. WhatsApp Status + groups.** One value-first Status per day (see content pillars, §5). In groups
you're already in: answer questions first; mention the free trial only when relevant.

**3. Organic short video (TikTok / Reels / Shorts).** Educational, not salesy: "3 ways to spot fake
engagement", "why your reach is dead", "I tested a bot panel vs real people — here's the analytics".
Link in bio → `/try`. This is where trust and search discovery compound.

**4. Communities** — Nigerian SME / social-media-marketing / fashion-vendor / creator groups on
Facebook and WhatsApp, X "marketing Twitter". Value first, link second, respect each group's rules.

**5. Partnerships** — recruit 5–10 social media managers as "partners": they get a referral link and
agency pricing (§6); you get recurring volume.

**6. Search (slow, compounding).** Pages like "how to get real Instagram engagement in Nigeria" and
"why bought followers kill your reach" — the free trial is the call to action.

**7. Paid social — experiment only** (see §0). If you test: separate ad account and portfolio,
honest creative that promotes the *free trial and proof*, ₦3,000–₦5,000/day cap, and be ready for
disapproval. Optimise for the **StartTrial** event (the site fires it on `/try` success). Judge it
by the rule in §2.

### Trial → paid → recurring (the part that makes money)

The trial success screen and client dashboard already show "Order more on this post" pre-filled.
Add human follow-up, because most people won't act alone:

| When | Message (WhatsApp if they gave a number, otherwise email) |
|---|---|
| Trial delivered | "Your 5 likes + 2 comments are done — did you see the proof on your dashboard? Want 30 likes + 5 comments on the same post for ₦{price}? Link: {prefilled}" |
| +24h | "Your post is at {n} likes now. Launching another one this week? We can do the same for it." |
| +7 days | "Most of our regulars order before every launch or sale. Want me to set you up so it's one tap?" |

Track: trial→paid %, paid→second order %, days between orders. Second-order rate is your real
health metric.

---

## 4. Winning engagers

### Who to go after

1. **NYSC corps members and recent graduates** — free time, need income, on their phones all day.
2. **University students** — class and hostel WhatsApp groups spread fast.
3. **Side-hustle communities** — Telegram/WhatsApp/X/TikTok "make money online" audiences (be honest
   with them; they've been burned).
4. **Stay-at-home parents, small vendors between customers, ride-hailing/keke drivers waiting on a
   trip.**

### The honest hook

Most "earn from your phone" ads are vague and get ignored. Yours can be **specific**:

> Like ₦3.50 · Comment ₦8.50 · Follow ₦19 — paid per task, every Friday, straight to your bank.

Check the live rates on `/admin/pricing` before publishing; only quote what's true that week. Always
add: *tasks depend on how many clients order — more clients means more tasks.* Never promise a
weekly total. If you show an example, label it "example, not a guarantee" (the `/join` calculator
already does).

### Message angles

| # | Angle | Hook |
|---|---|---|
| 1 | You already do this | "You already like posts. Get paid for it." |
| 2 | Transparent pay | "See what every task pays before you sign up." |
| 3 | Reliable | "Paid every Friday — straight to your bank or Opay." |
| 4 | No barrier | "No experience. No money to start. 2 minutes to register." |
| 5 | Refer friends | "Share your link. Earn when they do 10 tasks." |

### The engine: referrals + real proof

- **Real payout proof beats every designed ad.** After the first real Friday payout, ask 5 engagers
  (with consent, account details blurred) for a screenshot or 20-second video. Pay a small thank-you
  bonus and say so ("paid testimonial") — undisclosed incentives erode the trust you're selling.
- **Referral link is live for everyone**, but the ₦200 bonus only pays out if the *referrer* is
  Gold/Platinum (checked when the referred engager reaches 10 approved tasks). **Decision for you:**
  making the bonus available to *all* referrers is probably your cheapest growth lever — ₦200 per
  active engager is far below any paid channel. It's a one-line change; say the word.
- **Campus/corps ambassadors:** 1 per school/camp, a ₦-per-verified-signup arrangement using the
  same referral link.

### Activation funnel (where engagers leak)

`Sign up → pass onboarding test → add bank details → first approved task → first Friday payout`

| Step | Target | If it leaks |
|---|---|---|
| Sign up → onboarding test within 24h | 60% | WhatsApp nudge with the exact test link |
| Onboarding passed → bank details | 80% | Banner is already on their dashboard; add a nudge |
| Bank details → first approved task within 48h | 70% | Make sure tasks exist (Rule 1) |
| First approved → first payout received | 95% | Payout day must never fail (see GETTING_STARTED: turn off transfer OTP) |

The first payout notification ("You've been paid ₦X") is the moment engagers become recruiters.

### Channel playbook (engager side)

1. **WhatsApp Status + groups + broadcast** — your personal network first; then ask each engager to
   post their own link once.
2. **TikTok / Reels organic** — casual, phone-filmed "how I do tasks" and "how payouts work" clips
   from *real* engagers. Polish reads as an ad.
3. **Campuses + NYSC camps** via ambassadors.
4. **Micro-influencers** in side-hustle/student niches — pay per verified signup, disclose.
5. **Paid ads for engager recruitment — low priority.** "Earn money" ads face their own restrictions
   on income claims, and supply isn't your bottleneck if referrals work.

---

## 5. Content pillars (organic, weeks 1–4)

Post daily on WhatsApp Status and 4–5×/week on TikTok/Instagram. Rotate — repeating one graphic is
what makes an account feel like a bot panel.

| Pillar | Example | Cadence |
|---|---|---|
| Real proof | Blurred payout alert or a delivered-trial screenshot **(real ones only)** | Every Friday |
| How it works | 20-sec screen recording: paste link → engagers do it → proof arrives | Weekly |
| Spot the fake | "3 checks that show if a page's engagement is bought" | Weekly |
| Engager story | A real engager on why they joined (consented) | Weekly |
| Bot panel vs real | The comparison table from the homepage as a carousel | Weekly |
| Behind the scenes | You reviewing proof, catching a fake screenshot | 1–2×/week |

### Video scripts (15–30 sec, film on a phone)

**Client — "The 7-like test"** (hook in 2 sec)
1. *On screen:* your own post at 0 likes. *Voice:* "I asked seven real people to like and comment on
   this. No bots. Watch."
2. *Screen-record:* dashboard progress bar moving; each engagement's screenshot.
3. *Voice:* "Every one has proof. It's free to try — link below."
4. *CTA card:* "primeloop.app/try"

**Client — "Why your reach is dead"**
1. "Bought followers? Here's why your posts stopped reaching anyone."
2. Show analytics: followers up, engagement rate near zero.
3. "Real people engage. Bots don't. Try the difference free — link in bio."

**Engager — "What ₦___ looks like, task by task"** *(use real rates, real numbers)*
1. "Here's exactly what each task pays on Primeloop."
2. Screen-record the dashboard task list showing prices.
3. "Paid every Friday. Sign up takes 2 minutes. Tasks depend on how many clients order."

**Engager — "My first Friday payout"** *(only after a real engager films their real alert)*

---

## 6. Recurring revenue — what to build after launch

Ranked by return on effort. Only #1–#2 are needed to start.

| # | Feature | Why |
|---|---|---|
| 1 | **"Order again" one-tap** on every past order (the trial flow already prefills; extend it) | Removes the friction on order #2 |
| 2 | **Trial/order follow-up messages** (WhatsApp template + email) — see §3 | Most people need a nudge |
| 3 | **Starter bundles** (e.g. 30 likes + 5 comments for a fixed price) | Bigger first order |
| 4 | **Agency price list + partner referral link** | Recurring volume from managers |
| 5 | **Monthly plan** via Paystack subscriptions ("boost every post I make") | Predictable revenue |

---

## 7. Four-week runway

**Before you tell anyone (do these first — none are optional)**
- [ ] Run `supabase/migration_11_trials_and_payout_tracking.sql` in Supabase, *then* deploy.
- [ ] Paystack: Live keys, webhook set to receive all events, **transfer OTP turned off**, balance
      topped up for Friday payouts.
- [ ] You are a super-admin; onboarding test posts are set for every platform you'll promote.
- [ ] Custom SMTP set up (login emails and trial tracking links will hit Supabase's low free limit).
- [ ] WhatsApp template approved — or accept alerts won't send and tell early engagers to open the app.
- [ ] Place one real order and one real free trial yourself, end to end, on a phone.
- [ ] Ads: **separate Business Portfolio** created if you'll test paid.

**Week 1 — seed supply (no client promotion yet)**
Recruit 25+ verified engagers per platform from your own network; get them through onboarding,
bank details, and a few practice tasks. Goal: Rule 1 satisfied.

**Week 2 — soft-launch demand**
10–15 personalised outreach messages a day (§3), WhatsApp Status daily, 5 social-media-manager
conversations. Every trial: watch it deliver personally and message the client.

**Week 3 — turn proof into content**
First real Friday payout → collect proof → publish. Ask engagers to post their referral link.
Recruit 3–5 ambassadors. Start the organic video routine.

**Week 4 — measure, then decide on paid**
Compute per channel: trial sign-ups, trial→paid, cost per trial, second-order rate, fill time.
Apply the §2 rule. Only then decide whether a small, separate-account paid test is worth it.

---

## 8. What to measure (and what to do about it)

| Metric | Where | Healthy | Action if not |
|---|---|---|---|
| Trial sign-ups by source | GA4 (`generate_lead`), UTM | Rising week on week | Double down on the best source |
| Trial → first paid order | Admin + orders | ≥ 15% | Add follow-up (§3); check delivery speed |
| Time to first engagement on a trial | Task board | < 30 min | Recruit/activate engagers (Rule 2) |
| Second-order rate | Orders | ≥ 30% of first-time buyers | Reorder flow + nudges |
| Trials used vs weekly cap | `/admin/accounting` | Below cap | Raise `TRIAL_WEEKLY_CAP` only if conversion holds |
| Engager activation (§4 table) | Engagers page | Targets above | Fix the leaking step |
| Friday payout success | Payout results | 100% paid | Balance, OTP, bank details |

**UTM convention** so GA4 tells you what works:
`primeloop.app/try?platform=instagram&utm_source=whatsapp&utm_medium=dm&utm_campaign=seller-outreach`
Use `utm_source` = whatsapp / tiktok / instagram / partner-{name}; `utm_medium` = dm / status / bio / group.

---

## 9. Creative assets

- **Ad and status graphics** (feed, story, WhatsApp Status) for both audiences: run `/design` in
  Claude Code and paste the brief in **Appendix A** — it produces exportable PNG artboards. Only
  real claims appear in them; the payout-proof template has an empty frame for a *real* screenshot.
- Existing `/ad-creatives` SVGs contain the old copy — retire them or update before use (they may
  still show "1,200+").
- Tools worth connecting: **Canva** (final exports), **Metricool** (scheduling), **Riverside/Tella**
  (real testimonial/how-it-works video). AI-generated people are a poor fit for a "real people, not
  bots" brand.

---

## 10. Honesty rules (they're your moat)

1. Never publish a number you can't show. Placeholders in `PRODUCT.md` (**1,200+ engagers**,
   **₦29,150 payout**) are not launch-safe until true.
2. Every testimonial, payout and client result is real, permitted, and disclosed if incentivised.
3. Earnings are "per task" and "example", never "you will earn".
4. Deliver the trial like a paying customer — it's your best advertisement.
5. If something goes wrong (late delivery, rejected proof), tell the client first.

---

## Appendix A — `/design` brief (paste this after running `/design`)

**Brand:** Primeloop — real Nigerian engagers, never bots. Trust-first, warm, confident; never
loud, salesy or "get rich". Deep navy `#1c2340` (text/backgrounds), signal orange `#e0632b`
(one accent per artboard, used for the single action), paper `#f4f5f9`, white cards, live-green
`#1d7a4c` for "verified/live" marks. Display headlines in **Fraunces** (bold, tight), body in a
clean sans, small data labels in **IBM Plex Mono**. Logo: the orange loop mark on navy. Every
artboard has one message, one action, generous space, no stock-photo gloss, no emoji as icons,
no gradient text, no fake UI numbers. Real-person imagery only if supplied — otherwise use
typographic and interface-based layouts (a phone frame showing the dashboard/proof).

**Sizes:** feed 1080×1080 · portrait feed 1080×1350 · story / WhatsApp Status 1080×1920.

**Claims allowed (verified true):** real verified people; screenshot proof for every engagement;
free trial = 5 likes + 2 comments; no card for the trial; 5-day refund on anything undelivered;
prices from ₦5; paid every Friday; register in 2 minutes; per-task rates (confirm on
`/admin/pricing` first). **Not allowed:** "1,200+", any payout total, testimonials, "no flag risk".

### Clients
1. **Feed 1080×1080 — the trial.** Headline: *See it work before you pay a kobo.* Sub: *5 real
   likes + 2 real comments on your post. Proof for every one.* Visual: a post card with a like
   counter mid-tick and a green "verified" screenshot chip. CTA: *Try it free →* `primeloop.app/try`.
2. **Story 1080×1920 — 3 steps.** *Paste your link → Real people do it → See the proof.* Three
   stacked cards (numbered because it's a sequence). CTA: *Free trial — primeloop.app/try*.
3. **Feed 1080×1080 — bot panel vs real.** Two columns, "Typical bot panel" vs "Primeloop":
   *Automated / fake accounts* vs *Real, verified people*; *None* vs *Screenshot proof*;
   *"Trust us"* vs *Live dashboard*; *Rarely refunded* vs *Undelivered = refunded*. Headline:
   *Real people, not a bot panel.*
4. **Portrait 1080×1350 — launch moment.** Headline: *Don't launch to silence.* Sub: *The first
   hour decides reach. Get real people on your post — free to try.* CTA: *Try it free →*.
5. **Story/Status 1080×1920 — text-forward for WhatsApp.** Big type on navy: *Free test: 5 likes +
   2 comments on your post. Real people. Proof for every one.* Small: *primeloop.app/try*.

### Engagers
6. **Feed 1080×1080 — transparent pay.** Headline: *See what every task pays.* A clean price list
   card (Like, Comment, Follow — real current rates, Plex Mono numerals). Sub: *Paid every Friday,
   straight to your bank or Opay.* Small print: *Tasks depend on how many clients order.* CTA:
   *Join free →* `primeloop.app/join`.
7. **Story 1080×1920 — your first payout.** *Sign up (2 min) → Pass a quick test → Do tasks, upload
   proof → Get paid Friday.* Four numbered steps. Small print as above.
8. **Feed 1080×1080 — payout-proof template.** Headline: *Paid on Friday.* A large empty phone
   frame labelled in the file "REPLACE WITH A REAL, BLURRED PAYOUT ALERT" (must be removed or
   filled before export). CTA: *Join free →*. Never fill this with an invented amount.
9. **Story 1080×1920 — corpers & students.** *You're already on your phone. Get paid for the
   likes and comments you'd do anyway.* Same pay-list card as #6. CTA: *Join free →*.

### Caption copy (primary text)
**Client A:** "Bought followers, zero reach? That's the bots. Primeloop gets real people to like and
comment on your post — and every one comes with a screenshot. Try 5 likes + 2 comments free.
No card. primeloop.app/try"
**Client B:** "Launching this week? Don't launch to silence. See real people engage with your post
before you pay a kobo → primeloop.app/try"
**Engager A:** "Like ₦3.50 · Comment ₦8.50 · Follow ₦19 — paid per task, every Friday, to your bank
or Opay. Tasks depend on client orders. Register in 2 minutes: primeloop.app/join"
*(Confirm rates on `/admin/pricing` before posting.)*
