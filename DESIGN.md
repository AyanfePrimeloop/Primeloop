---
name: Primeloop
description: Real social media engagement from verified Nigerian engagers, with a screenshot behind every one.
scope: Public pages (/, /join, /try) via styles/site.css; dashboards, admin, login/signup and legal pages via styles/globals.css, which carries the same tokens.
colors:
  bg: "#ffffff"
  tint: "#f5f6fa"
  line: "#e4e7ee"
  line-strong: "#cdd2df"
  ink: "#0f1428"
  ink-soft: "#485068"
  ink-mute: "#646b82"
  navy: "#1c2340"
  navy-deep: "#131a34"
  orange: "#e0632b"
  orange-hover: "#ea7238"
  on-orange: "#12172b"
  good: "#1d7a4c"
  good-soft: "#e6f4ec"
  warn: "#8f6118"
  warn-soft: "#fbf1de"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', 'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "clamp(38px, 5.4vw, 60px)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "'Bricolage Grotesque', 'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "clamp(28px, 3.4vw, 40px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.024em"
  title:
    fontFamily: "'Bricolage Grotesque', 'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  lead:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  input: "10px"
  card: "16px"
  photo: "20px"
  pill: "999px"
spacing:
  wrap: "1160px"
  gutter: "24px"
  section: "88px"
  card-pad: "28px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.on-orange}"
    rounded: "{rounded.input}"
    padding: "16px 24px"
  button-navy:
    backgroundColor: "{colors.navy}"
    textColor: "#ffffff"
    rounded: "{rounded.input}"
    padding: "16px 24px"
  button-ghost:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "16px 24px"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.card}"
    padding: "28px"
  chip:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "10px 15px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "13px 14px"
---

# Design System: Primeloop (public site)

## Overview

**Creative North Star: "Trust Through Legibility"**

A fintech product page with photography. White ground, cool-tint bands, one deep navy field, one orange action. Proof is shown as product UI (a verification card over a real photo), not described. Two distrustful, phone-first audiences: Nigerian business owners burned by bot panels, and Nigerians deciding if this is a real way to earn.

Own-world materials: white, cool tint, navy, signal orange; Bricolage Grotesque heavy and tight over Hanken Grotesk; hairline borders; drawn single-stroke SVG icons (components/SiteIcons.js); licensed portraits. There is no mono, no gradient text, no cream, no serif.

Scope: `.site` (styles/site.css) governs `/`, `/join`, `/try` and the legal pages. Auth screens use the split AuthShell (form left, photograph right); dashboards and admin use AppBar plus the shared `.section`, `.btn`, `.badge` classes in styles/globals.css, which uses the same tokens, Bricolage Grotesque headings, Hanken Grotesk text and tabular numerals (`--mono` now resolves to the text face). Signed-in screens were restyled through the shared classes; their per-page inline layout is unchanged.

## Colors

- **White** (`#fff`) is the page; **Tint** (`#f5f6fa`) marks alternating sections, the footer and the closing cross band.
- **Navy** (`#1c2340`) is the only large colour field (the comparison band), plus step numerals, selected chips, input focus and slider fill. **Navy Deep** (`#131a34`) is declared but unused in the shipped CSS.
- **Signal Orange** (`#e0632b`, hover `#ea7238`) fills the one primary action per view, with navy text (`#12172b`) for contrast. It is also the focus ring, caret and slider thumb.
- **Ink** `#0f1428`, **Ink Soft** `#485068`, **Ink Mute** `#646b82` (the mute value is set to clear 4.5:1 on white).
- **Good** `#1d7a4c` marks live, verified and earnings figures; **Warn** `#8f6118` is the only error/negative colour (form errors, invalid borders). No red exists.
- On navy: body `#c9cee8`, muted `#aab1d6`.
- Third-party mark: the WhatsApp glyph uses `#1faa59` on a neutral white pill; the pill itself is not branded.

### Named Rules
**One Field Rule.** Navy is the single large colour field. Orange is never a large fill.
**One Action Rule.** Orange fills exactly one primary action per view (header "Try it free" and the hero CTA are the same action; the sticky mobile bar repeats it).
**No-Red Rule.** Negative states use Warn, never a new hue.

## Typography

**Display:** Bricolage Grotesque 600-800 (loaded in pages/_document.js). **Body:** Hanken Grotesk 400-700.

- Display `.s-h1`: 800, clamp(38px, 5.4vw, 60px), line-height 1.04, tracking -0.022em.
- Headline `.s-h2`: 700, clamp(28px, 3.4vw, 40px), 1.1, -0.024em.
- Title `.s-h3`: 700, 20px, 1.3. Card titles 700 20px; FAQ questions 600 18px display face.
- Body 16px/1.6; lead 18px, max 56ch, Ink Soft; small 14px; hints 13px.
- Money and times use tabular numerals (`.s-num`, `font-variant-numeric: tabular-nums`). Large figures (`.amt` 34px, calculator `.big` 44px) are display 800.
- Headings use `text-wrap: balance`.

### Named Rules
**Two Voices Rule.** Display face for headings, step numerals, brand wordmark and money figures; text face for everything read. No third family, no mono on public pages.

## Layout

