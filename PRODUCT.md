# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two-sided marketplace, plus an internal admin/founder role:

- **Clients** — creators and small businesses in Nigeria who want real social media engagement (likes, comments, shares, follows) on Facebook, Instagram, TikTok, YouTube, and X, without risking their account by using bot panels. They place an order, pay via Paystack, and track delivery live on a dashboard.
- **Engagers** — individuals in Nigeria completing engagement tasks from their phone for pay (no experience or startup cost required). They register, pass an onboarding verification test per platform, browse/complete tasks, submit screenshot proof, and get paid automatically every Friday. Higher tiers (Gold/Platinum) unlock early task access and a referral bonus.
- **Admin/founder** — currently a single non-technical founder (with a super-admin tier supporting additional admins later) who manages pricing, reviews flagged submissions and post links, manages engagers, and monitors payouts/accounting. Builds and maintains the product primarily through conversational AI assistance (chat, then Claude Code) rather than writing code directly.

## Product Purpose

Primeloop is a marketplace that matches Nigerian social media engagement demand (clients) with engagement supply (engagers), replacing bot panels with verified real people. Success means: clients get real, authentic-looking engagement delivered live without flag risk; engagers get simple, reliable income paid weekly; the business earns a margin on the spread between client price and engager payout.

## Positioning

"Real people, not bots." The mechanism a bot panel cannot copy: every engagement is completed by a verified human engager who submits screenshot proof, checked automatically for authenticity and duplicates; clients watch delivery progress live; a 100%-money-back guarantee covers any undelivered portion after 5 days. This directly targets the client fear of getting an account flagged/banned by platforms for using bot engagement.

## Operating Context

- Payments: Paystack (client checkout, engager bank transfer payouts).
- Backend: Supabase (auth, database with row-level security, screenshot storage).
- AI verification: Anthropic API checks submitted screenshots for authenticity.
- Automated weekly payout every Friday via Vercel Cron (manual fallback script exists).
- WhatsApp task alerts notify eligible engagers automatically when a task opens (capped at 250 recipients/task for now).
- Referral system: Gold/Platinum engagers get a shareable signup link; reaching 10 approved tasks by a referral triggers a bonus in the referrer's next payout.
- Post-link automated checking gates whether a task goes live to engagers or routes to an admin "Link reviews" queue.
- Admin operates via shared nav across `/admin/*` pages (tasks, engagers, review queue, pricing, accounting, onboarding tests, verification settings, admins/2FA).
- Currency is Naira (₦); market is Nigeria specifically (not general/global).

## Capabilities and Constraints

- Multi-role login: one email can hold more than one role (e.g. engager + client); users with more than one role choose a dashboard at login.
- Conflict-of-interest rule: an account cannot see or claim tasks from its own client orders.
- Rate limiting on order creation and engager signup; server-side validation on uploads and contact info (not just client-side trust).
- Two-factor auth (TOTP) enforced for admin login; only super-admins can invite admins or view financial/accounting data.
- Supabase's free-tier email sending is rate-limited; real deployment needs custom SMTP or expect delivery failures on signup/reset/magic-link emails.
- WhatsApp alerts require a Meta-approved message template before they can actually send (pending Meta review as of this writing).
- **Pre-launch**: the app is built and functional but not yet serving real clients/engagers at general-use scale — currently in a testing phase before wider rollout.

## Brand Commitments

- Name: **Primeloop**. Logo is a circular loop mark (navy `#1c2340` background, orange `#e0632b` accent ring/arrow) used consistently across public and dashboard pages (`components/Logo.js`).
- Tagline/voice: "No Bots" / "Real people. Real engagement." — direct, trust-first, anti-bot-panel framing throughout copy.

## Evidence on Hand

- `MARKETING_PLAN.md` and `/ad-creatives` contain ad copy and graphics for both acquisition campaigns (clients and engagers).
- Marketing figures such as "1,200+ engagers" and payout examples (e.g. "₦29,150 this week") are **placeholders** to be made accurate once the app is live to general use, not just testers — do not extend or add further fabricated stats beyond what's already placeholder-flagged; treat these two as the sanctioned placeholder figures until the founder replaces them with real numbers.
- No real customer testimonials, case studies, or product photography exist yet (README notes no real photography was sourced) — future visual work should not fabricate these.

## Product Principles

1. Authenticity over automation — every engagement must be traceable to a real, verified human action, never simulated.
2. Transparency builds trust — clients and engagers should always be able to see live, accurate status (order progress, payout history, verification status) rather than opaque promises.
3. Low friction for engagers — registration, onboarding, and earning should require no technical skill, no cost, and work well from a phone.
4. Reliability of money movement — payouts and refunds happen on a predictable schedule (weekly Friday payouts, 5-day refund window) and are enforced by the system, not manual follow-up.
5. Guard against gaming — systems (unique-page checks, follow-ledger, conflict-of-interest blocks, link checking) actively prevent both sides from exploiting the marketplace.

## Accessibility & Inclusion

Engager-facing pages (signup, dashboard, onboarding, task submission) must stay light and usable on low-end Android devices and slow/limited mobile data, since the engager audience is phone-first in Nigeria. This is a real product constraint, not just general best practice — avoid heavy assets or requirements (e.g. large images, aggressive JS) on these flows specifically.
