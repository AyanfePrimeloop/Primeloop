# Primeloop Marketing Plan

## Ad creatives
Three ready-to-use graphics in `/ad-creatives`:
- `client-feed-ad-1080x1080.svg` — Facebook/Instagram feed, client acquisition
- `engager-feed-ad-1080x1080.svg` — Facebook/Instagram feed, engager recruitment
- `engager-story-ad-1080x1920.svg` — Facebook/Instagram Story, engager recruitment

**Before uploading to Meta Ads Manager**: Meta requires JPG/PNG, not SVG. Open each file in
Canva (free, drag-and-drop import) or any online SVG-to-PNG converter, export at the same
dimensions, and upload the PNG/JPG instead.

---

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
> Headline: This Week, One Engager Earned ₦9,150.
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
