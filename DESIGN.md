---
version: alpha
name: Chipotle
website: "https://www.chipotle.com"
description: >-
  A warm, foil-wrapped fast-casual ordering system anchored on a near-burnt-umber ink (#451400) that doubles as both heading color and hairline outline across nearly every surface, with a single mustard-gold brand voltage (#b68207) reserved for the Honey Chicken hero CTA strip and a crimson Rewards red (#ad2118) scoped to the bag-grab promo card. Type runs a tight uppercase Trade Gothic LT Bold stack for category tiles and headlines paired with Nunito at 18/400 for descriptions — the brand trusts photographic menu tiles and uppercase block lettering over typographic weight escalation, and every button compresses to a 4px radius rather than a pill.
seo:
  title: "Chipotle Design System for React — #451400 burnt umber, Trade Gothic LT Bold, 17 components"
  metaDescription: "Chipotle's design system as a DESIGN.md file. Burnt umber #451400, Trade Gothic LT Bold 48px uppercase, 18 colors, 17 components. For React, Next.js, AI tools."
  highlights:
    - "Burnt-umber monochrome chrome — #451400 carries 677 occurrences as both text (335) and hairline border (331), the structural workhorse of the whole site"
    - "Mustard-gold scarcity voltage — #b68207 appears 8 times total, reserved for the Honey Chicken hero CTA and a single rewards strip"
    - "Photographic menu tiles, not typographic categories — every menu entry is a die-cut food photograph above 24px uppercase Trade Gothic LT Bold"
    - "Hard-corner geometry — every CTA carries a 4px radius and 9 of 12 radii on the page are 4px, with 12px reserved only for the catering hero panels"
    - "Two-typeface split discipline — Trade Gothic LT Bold uppercase for category and headline moments, Nunito 18/400 for descriptions and body, never blended"
  tags:
    - "Food & Delivery"
  lastUpdated: "2026-05-13"
  author:
    name: "Dov Azencot"
    url: "https://x.com/dovazencot"
  opening: |
    Chipotle's ordering surface reads like a deli counter laid out on butcher paper. The dominant chrome color is not black and not gray — it is a deep burnt-umber ink (`#451400`) that carries roughly 677 occurrences across the captured page, split almost evenly between text (335) and hairline border (331). That single token does the work that most retail systems split between a heading color, a body color, and a divider gray. Mustard gold (`#b68207`) shows up only 8 times — the Honey Chicken hero CTA strip and a Rewards bag-grab promo are essentially the entire chromatic budget of the page. Where most fast-casual brands ship a flat tomato red or a leaf green as their voltage, Chipotle reserves color for the moments the photograph cannot carry on its own.

    This page packages Chipotle's marketing-and-order surface into one DESIGN.md file built on the Google Labs spec. Inside: 18 color tokens grouped into burnt-umber chrome (ink, hairline, shadow), photographic-safe neutrals (cream, white, ash), the single mustard-gold brand voltage, a crimson Rewards red, and four warm chili-tone gradients. 11 typography tokens run on a Trade Gothic LT Bold uppercase / Nunito body split — display sits at 48px in weight 500 uppercase rather than the 700+ weight that fintech brands lean on. The spec also captures 4px and 12px corner radii, an 8-step spacing scale from 5px to 40px anchored at 16px and 20px, and 17 components — the menu category tile, the burnt-umber filled CTA, the Rewards bag-grab card, the Catering hero panel, the bottom-of-page footer column.

    Feed the file to Claude, Cursor, or GitHub Copilot and the agent will reproduce Chipotle's restraint — die-cut food photography on cream-white tiles, 4px-cornered burnt-umber buttons with 16/700 Nunito Extra Bold uppercase labels, mustard-gold reserved for the hero strip — rather than a generic fast-casual theme. Or read the file as a discipline study: the system's strength is that almost every container reuses the same burnt-umber outline plus white fill plus photographic tile vocabulary, which is why Chipotle never needs a secondary accent to ship a new featured menu category.
  related:
    - href: "/design"
      title: "Browse all design systems"
      description: "The full directory of DESIGN.md files on shadcn.io, with live mockups for each."
    - href: "https://www.chipotle.com"
      title: "Chipotle — official site"
      description: "Chipotle Mexican Grill's ordering and rewards surface — the source this design.md describes."
    - href: "https://github.com/google-labs-code/design.md"
      title: "The DESIGN.md specification"
      description: "Google Labs' open spec for machine-readable design system files."
  questions:
    - id: "primary-color"
      title: "What is Chipotle's primary brand color?"
      answer: "Chipotle's structural workhorse is burnt-umber ink `#451400` — it appears 677 times in the captured page and carries nearly every text moment (335 occurrences) and hairline border (331). The brand voltage is mustard gold `#b68207`, but it appears only 8 times total, reserved for the Honey Chicken hero CTA strip at the top of the page. A crimson `#ad2118` Rewards red appears twice on the bag-grab promo card. There is no green, no tomato red, no signature avocado tone — every chromatic moment beyond the burnt-umber chrome lives inside the food photography itself."
    - id: "typography"
      title: "What typography does Chipotle use, and what should I substitute?"
      answer: "Chipotle runs a two-typeface split. Trade Gothic LT Bold covers every uppercase headline and category label — 48/500 for hero headings, 40/700 for category tiles, 24/500 for menu names. Nunito (and Nunito Extra Bold / Nunito SemiBold variants) covers everything in mixed case — body paragraphs at 18/400, button labels at 16/700, footer links at 13/600. Trade Gothic LT Bold is proprietary; reasonable open-source substitutes are League Gothic, Bebas Neue, or Oswald at the same uppercase and weight-500 setting. Nunito is on Google Fonts directly and substitutes one-for-one."
    - id: "buttons"
      title: "Why is every button 4px-cornered instead of a pill?"
      answer: "Chipotle's page captured 14 occurrences of a 4px corner radius and only 3 of a 12px radius — every CTA, the menu category tiles, and the footer cards are 4px. The 12px radius is scoped to the Catering hero panels alone. There are no full-pill buttons anywhere. The primary CTA pattern is a burnt-umber `#451400` filled rectangle, 220px wide, 35px tall, with `0px 12px` padding and a 16/700 uppercase Nunito Extra Bold label — the hard-corner geometry matches the rectangular die-cut menu photography and the foil-wrap aesthetic of the brand itself."
    - id: "menu-tile"
      title: "What is the menu category tile pattern?"
      answer: "Each menu category — Burrito, Burrito Bowl, Quesadilla, Salad, Tacos, Kid's Meal, Chips & Sides — sits inside a white-fill card with a photographic die-cut of the food product centered above the category label. The label runs 24px uppercase Trade Gothic LT Bold in `#451400`. There is no caption, no price, no description on the tile itself — the photograph carries the entire identity and the label confirms it. Tiles sit in a responsive grid that drops from 4-up on desktop to 2-up on mobile, with `20px` gap as the universal rhythm constant (it appears 20 times in the captured spacing data)."
    - id: "gold-usage"
      title: "When should I use the mustard-gold color?"
      answer: "Mustard gold `#b68207` is reserved for the Honey Chicken hero strip — the single chromatic moment at the very top of the page that announces the seasonal LTO menu item. It appears as a gradient pair with the deeper `#976500` and the brown stop `#6b321b` to render the foil-wrap callout band. Outside of that hero zone, gold does not appear as a CTA fill, a link color, or an accent on any other surface. Using gold as a general-purpose accent flattens the seasonal LTO signal — keep it scoped to the announcement strip and the rewards bag-grab promo only."
    - id: "rewards-red"
      title: "Where does the Rewards red appear?"
      answer: "Crimson `#ad2118` is the Rewards bag-grab card's signature — it shows up twice in the captured page, both inside the small panel that says `HONOR YOUR GRAB ON GIFT CARDS` near the middle of the home page. There is no Rewards-red CTA elsewhere, no error state mapped to it, no link color. Like the mustard gold, it is a scoped ceremonial token. A secondary tonal red `#9c1f16` also appears on a few text and border occurrences as the slightly darker stop in the same family. Outside of those two cards, the Rewards red does not appear."

colors:
  ink: "#451400"
  ink-soft: "#6b321b"
  ash: "#786259"
  white: "#ffffff"
  cream: "#f2f2f2"
  hairline-soft: "#d4cbc7"
  black: "#000000"
  brand-gold: "#b68207"
  brand-gold-deep: "#976500"
  brand-gold-tint: "#a76721"
  rewards-red: "#ad2118"
  rewards-red-deep: "#9c1f16"
  rewards-red-soft: "#b3473f"

typography:
  display-hero:
    fontFamily: "\"Trade Gothic LT Bold\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 48px
    fontWeight: 500
    lineHeight: 38px
    letterSpacing: 0
  display-lg:
    fontFamily: "\"Trade Gothic LT Bold\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  display-md:
    fontFamily: "\"Trade Gothic LT Bold\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
  heading-md:
    fontFamily: "\"Trade Gothic LT Bold\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0
  heading-sm:
    fontFamily: "\"Trade Gothic LT Bold\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  h3-uppercase:
    fontFamily: "\"Trade Gothic LT Bold\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  body-lg:
    fontFamily: "Nunito, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-strong:
    fontFamily: "Nunito, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0
  body-md:
    fontFamily: "Nunito, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  button-label:
    fontFamily: "\"Nunito Extra Bold\", Nunito, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 32px
    letterSpacing: 0
  link-sm:
    fontFamily: "\"Nunito SemiBold\", Nunito, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  caption-xs:
    fontFamily: "Nunito, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 13px
    letterSpacing: 0

rounded:
  none: "0px"
  sm: "4px"
  md: "12px"

spacing:
  xxs: "5px"
  xs: "10px"
  sm: "13px"
  md: "16px"
  base: "18px"
  lg: "20px"
  xl: "32px"
  xxl: "40px"

components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.button-label}"
    rounded: "{rounded.sm}"
    padding: "0px 12px"
    height: "35px"
    border: "1px solid #000000"
  button-primary-wide:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.button-label}"
    rounded: "{rounded.sm}"
    padding: "0px 16px"
    height: "40px"
    border: "1px solid #451400"
  button-secondary-outline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.button-label}"
    rounded: "{rounded.sm}"
    padding: "0px 12px"
    height: "35px"
    border: "1px solid #451400"
  button-rewards:
    backgroundColor: "{colors.rewards-red}"
    textColor: "{colors.white}"
    typography: "{typography.button-label}"
    rounded: "{rounded.sm}"
    padding: "0px 16px"
    height: "40px"
    border: "0"
  hero-strip-honey:
    backgroundColor: "{colors.brand-gold}"
    textColor: "{colors.white}"
    typography: "{typography.display-hero}"
    rounded: "{rounded.none}"
    padding: "20px 40px"
    border: "0"
  menu-category-tile:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-sm}"
    rounded: "{rounded.sm}"
    padding: "20px"
    border: "1px solid #451400"
  rewards-bag-grab-card:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-sm}"
    rounded: "{rounded.sm}"
    padding: "20px"
    border: "1px solid #ad2118"
  catering-hero-panel:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.md}"
    padding: "32px"
    border: "0"
  card-default:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.sm}"
    padding: "20px"
    border: "1px solid #d4cbc7"
  card-featured:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.sm}"
    padding: "16px"
    border: "1px solid #786259"
  top-nav:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "10px 20px"
    height: "60px"
    border: "0"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    border: "0"
  footer-column-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "5px 0px"
    border: "0"
  footer-heading:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.h3-uppercase}"
    rounded: "{rounded.none}"
    padding: "0px"
    border: "0"
  rewards-cta-circle:
    backgroundColor: "{colors.rewards-red}"
    textColor: "{colors.white}"
    typography: "{typography.button-label}"
    rounded: "9999px"
    padding: "20px"
    height: "120px"
    width: "120px"
    border: "0"
  text-input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "40px"
    border: "1px solid #786259"
  hairline-divider:
    backgroundColor: "{colors.hairline-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.caption-xs}"
    rounded: "{rounded.none}"
    padding: "0"
    height: "1px"
    border: "0"
