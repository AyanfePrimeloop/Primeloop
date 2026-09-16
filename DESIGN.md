---
name: Primeloop
description: Real social media engagement from verified Nigerian engagers — no bots.
colors:
  deep-navy: "#1c2340"
  deep-navy-ink: "#12172b"
  ink-soft: "#454b63"
  ink-mute: "#8388a0"
  paper: "#f4f5f9"
  card: "#ffffff"
  line: "#e3e5ee"
  line-strong: "#c9cce0"
  signal-orange: "#e0632b"
  signal-orange-deep: "#a3441c"
  live-green: "#1d7a4c"
  live-green-soft: "#e3f5ea"
  alert-amber: "#a3711c"
  alert-amber-soft: "#fbf1de"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(30px, 4.4vw, 46px)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.015em"
  title:
    fontFamily: "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label-mono:
    fontFamily: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.04em"
rounded:
  sm: "7px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "99px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  xxl: "44px"
components:
  button-primary:
    backgroundColor: "{colors.deep-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-accent:
    backgroundColor: "{colors.signal-orange}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.deep-navy-ink}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-cta:
    backgroundColor: "{colors.deep-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  card-surface:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
  badge:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.deep-navy-ink}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
---

# Design System: Primeloop

## Overview

**Creative North Star: "The Live Trading Floor"**

Primeloop's interface reads like a floor where real money and real proof move in real time: a pulsing live dot, tabular numbers that tick like a ticker, monospace feed rows that log exactly what just happened, and a deep navy trust bar that anchors the noise. Against that live-data texture sits a warmer, editorial layer — a serif display headline, rounded pill CTAs, soft gradients — so the system feels approachable to a first-time engager on a budget phone, not just precise enough for a client trusting it with a payment. Warm and credible, never cold or corporate; never playful or bot-panel-garish.

The system explicitly rejects: flat corporate SaaS sterility, novelty/cartoonish decoration, and anything that reads like the bot-panel competitors Primeloop is positioned against (loud, salesy, fake-urgency styling).

**Key Characteristics:**
- Deep navy authority paired with a warm orange signal color used sparingly for action and confirmation.
- Monospace typography marks anything "live" or data-like — feed rows, task IDs, eyebrow labels, timestamps.
- Fraunces serif carries the one or two big editorial moments per page (hero headline, a quoted testimonial).
- Cards are calm and mostly flat at rest; depth is used more deliberately going forward to lift primary and floating elements (see Elevation & Depth).
- No red/danger color exists in the system — negative or reject actions use the amber alert token, never a separate error red.

## Colors

The palette pairs an institutional navy with a warm orange signal, plus a status pair (green/amber) that never touches red.

### Primary
- **Deep Navy** (`#1c2340`): The trust color. Primary buttons, nav/trust bars, gradients anchoring hero sections, step-number badges. Used generously — it's the base of authority in the system.
- **Deep Navy — Ink** (`#12172b`): The deepest point of the navy gradient (hero backgrounds) and, doing double duty, the system's primary text color on light surfaces. One hex, two jobs: darkest background anchor and default ink.

### Secondary
- **Signal Orange** (`#e0632b`) / **Signal Orange — Deep** (`#a3441c`): The confirmation/action color. Reserved for the boldest CTA (`.cta-bold`, gradient navy→orange-deep), accent buttons, and small emphasis marks (case-study left border, hero glow). Never used for large background fields — it stays a signal, not a surface.

### Tertiary
- **Live Green** (`#1d7a4c`) / **soft** (`#e3f5ea`): The "this is really happening" color — the pulsing live dot, earnings figures, approve actions, the earnings calculator panel. Ties directly to the trading-floor metaphor: green means confirmed and moving.
- **Alert Amber** (`#a3711c`) / **soft** (`#fbf1de`): The system's only negative/warning color. Used for reject actions, pending-review badges, and caution states. **There is no separate red/danger token** — amber carries all negative signaling.

### Neutral
- **Ink Soft** (`#454b63`): Secondary body text, descriptions, lead paragraphs.
- **Ink Mute** (`#8388a0`): Tertiary text — timestamps, helper captions, disabled-adjacent labels.
- **Paper** (`#f4f5f9`): Page background.
- **Card** (`#ffffff`): Surface background for cards, sections, inputs.
- **Line** (`#e3e5ee`) / **Line Strong** (`#c9cce0`): Default hairline borders/dividers; the "strong" variant marks input borders and stronger separators (table header rules).