Centered `.s-wrap` at 1160px with 24px gutters (18px under 560px). Sections pad 88px (60px under 860px). Hero is a 7/5 grid with 64px gap; builder 5/7; FAQ 4/8; splits 1/1; cross band 3/2; footer 4/2/2/2. Header is sticky, 64px, white, hairline bottom. Breakpoints: 1020, 860 (single column, nav hidden, comparison table becomes one card per row), 700 (sticky CTA and icon-only WhatsApp), 560.

Steps are a real sequence, so large numerals carry information; they sit on a hairline top rule in three or four columns.

## Elevation and Depth

Almost flat. Hairline 1px borders separate; shadow is reserved for things that float.
- Proof card over photo: `0 18px 40px rgba(15,20,40,.14)`.
- Lifted form card: `0 24px 56px rgba(15,20,40,.10)`; standard card `0 1px 2px rgba(15,20,40,.04)`.
- Primary hover: `0 8px 20px rgba(224,99,43,.28)` with 1px lift.
- Sticky mobile bar `0 -10px 28px rgba(15,20,40,.08)`; WhatsApp pill `0 8px 22px rgba(15,20,40,.16)`.
No hard offset shadows.

## Shapes

Controls (buttons, inputs, chips) 10px; cards and proof card 16px; photos and cross band 20px; slider thumb, dots, FAQ plus and WhatsApp pill fully round.

## Components

- **Buttons** `.s-btn`: 600 16px, 16px 24px. `-primary` orange with navy text; `-navy`; `-ghost` white with strong hairline; `-sm` 11px 16px. Trailing arrow nudges 3px on hover. Disabled at 50%.
- **Link** `.s-link`: 600, underlined with a strong-line rule that turns orange on hover.
- **Header**: wordmark (display 800 21px) with Logo mark, three links, Log in, orange button.
- **Proof card** `.s-proof` (components/ProofCard.js): white card floating over the lower-left of a hero photo, pulsing green dot, rows of real verification or payout data from the database. When the newest row is stale the dot goes grey and the title reads "Latest"; when there is nothing real it shows one row labelled "Example:" in italic mute. Invented figures are never shown as real.
- **Photo** (components/Photo.js): `<img>` with srcSet 640/1200, explicit width and height, lazy except the priority hero, custom object-position. Hero ratio 4:5, wide 3:2, cross band 5:4 cropped at 50% 45%, radius 20px.
- **Comparison band** `.s-band`/`.s-compare`: navy field, table with "us" column in white 600 and "them" in muted; drawn check/cross icons.
- **Card and form**: `.s-card` 28px pad; `.s-input` 13px 14px, focus border navy with a 4px navy 12% ring; `.s-chip` toggles via `aria-pressed` to navy fill; engager rows `.s-eng` (checkbox, label, tabular price, 92px quantity); total row with display-800 amount; range slider with navy fill and orange thumb.
- **Calculator output** `.big`: green display figure.
- **FAQ** `.s-faq-item`: hairline-ruled accordion, 18px display question, rotating plus, grid-row height animation.
- **Closing bands**: `.s-cross` tint card with copy and a photo; `.s-final` left-aligned.
- **Footer**: tint, four columns, legal line with photography credit.
- **Sticky CTA** `.s-sticky`: mobile-only white bar; **WhatsApp** `.s-wa`: fixed white pill with hairline border and green glyph; label hidden under 700px, lifted above the sticky bar.
- **Focus**: 3px orange outline, 3px offset, 6px radius; white on navy.
- **Motion**: hero copy rises in staggered 70ms (.8s), proof card pops after .35s, live dot pulses 1.9s; all disabled under `prefers-reduced-motion`.

## Photography

Four licensed Unsplash portraits in `public/images` (client-owner, engager-corper, engager-phone, trial-creator, each at 640 and 1200 wide), provenance embedded in the files. Credit is disclosed in the footer (Blessing Olarewaju, Emmanuel Ikwuegbu, Muhammad-Taha Ibrahim) with the statement that stock images do not depict Primeloop customers. Placement: `/` hero client-owner and cross band engager-corper; `/join` hero engager-phone and a distinct trial-creator photo lower down; `/try` trial-creator. Photos are never captioned as customers, engagers or testimonials. Replace with the user's own people when they exist.

## Do's and Don'ts

Do:
- Keep one orange primary action per view; keep navy as the only large field.
- Show proof as real data or a labelled example; state only claims the product can support (the unsupported "1,200+" figure was removed).
- Use tabular numerals for every price, total and time.
- Verify each new pattern at 860 and 560px first; audience is phone-first.

Don't:
- Do not use a serif, mono, gradient text, cream ground, pill gradient CTA, or hero-metric stat trio on public pages.
- Do not caption stock photos as people who use Primeloop, and do not add invented testimonials or counts.
- Do not add red; use Warn.
- Do not add a third font family.

## Not canonized

Drift observed, not recorded as rules: the `--navy-deep` token is unused in site.css; `.impeccable/config.json` still whitelists WhatsApp `#25d366`, which no longer appears in the public site; the direction contract's "2:3 portrait, 12-column" first-viewport wording differs from the build (4:5 photo, 7/5 grid), so the build is recorded above.