---

## Overview

Chipotle's ordering surface is a foil-wrapped fast-casual catalog rendered in burnt umber on cream — a system where one ink color (`{colors.ink}` — #451400) carries both the text moment and the hairline moment across nearly every container, and color appears only where the brand decides to scream. The dominant token does the work most retail systems would split between three: 335 occurrences as text, 331 as border, 7 as background fill, totaling 677 hits in the captured page. There is no separate heading color, no separate divider gray, no secondary text tone — burnt umber is the entire chrome.

**Burnt-umber as load-bearing chrome**: where most fast-casual brands ship a tomato-red and a leaf-green as their two voltages, Chipotle ships one near-black-brown that doubles as both content and container. The mustard gold (`{colors.brand-gold}` — #b68207) shows up only 8 times across the captured page — and even those 8 occurrences are scoped to a single hero strip announcing the seasonal Honey Chicken LTO. Rewards red (`{colors.rewards-red}` — #ad2118) is rarer still: 2 occurrences, both inside the bag-grab promo card. Unlike the convention of a fast-casual landing page leading with a fully saturated brand-color hero band, Chipotle's hero is photographic — a die-cut chicken bowl shot on cream — and the chromatic moment is a thin gold strip beneath it.

The typographic discipline carries the rest of the voice. Trade Gothic LT Bold covers every uppercase headline and category label across the page (48/500 hero, 40/700 category tiles, 24/500 menu names), while Nunito carries every mixed-case description, button label, and footer link. The two typefaces never blend inside the same surface — uppercase tiles get Trade Gothic LT Bold, body paragraphs get Nunito 18/400. Buttons are universally 4px-cornered (14 of the captured 17 radii are 4px), never pilled. The page rhythm is a 20px constant — gap between menu tiles, padding inside the rewards card, vertical breath between footer rows — appearing 20 times in the captured spacing data, more than any other value.

**Key Characteristics:**
- Single burnt-umber chrome token (`{colors.ink}` — #451400) carries both text (335) and hairline border (331) on the page — a one-color structural system instead of a two-color heading-plus-divider pair.
- Mustard-gold scarcity voltage (`{colors.brand-gold}` — #b68207) reserved for the seasonal Honey Chicken hero strip; 8 occurrences total.
- Crimson Rewards red (`{colors.rewards-red}` — #ad2118) scoped to the bag-grab promo card; 2 occurrences total.
- Two-typeface split: Trade Gothic LT Bold uppercase for headlines and category tiles, Nunito for descriptions and body — never blended inside a single surface.
- Hard-corner geometry: every CTA carries a 4px radius (`{rounded.sm}`); 12px (`{rounded.md}`) reserved for catering hero panels only.
- 20px universal rhythm constant — the most frequent spacing value on the page, used as gap, padding, and section breath.
- Photographic die-cut menu tiles instead of typographic category cards — every menu entry is food on cream.
- Cream surface (`{colors.cream}` — #f2f2f2) reserved for promotional cards (Bag Grab, Rewards), separating them from the white default tile background.
- 35px-tall primary CTA (`{component.button-primary}`) — a deliberately compact button instead of a touch-friendly 44px+ pill.
- Footer column-link tokens run a Nunito SemiBold 13/600 family — the system's smallest text tier, used for legal and link-list scaffolding.

## Colors

### Burnt-Umber Chrome (Structural)
- **Burnt Umber Ink** (`{colors.ink}` — #451400) — frequency 677. Used as text (335), border (331), background (7), gradient (4). The system's load-bearing token: every heading, every paragraph, every hairline divider, and every primary CTA fill collapses into this one near-black-brown.
- **Ink Soft** (`{colors.ink-soft}` — #6b321b) — frequency 4. Used as gradient (4) only. A warmer mid-tone reserved for the burnt-umber gradient that backs the Honey Chicken strip and the catering hero stops.
- **Ash** (`{colors.ash}` — #786259) — frequency 77. Used as text (38), border (39). A muted mid-brown used as the secondary metadata text color and the input-border outline on form fields.
- **Hairline Soft** (`{colors.hairline-soft}` — #d4cbc7) — frequency 2. Used as border (2). A warm-gray 1px divider for inside-card row separators, where a full burnt-umber outline would feel too heavy.

### Surface
- **White** (`{colors.white}` — #ffffff) — frequency 73. Used as text (33), border (31), background (6), gradient (3). The primary tile-fill and the inverse-text token on burnt-umber buttons.
- **Cream** (`{colors.cream}` — #f2f2f2) — frequency 4. Used as background (4). A soft warm-gray reserved for promotional cards (Bag Grab, Rewards strip) — separates them visually from the white menu tile grid.
- **Black** (`{colors.black}` — #000000) — frequency 4. Used as border (1), shadow (3). Not a content color — only the 1px primary-button border and the underlying shadow stack.

### Brand Voltage (Scarcity)
- **Brand Gold** (`{colors.brand-gold}` — #b68207) — frequency 8. Used as text (2), background (2), border (2), gradient (2). Reserved for the Honey Chicken hero CTA strip at the top of the page — appears 8 times total across the whole captured page.
- **Brand Gold Deep** (`{colors.brand-gold-deep}` — #976500) — frequency 2. Used as gradient (2). The deeper stop in the gold gradient pair on the foil-wrap hero band.
- **Brand Gold Tint** (`{colors.brand-gold-tint}` — #a76721) — frequency 4. Used as text (2), border (2). A muted gold-brown that softens the gold strip's outer edge.

### Rewards Ceremony
- **Rewards Red** (`{colors.rewards-red}` — #ad2118) — frequency 2. Used as background (1), gradient (1). The crimson signature of the Rewards bag-grab promo card; appears twice on the captured page.
- **Rewards Red Deep** (`{colors.rewards-red-deep}` — #9c1f16) — frequency 4. Used as text (2), border (2). The slightly darker tonal stop in the same crimson family — used on the Rewards card outline and label text.
- **Rewards Red Soft** (`{colors.rewards-red-soft}` — #b3473f) — frequency 1. Used as gradient (1). The pale-rust gradient stop on the Rewards card top border.

## Typography

### Font Family

The system runs a two-typeface split. **Trade Gothic LT Bold** (with `"Helvetica Neue", Arial, sans-serif` fallback) covers every uppercase headline and category label. **Nunito** (and its `Nunito SemiBold` / `Nunito Extra Bold` variants, with `"Helvetica Neue", Arial, sans-serif` fallback) covers everything mixed-case — body, button labels, footer links. There is no third typeface and no serif anywhere on the captured page.

Trade Gothic LT Bold is proprietary (Linotype). Reasonable open-source substitutes are **League Gothic**, **Bebas Neue**, or **Oswald** at weight 500 and uppercase. Nunito is available on Google Fonts and substitutes one-for-one.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.display-hero}` | 48px | 500 | 38px | Hero `FEATURED` heading band, uppercase Trade Gothic LT Bold |
| `{typography.display-lg}` | 40px | 700 | 1.2 | Category tile labels (BURRITO, QUESADILLA), uppercase |
| `{typography.display-md}` | 32px | 400 | 1.2 | Featured-section subhead, uppercase |
| `{typography.heading-md}` | 28px | 400 | 1.2 | Promo card heading (HONOR YOUR GRAB), uppercase |
| `{typography.heading-sm}` | 24px | 500 | 1.2 | Menu category names and second-tier headings, uppercase |
| `{typography.h3-uppercase}` | 18px | 500 | 1.2 | Footer column headings, uppercase Trade Gothic LT Bold |
| `{typography.body-lg}` | 18px | 400 | 1.5 | Default body paragraph copy, Nunito |
| `{typography.body-strong}` | 18px | 700 | 1.5 | Inline emphasis inside body paragraphs, Nunito bold |
| `{typography.body-md}` | 20px | 700 | 1.4 | Sub-heading row labels, Nunito |
| `{typography.button-label}` | 16px | 700 | 32px | All CTA labels — Nunito Extra Bold, uppercase by transform |
| `{typography.link-sm}` | 13px | 600 | 1.4 | Footer column links and metadata, Nunito SemiBold |
| `{typography.caption-xs}` | 12px | 700 | 13px | Legal copy and disclosure micro-text, Nunito uppercase |

### Principles

- **Weight does not escalate beyond 700.** Trade Gothic LT Bold display sits at 500 on the hero `FEATURED` band — not 700 or 800 — and the size-only jump from 24px to 48px carries the hierarchy.
- **Uppercase carries identity, not weight.** Every Trade Gothic LT Bold size is uppercase by `text-transform`; no lowercase Trade Gothic appears on the captured page. The block-lettering pattern matches the foil-wrap and deli-counter aesthetic of the brand.
- **Mixed case is Nunito-only.** Body, descriptions, button labels, and footer links all run Nunito (or its weight variants). Trade Gothic never appears in mixed case.
- **Line-height runs 1.2 on display and 1.5 on body.** Nunito body paragraphs sit at `lineHeight: 1.5` for legibility, while Trade Gothic uppercase headings tighten to 1.2 or fixed-px values (38px on the 48px hero).

## Layout

### Spacing System

Pixel-based scale with a single rhythm constant at 20px:

- **Tokens:** `{spacing.xxs}` 5px · `{spacing.xs}` 10px · `{spacing.sm}` 13px · `{spacing.md}` 16px · `{spacing.base}` 18px · `{spacing.lg}` 20px · `{spacing.xl}` 32px · `{spacing.xxl}` 40px.
- **Universal rhythm constant:** 20px (`{spacing.lg}`) — the most frequent spacing value on the page (20 occurrences), used as menu-tile gap, promo-card padding, and footer column gutter.
- **Secondary anchor:** 16px (`{spacing.md}`) — appears 15 times, used as outer gutter and button horizontal padding on the wide CTA variant.

### Grid & Container

- Menu category grid: 4-up on desktop dropping to 2-up on mobile, with 20px gap between tiles.
- Hero strip: full-width, 40px vertical padding, 20px horizontal inside the gold strip.
- Featured row: 3-up image-card grid centered under the `FEATURED` heading.
- Footer: 4-column column-link grid with 16px column gap.

### Border Radius Scale

- `{rounded.none}` (0px): Hero gold strip, top nav, footer container, hairline dividers.
- `{rounded.sm}` (4px): Every CTA, every menu category tile, every default card and form input — the universal radius on the page (14 occurrences).
- `{rounded.md}` (12px): Catering hero panels only (3 occurrences) — the single context where Chipotle softens the corner above 4px.

### Whitespace Philosophy

Whitespace is tight — `5px`, `10px`, `13px`, and `20px` carry roughly half the captured spacing values. The system trusts the photographic die-cut food tiles to carry the visual breath rather than generous padding. Containers run flush against each other separated by 1px burnt-umber hairlines rather than gaps.

## Elevation

| Level | Treatment | Use |
|---|---|---|
| Default tile | `0px 0px 40px rgba(0,0,0,0.06)` | Soft halo around menu category tiles |
| Promo card | Subtle 1px burnt-umber outline only | Bag Grab and Rewards promotional cards rely on the outline, not a shadow |
| Hero strip | No shadow — flat full-bleed gold band | The Honey Chicken hero is flat color, not raised |
| Catering panel | Inner padding on a 12px-rounded dark panel | Depth comes from the radius shift, not the shadow stack |

**Shadow philosophy:** Whisper-soft to absent. The only captured shadow is a `0px 0px 40px` halo with a low alpha — three occurrences in the page. Everywhere else, the system relies on the 1px burnt-umber outline to define the container edge. There are no drop shadows on buttons, no inner shadows on inputs, no layered ambient stacks. **Shadow-as-absence**: the brand reads the burnt-umber hairline as the depth signal, and the photograph as the visual lift.

## Shapes

The radius scale is two-tiered. `{rounded.sm}` (4px) carries every button, tile, and card; `{rounded.md}` (12px) is scoped to Catering hero panels. There are no pills, no full-circle buttons (except the optional Rewards CTA circle), and no rounded-rectangle surfaces above 12px. The hard-corner geometry matches the foil-wrap rectangular die of a Chipotle burrito itself — the brand's product silhouette is the design silhouette.

## Components

### Buttons

**`button-primary`** — Burnt-umber `{colors.ink}` fill, white text, 4px radius, `0px 12px` padding, 35px tall, 16/700 Nunito Extra Bold uppercase label. The most common CTA on the page (`CREATE AN ACCOUNT`, `ORDER NOW`). Carries a 1px black border for a foil-stamped edge feel.

**`button-primary-wide`** — Same burnt-umber fill and uppercase label, slightly larger at `0px 16px` padding and 40px height. Used on featured rows where the CTA needs to sit beside a larger product photograph.

**`button-secondary-outline`** — White fill with burnt-umber text and 1px burnt-umber outline at 4px radius. Used for `LEARN MORE`-style secondary actions paired with a filled primary CTA.

**`button-rewards`** — Rewards-red `{colors.rewards-red}` fill, white text, 4px radius, 40px height. Used inside the bag-grab promo card and as the optional rewards CTA circle.

### Hero & Promotional Surfaces

**`hero-strip-honey`** — Full-bleed mustard-gold `{colors.brand-gold}` strip with the seasonal Honey Chicken announcement. White Trade Gothic LT Bold 48/500 uppercase headline burned into the gold band, 20px vertical padding. No shadow, no radius — flat color edge to edge.

**`menu-category-tile`** — White fill, 4px radius, 20px padding, 1px burnt-umber outline. Each tile carries a die-cut food photograph centered above a 24/500 uppercase Trade Gothic LT Bold label (`BURRITO`, `QUESADILLA`, `SALAD`). No price, no description — the photograph and label do the work.

**`rewards-bag-grab-card`** — Cream `{colors.cream}` fill with 1px rewards-red outline, 4px radius, 20px padding. Carries the `HONOR YOUR GRAB ON GIFT CARDS` promo with the dual Trade Gothic LT Bold heading + Nunito body. The crimson outline differentiates it from the burnt-umber menu tiles.

**`catering-hero-panel`** — Burnt-umber `{colors.ink}` filled dark panel with white Trade Gothic LT Bold 40/700 headline, 12px radius, 32px padding. The single surface on the page where the corner radius exceeds 4px.

### Cards & Containers

**`card-default`** — White fill with a 1px hairline-soft outline at 4px radius. Used for featured-row product cards beneath the `FEATURED` heading.

**`card-featured`** — Cream fill with a 1px ash outline. The slightly warmer companion to `card-default`, used on the second tier of promo cards.

### Navigation

**`top-nav`** — White fill, 60px tall, 1px burnt-umber bottom hairline. Left: Chipotle wordmark. Center: primary links (MENU, LOCATIONS, REWARDS, OUR VALUES, NUTRITION). Right: account, language, and order CTA. Every link is `link-sm` Nunito SemiBold 13/600.

**`nav-link`** — Transparent fill with burnt-umber text, 10px vertical padding × 16px horizontal. No underline by default; active state adds a 2px burnt-umber underline.

### Footer

**`footer-column-link`** — Transparent fill with burnt-umber `link-sm` 13/600 text, 5px vertical padding. Stacked inside a 4-column layout.

**`footer-heading`** — Trade Gothic LT Bold 18/500 uppercase column heading (`CONTACT SUPPORT`, `CAREERS`, `CHIPOTLE GOODS`, `GIFT CARDS`).

### Forms

**`text-input`** — White fill, 1px ash outline at 4px radius, 40px tall, 10px × 16px padding. Nunito 18/400 body inside. Used in the footer email sign-up and rewards forms.

### Utility

**`hairline-divider`** — 1px tall `hairline-soft` background, full-width inside cards and between footer column rows.

**`rewards-cta-circle`** — Optional 120px circular Rewards-red disc with white 16/700 Nunito Extra Bold uppercase label inside. Used on the rewards strip as a secondary CTA shape.

## Do's and Don'ts

**Do** anchor every heading, every body paragraph, and every hairline on burnt-umber `#451400`. The system trusts one color to do three jobs — splitting the heading into a darker tone and the divider into a separate gray will read as inconsistent, not as polish.

**Do** use 4px corners on every CTA and every tile. 12px is reserved for catering panels only — using it elsewhere shifts the geometry away from the foil-wrap silhouette.

**Don't** use mustard gold `#b68207` as a general-purpose CTA fill. It appears 8 times on the page, all inside the Honey Chicken hero strip. Stretching it into a primary button color flattens the seasonal-LTO signal and makes every CTA fight for the same attention slot the hero already owns.

**Don't** pair Trade Gothic LT Bold with mixed-case text. Trade Gothic LT Bold on the captured page is always uppercase via `text-transform`; mixing it with Nunito's lowercase body inside the same paragraph breaks the two-typeface split. Body paragraphs run Nunito 18/400 only.

**Don't** soften the 1px burnt-umber outline into a gray or a translucent black. The captured page uses `#451400` for 331 of its border occurrences directly — translucent gray makes the menu tiles look generic-card instead of foil-stamped.

**Don't** add drop shadows to buttons or tiles. The system carries depth through the 1px outline and the photograph, not the shadow stack. The only captured shadow is a soft halo on tiles (`0px 0px 40px` low-alpha).

**Don't** use rewards red `#ad2118` outside the bag-grab promo card. It appears twice on the page total. Using it on error states, links, or other CTAs collapses its ceremonial role.

**Don't** scale primary button height above 40px or down below 35px. The captured primary CTA is `35px` tall with `0px 12px` padding — the compact button is part of the brand's voice, not a touch-target accident. Push it to 48px and the page reads like a generic shadcn default.

## Known Gaps

- **Trade Gothic LT Bold is proprietary** — not on Google Fonts. Substitute with League Gothic, Bebas Neue, or Oswald at weight 500 uppercase and document the swap.
- **No CSS custom properties on `:root`** — the captured page has zero `--token` declarations, so the spec relies entirely on inline-resolved values and selector-level styles.
- **Hover and active states** — not documented on the captured snapshot; the spec covers default states only.
- **Mobile breakpoints** — the desktop 1440×4122 capture documents the full ordering surface, but mobile-specific component variants (drawer nav, single-column menu grid) were not captured.
- **Dark mode** — Chipotle's marketing surface is light-canvas only; no dark mode is captured or implied by the token system.
- **Cart, checkout, and bag flow** — the captured page is the marketing home; full ordering UI (item builder, ingredient selector, bag review) is not part of this spec.
