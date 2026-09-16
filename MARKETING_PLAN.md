# Primeloop Marketing Plan

## Friday launch plan (target: 18 Sept 2026)

Two days out, a paid-ad blitz isn't realistic — Meta ad review, WhatsApp template
approval, and creative testing all need lead time you don't have. Friday should be a
**soft launch to your own network**, matching the "Week 1–2" phase below, not the paid
phase. That's not a downgrade: soft-launch testimonials and payout screenshots become
your best-performing paid creative later anyway (see Distribution sequence).

### Go/no-go checklist — confirm these before telling anyone the site is live
- [ ] You've made yourself an admin (README, `GETTING_STARTED.md` Step 9) — you can't
      review submissions or manage anything without this.
- [ ] Real onboarding test posts are set at `/admin/onboarding-tests` — without these,
      the first engagers who sign up can't pass verification and will bounce.
- [ ] Custom SMTP is configured — Supabase's free-tier email sending has a strict hourly
      limit; on launch day, signup confirmations and magic links are exactly what will
      hit it first.
- [ ] Paystack is switched from Test keys to Live keys, and you've placed one real test
      order yourself end-to-end (order → pay → task appears → engager completes →
      you get notified → weekly payout script picks it up).
- [ ] WhatsApp task alerts: if the Meta template isn't approved yet, that's fine — it
      fails silently and safely — but don't promise instant WhatsApp alerts in launch
      copy until it's confirmed working.
- [ ] Bank details reminder banner tested — an engager who can't get paid on the first
      Friday because they never filled in bank details is your worst possible first
      impression.

### Friday itself
1. **Morning**: Post to your own WhatsApp Status + any WhatsApp groups you're already in
   (family, business, community) — both the client link (`/`) and the engager link
   (`/join`). This is your highest-trust, zero-cost channel and it's also literally the
   channel your own product pushes engagers toward (`components/WhatsAppButton.js`).
2. **Same day**: One Instagram/Facebook feed post per side (client + engager), using the
   existing SVG creatives in `/ad-creatives` (convert to PNG first — see below). Pin the
   engager one; that's the side you need volume on before client orders can be fulfilled.
3. **Seed engager supply before client demand**: get at least 15–20 real engagers
   registered and onboarding-test-passed *before* you push the client side hard — an
   empty task board on a client's first order is the fastest way to lose their trust on
   day one. The order of operations matters more than the exact ratio.
4. **Personal asks, not just posts**: message 10–15 people directly (not just a public
   post) asking them to register as engagers or place a small test order. Direct asks
   convert far better than a feed post at zero audience size.
5. **Capture everything**: the first real payout screenshot, the first real client
   testimonial, the first "I got paid!" WhatsApp reply — screenshot all of it
   immediately. This is the raw material for every ad creative in weeks 3+.

## Ad creatives
Three ready-to-use graphics in `/ad-creatives`:
- `client-feed-ad-1080x1080.svg` — Facebook/Instagram feed, client acquisition
- `engager-feed-ad-1080x1080.svg` — Facebook/Instagram feed, engager recruitment
- `engager-story-ad-1080x1920.svg` — Facebook/Instagram Story, engager recruitment

**Before uploading to Meta Ads Manager**: Meta requires JPG/PNG, not SVG. Open each file in
Canva (free, drag-and-drop import) or any online SVG-to-PNG converter, export at the same
dimensions, and upload the PNG/JPG instead.

---

**Important — on launch day, none of these are true yet.** "1,200+ engagers" and "₦29,150
paid" are sanctioned *placeholders* (see `PRODUCT.md`) for once the platform has real
volume — not for day one, when the real number is close to zero. Using Variation C or
Variation B (both social-proof numbers) in your actual Friday launch posts would be
exactly the "fake numbers" problem Primeloop exists to be the alternative to, and it's
now outbound advertising, not just website copy — a bigger honesty exposure than what we
already fixed on the site. **For launch week, use Variation A or B (price-led /
income-led) on each side instead — they make no unverifiable claims.** Switch to the
social-proof variants only once "1,200+" and "₦29,150" (or whatever the real current
numbers are) are actually true, and swap in your real number at that point, not before.

## Ad copy — Client acquisition campaign

**Variation A (price-led)**
> Headline: Real Engagement From ₦5. No Bots.
> Primary text: Tired of bot panels that get your page flagged? Primeloop gives you real
> likes, comments, shares and follows from trained Nigerian engagers — and you watch it
> happen live on your own dashboard. 100% money-back guarantee.
> CTA: Order Now

**Variation B (trust-led)**
> Headline: No Bots. No Fake Accounts. Just Real People.
> Primary text: Every engagement on Primeloop comes from a real, verified engager — never a
> bot. That means no risk of your page getting flagged, and comments that actually read like
> real customers. See your order progress in real time.
> CTA: See Packages