### Named Rules
**The No-Red Rule.** Negative, rejecting, or cautionary states are always Alert Amber, never a separate red. If a new state needs "danger," reach for `alert-amber` before inventing a new hue.

**The Signal, Not Surface Rule.** Signal Orange marks actions and confirmations (buttons, small accents); it never becomes a large background fill or fills more than a small fraction of any screen.

## Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** -apple-system / Segoe UI / Helvetica / Arial (system sans stack)
**Label/Mono Font:** IBM Plex Mono (with SFMono-Regular, Consolas fallback)

**Character:** A confident editorial serif for the few moments that need warmth and weight, a neutral system sans for everything read at length, and a monospace voice reserved strictly for anything live, timestamped, or ledger-like — so the reader learns to associate that typeface with "this is real, logged data."

### Hierarchy
- **Display** (700, `clamp(30px, 4.4vw, 46px)`, line-height 1.06, Fraunces): Hero headlines only (`.hero2 h1`). Max width ~520px so lines break with intent.
- **Title** (600, 16px, system sans): Section headers (`.section-head h2`), card titles.
- **Body** (400, 13px, line-height 1.6, system sans): Default paragraph and UI copy; lead paragraphs step up to 15px.
- **Label / Mono** (500, 11–12.5px, letter-spacing 0.04em, IBM Plex Mono, often uppercase): Eyebrow labels, live-feed rows, task IDs, live-tag badges — anything that should read as data rather than prose.
- Numeric stats (trust-bar figures, payout amounts) use `font-variant-numeric: tabular-nums` so figures don't jitter as they update.

### Named Rules
**The Mono-Means-Live Rule.** Monospace is never used for regular prose or headings — only for timestamped, logged, or numeric "this actually happened" content. If a label uses IBM Plex Mono, it should read like a data feed.

## Layout

Content sits in a centered column, `max-width: 1000px`, with `24px 20px 60px` outer padding (`.app`). Hero and trust-bar sections use full-width, generously-padded rounded blocks (`hero2`: `48px 44px`, `trust-bar2`: `20px 28px`) that break the column rhythm intentionally to signal "this is the important thing." Supporting content below the hero commonly splits into a two-column `1.5fr 1fr` main/side grid (`.grid-main-side`) or a 3-up grid (`.grid-3`) for package/step comparisons.

At `max-width: 700px`, layout collapses to single columns, hero padding tightens (`26px 18px` → headline drops to 21px), CTA rows stack full-width, and a sticky bottom CTA bar (`.sticky-cta`) appears once the visitor scrolls past the hero's own CTA. Because the engager audience is phone-first on constrained connections, mobile is the primary target, not an afterthought — verify every new pattern at this breakpoint first.

## Elevation & Depth

Currently a mostly-flat system: cards and sections sit on the page with a 1px `line` border and no shadow at rest (`.section`, `.proof-card`). Shadow currently appears only reactively — on hover (`.proof-card:hover`, `.cta-bold:hover`) or on a few floating/emphasized elements (the rotated live-proof widget, the sticky mobile CTA bar).

**Direction going forward:** lean into more deliberate, layered depth rather than staying flat-by-default. Use soft, diffuse shadows (in the spirit of `.hero2-widget`'s `0 24px 50px rgba(18,23,43,.10)`) to lift primary surfaces and important cards at rest, not only on interaction — depth should help establish what matters on a page at a glance, not just react to the cursor.

### Shadow Vocabulary
- **Lifted widget** (`box-shadow: 0 24px 50px rgba(18,23,43,.10)`): The live-proof widget's floating, slightly-rotated card — the model for "important and alive."
- **CTA glow** (`box-shadow: 0 10px 26px rgba(163,68,28,.28)`, intensifying on hover): The bold pill CTA — a shadow tinted with the accent color, not neutral black.
- **Hover lift** (`box-shadow: 0 10px 24px rgba(18,23,43,.08)` with `translateY(-3px)`): Proof cards and packages on hover.
- **Sticky bar** (`box-shadow: 0 -8px 24px rgba(18,23,43,.1)`): Upward shadow anchoring the fixed mobile CTA bar to the bottom of the viewport.

## Shapes

Corners are consistently rounded and scale with a component's importance: small controls (buttons, inputs, badgeless UI) use 7px; cards and sections use 12px; hero-level blocks use 16–20px; anything pill-shaped (the bold CTA, badges, the sticky CTA button) goes fully round at 99px. Borders are thin (1px) and low-contrast (`line` / `line-strong`) rather than heavy outlines. The case-study component is the one place a thick accent border appears (`4px solid` Signal Orange on the left edge) as a deliberate "this is a quote worth noticing" marker.

## Components

### Buttons
- **Shape:** 7px radius by default (`.btn`); the standout CTA is fully pill-shaped (99px, `.cta-bold`).
- **Primary** (`.btn.primary`): Deep Navy fill, white text — the default committing action.
- **Accent** (`.btn.accent`): Signal Orange fill, white text, with a hover lift (`translateY(-1px)` + orange-tinted shadow) and an optional `.pulse` glow animation for the single most important CTA on a page.
- **Bold CTA** (`.cta-bold`): The signature component — navy→orange-deep diagonal gradient, pill shape, orange-tinted shadow that intensifies on hover. Reserved for the one primary conversion action per landing page (start earning / place an order).
- **Outline/Default** (`.btn`): White fill, `line-strong` border, dark text — the neutral/secondary action. Semantic color swaps (border+text recolored to Live Green or Alert Amber) express approve/reject without introducing new button variants.
- **Ghost** (`.cta-ghost2`): No fill, muted text with an underline, for the secondary "or do this instead" link next to a bold CTA.

### Badges
- **Style:** Pill-shaped (99px), small (11px), background `paper` by default; recolor background/text to the soft/solid pair of Live Green or Alert Amber to signal status (e.g. pending-review, verified).

### Cards / Containers
- **Corner Style:** 12px (`.section`, `.proof-card`), 14–16px for feature-level containers (`.case-study`, `.hero2-widget`).
- **Background:** White (`card`) on the `paper` page background.
- **Shadow Strategy:** See Elevation & Depth — flat at rest today, moving toward a soft lift by default.
- **Border:** 1px `line`, standard on every card.
- **Internal Padding:** Section headers use `16px 20px`; body content commonly `20px`; the hero and trust bar step up to `44px`/`28px`.
- **Signature pattern:** `.section` + `.section-head` is the workhorse container across dashboards and landing pages alike — a bordered white card with a bottom-ruled header row (title left, meta/action right).

### Inputs / Fields
- **Style:** White background, `line-strong` 1px border, 7px radius, 13px text, `9px 10px` padding. Consistent across `input` and `select`.

### Navigation
- Admin pages share a single nav bar (`AdminNav`) rather than per-page navigation, keeping the internal tool coherent as more admin surfaces are added.

### Live-Proof Widget (signature component)
A slightly-rotated (`1deg`), floating card paired with every hero: a monospace "LIVE" tag with a pulsing green dot, followed by monospace feed rows of real(-looking) activity (`.hero2-widget`). This is the clearest expression of the Live Trading Floor metaphor and should be the reference point whenever a new surface needs to communicate "real activity, happening now."

## Do's and Don'ts

### Do:
- **Do** reserve Signal Orange for actions and confirmations — buttons, small accents, glows — never a large background fill (The Signal, Not Surface Rule).
- **Do** use IBM Plex Mono only for live/logged/numeric content, never for headings or prose (The Mono-Means-Live Rule).
- **Do** design mobile-first: verify every new component at the ≤700px breakpoint before treating desktop as done, since engagers are phone-first on constrained connections.
- **Do** lean toward a soft, deliberate shadow lift on primary/important surfaces rather than staying flat-by-default (see Elevation & Depth direction).
- **Do** use the `.section` / `.section-head` bordered-card-with-ruled-header pattern for new dashboard or content blocks rather than inventing a new container style.

### Don't:
- **Don't** introduce a red/danger color for negative or reject states — use Alert Amber (The No-Red Rule).
- **Don't** use heavy drop shadows, hard black shadows, or sharp square corners — every shadow in the system is soft and tinted; every corner is rounded.
- **Don't** let the interface read as loud, salesy, or bot-panel-garish (fake urgency banners, oversized flashing CTAs, stock-photo gloss) — the brand differentiates on being the credible, non-bot alternative.
- **Don't** add a new font family. The three-voice system (Fraunces display, system sans body, IBM Plex Mono label) covers every documented use case.