**Variation C (social proof-led)**
> Headline: 1,200+ Real Engagers. Live Tracking. Real Results.
> Primary text: Watch your engagement grow in real time, powered by a trained team of 1,200+
> Nigerian engagers across Facebook, Instagram, TikTok, YouTube and X. Starting from ₦5 per
> engagement.
> CTA: Get Started

---

## Ad copy — Engager recruitment campaign

**Variation A (income-led)**
> Headline: Earn From Your Phone. Get Paid Every Friday.
> Primary text: Like, comment, share and follow — tasks you probably already do for fun. No
> experience, no startup cost. Register in 2 minutes and start earning today.
> CTA: Start Earning

**Variation B (proof-led)**
> Headline: This Week, One Engager Earned ₦29,150.
> Primary text: Real payouts, paid automatically to your bank every Friday. Join 1,200+
> people already earning from Facebook, Instagram, TikTok, YouTube and X — right from their
> phone.
> CTA: Join Now

**Variation C (simplicity-led)**
> Headline: No Experience. No Startup Cost. Just Your Phone.
> Primary text: Complete simple tasks — likes, comments, shares, follows — and get paid
> weekly. It takes 2 minutes to register and you can start browsing tasks immediately.
> CTA: Register Free

---

## Targeting recommendations (Meta Ads Manager)

**Client campaign:**
- Interests: social media marketing, small business owners, content creator tools, Instagram
  for Business, Facebook for Business
- Behaviors: "Small business owners," admins of Facebook Pages
- Age: 20–45 · Location: Nigeria (start with Lagos, Abuja, Port Harcourt if budget is tight,
  expand nationally once the funnel is proven)
- Placement: Facebook + Instagram feed and Stories, automatic placements once you have data

**Engager campaign:**
- Interests: "make money online," side hustle content, mobile data/airtime top-up apps,
  Opay/Palmpay/Moniepoint (financial app users are primed for "earn from phone" offers)
- Age: 18–35 · Location: Nigeria, broad (this audience is nationwide, don't over-narrow)
- Placement: Facebook + Instagram feed and Stories; consider Audience Network for volume once
  the offer is validated

## Budget allocation (starting point)
Split roughly 60% client acquisition / 40% engager recruitment initially — you make money on
the client side, but you need enough engager supply to actually deliver, so don't starve
recruitment entirely. Rebalance based on which side becomes your bottleneck once real data
comes in (watch your admin task board: are tasks sitting unfilled because engager supply is
too low? Shift budget toward recruitment. Are engagers idle waiting for tasks? Shift toward
client acquisition).

## Distribution sequence
1. **Week 1–2**: Soft launch to your existing WhatsApp community (both sides). Collect real
   testimonials and payout screenshots — these become your best-performing creative later,
   almost always outperforming designed graphics.
2. **Week 3–4**: Small paid test budget (₦5,000–10,000/day total) split across the two
   campaigns above, three creative variations each. Let Meta's algorithm find your audience;
   don't touch it for at least 3–4 days per test.
3. **Week 5 onward**: Kill underperforming variations, scale the winners, layer in retargeting
   (people who visited but didn't order/register — needs the Meta Pixel, already wired into
   the site) and the referral program (already built — Gold/Platinum engagers have a
   shareable link on their dashboard).

## Measurement
- **Vercel Analytics** (already installed): page views, which pages people actually visit
- **Meta Pixel** (already wired in code, activates once you add your Pixel ID): tracks
  engager signups (Lead) and completed client orders (Purchase) automatically
- Watch cost-per-signup and cost-per-order weekly; a campaign that isn't converging on a
  reasonable cost within 2 weeks of real spend should be paused and rethought, not left running
  on hope.

## Organic content calendar (weeks 1–4, before paid spend starts)

Post daily on WhatsApp Status (free, highest-trust) and 4–5x/week on Instagram/TikTok/Facebook.
Rotate through these content pillars rather than posting the same ad graphic repeatedly —
repetition without variety is what makes an account feel like a bot panel itself:

| Pillar | Example post | Cadence |
|---|---|---|
| **Real payout proof** | Screenshot of an actual bank/Opay alert (blur account numbers), "Paid out this Friday 🎉" | Every Friday, same day as the real payout run |
| **Real client result** | Before/after screenshot of a client's post engagement count, with their permission | 2x/week |
| **How-it-works explainer** | Short video/carousel: order → real engager does it → screenshot proof → client watches live | Weekly |
| **Engager spotlight** | A real engager (with consent) sharing why they joined / what they use the money for | Weekly |
| **Myth-busting / bot-panel comparison** | The exact comparison table already on the site (`/`), reformatted as a carousel | 1x/week |
| **Behind-the-scenes** | You reviewing submissions, the admin dashboard, "here's how we catch fake proof" | 1–2x/week |

**Platform notes for Nigeria specifically:**
- **WhatsApp Status + Groups**: your single highest-converting, zero-cost channel — treat
  it as primary, not an afterthought to Instagram.
- **TikTok**: engager-recruitment content (the "earn from your phone" pitch) performs
  best here — short, casual, phone-filmed, not polished. Polish reads as an ad; casual
  reads as a real person.
- **Instagram**: better for client acquisition — business owners and creators are more
  likely to be here evaluating a service than scrolling TikTok for one.
- **Facebook Groups**: join 5–10 Nigerian small-business / social-media-marketing /
  side-hustle groups and answer questions genuinely before ever posting a link — group
  admins remove obvious self-promotion fast, but a helpful real answer with a link at the
  end usually survives.

## Creative production tooling

Recommended connectors to add in this session (search results below), roughly in order
of what launch week actually needs:

1. **Canva** — turns the existing `/ad-creatives` SVGs and future briefs into polished,
   on-brand PNG/JPG ad creative directly, without the manual "open in Canva and
   re-export" step the current plan describes. Also handles Instagram/TikTok/Story
   sizing presets natively.
2. **Adobe for Creativity** — generative image editing and brand-asset management
   (Firefly-backed) for higher-end creative once you're past hand-made launch graphics —
   useful for the paid-ad phase (weeks 3+) when creative quality starts affecting cost-per-click.
3. **Metricool** — schedule posts across Instagram/TikTok/Facebook from one place and see
   best-time-to-post data, so daily posting doesn't depend on you remembering to open
   each app.
4. **Riverside or Tella** — for the "how it works" and "engager spotlight" video pillars:
   both are recording/editing tools for *real* talking/screen-recorded video (with
   auto-captions, brand overlays, smart cuts), not AI-generated video. That fits
   Primeloop's brand better anyway — a synthetic AI avatar pitching "real people, not
   bots" undercuts its own message.
5. **AdWhispr Ads / TikTok for Business** — once you reach the paid-ad phase, these let
   you research competitor (bot-panel) ads and launch/manage Meta and TikTok campaigns
   from chat instead of the Ads Manager UI directly.

There's no pure AI image/video generator (Midjourney/Runway-style) connector in the
registry today — Canva's and Adobe's built-in AI generation tools are the closest fit and
both are connectable now. The **`design` skill already available in this session** can
also draft new static ad concepts (posters, social graphics) directly as a canvas you can
then hand to Canva for final export.

## Building trust with a free trial for new clients

See the **New-client trial engagements** section for the mechanic design, cost math, and
abuse guards — this is a genuinely strong trust lever for a brand whose whole pitch is
"see it's real before you commit," and costs are small enough to run alongside launch.

## New-client trial engagements

**The idea**: give every genuinely new client a small number of free engagements on a
real post, before they pay anything, so they can watch real proof arrive the same way a
paying client would — the strongest possible trust demo for a "no bots, no fake numbers"
brand, and one your bot-panel competitors structurally can't copy (their "engagement"
would be as fake for a free trial as a paid one).

**Suggested size**: 5 likes + 2 comments on one post, one platform, once per client.
- Cost: 5 × ₦3.5 (cheapest real payout, Facebook/Instagram like) + 2 × ₦8.5–9 (comment) ≈
  **₦34–35.50 per trial** — genuinely negligible per client, and comments matter more
  than likes for the trust demo (a real, readable comment is much more convincing proof
  of "a real person did this" than a like ever is).
- At even 200 trials in launch month, total cost is ≈ ₦7,000 — cheap customer acquisition
  compared to any paid ad spend, and it's the highest-trust acquisition channel you have.

**Abuse guards (all reuse infrastructure already in the codebase):**
- One trial per **client record** — check the existing `clients` table by email before
  granting; an existing client (has ordered before) doesn't get a second trial.
- One trial per **post link** — check `orders.post_link` history so the same post can't
  farm multiple "new" trials under different emails.
- Rate-limit by IP using the existing `lib/rateLimit.js` (already backs order creation
  and signup) — caps how many trials any one connection can request per hour/day.
- Still run the trial's post link through the existing `lib/checkPostLink.js` domain +
  reachability check before creating the task — a trial task is still a task, and the
  same "does this link even work" guard should apply.
- Consider a simple **global weekly cap** (e.g. 50 trials/week) so a viral moment can't
  create an unbounded engager-payout bill overnight — easy to raise later once you trust
  the real abuse rate.
- No follow/subscribe actions in the trial bundle — those are the highest-payout,
  capacity-constrained actions (see the earnings-calculator discussion), and abuse there
  is more damaging (a fake "trial" follow permanently consumes real follow capacity on
  someone else's target account).

**How it would plug into the existing product** (implementation sketch, not yet built):
a "Try it free" flow that takes an email + post link like the real order form, runs the
same platform-link validation already on the order form, then creates a task directly
(skipping Paystack) tagged as a trial — visible to engagers exactly like a paid task, so
the proof they generate is exactly as real. The admin task board and accounting page
would want a trial vs. paid filter so trial cost stays visible as its own line, not mixed
into real revenue numbers.

This is a real feature, not a copy change — happy to scope and build it once launch-week
priorities are settled, since it competes for the same two days as the go/no-go checklist
above.
