---
name: Sophisticated Lounge
colors:
  surface: '#1c110c'
  surface-dim: '#1c110c'
  surface-bright: '#453630'
  surface-container-lowest: '#160c07'
  surface-container-low: '#251913'
  surface-container: '#291d17'
  surface-container-high: '#342721'
  surface-container-highest: '#40322c'
  on-surface: '#f5ded5'
  on-surface-variant: '#d4c4b5'
  inverse-surface: '#f5ded5'
  inverse-on-surface: '#3b2d27'
  outline: '#9d8e80'
  outline-variant: '#504539'
  surface-tint: '#f5bc7a'
  primary: '#ffcd97'
  on-primary: '#472a00'
  primary-container: '#e8b06f'
  on-primary-container: '#694209'
  inverse-primary: '#80551d'
  secondary: '#c9c6c2'
  on-secondary: '#31302d'
  secondary-container: '#474743'
  on-secondary-container: '#b7b5b0'
  tertiary: '#e9d2c6'
  on-tertiary: '#3c2d26'
  tertiary-container: '#cdb6ab'
  on-tertiary-container: '#57473f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb9'
  primary-fixed-dim: '#f5bc7a'
  on-primary-fixed: '#2b1700'
  on-primary-fixed-variant: '#653e05'
  secondary-fixed: '#e5e2dd'
  secondary-fixed-dim: '#c9c6c2'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#f6ded2'
  tertiary-fixed-dim: '#d9c2b7'
  on-tertiary-fixed: '#251912'
  on-tertiary-fixed-variant: '#54433b'
  background: '#1c110c'
  on-background: '#f5ded5'
  surface-variant: '#40322c'
typography:
  headline-xl:
    fontFamily: literata
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: literata
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: literata
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: literata
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system is centered around a "Private Club" aesthetic, evoking the warmth of a high-end coffee lounge or a traditional literary circle. It targets an audience that values intellectual exchange, comfort, and exclusivity. 

The style is **Modern Corporate with Tactile Warmth**, leaning into a sophisticated dark mode. It avoids the coldness of typical tech products by using organic color tones and rich typography. The interface should feel hushed, premium, and inviting—prioritizing focus and "slow" interaction over frantic clicking. Visual hierarchy is established through subtle tonal layering and impeccable typesetting rather than aggressive borders or heavy shadows.

## Colors

The palette is anchored in a deep espresso background, providing a rich foundation for the warm amber accents.

- **Primary (Amber):** Used for call-to-actions, active states, and highlights. It represents the warmth of the "Café" atmosphere.
- **Secondary (Cream):** A soft, off-white used for primary text and high-contrast labels to reduce eye strain compared to pure white.
- **Surface (Deep Brown):** Used for cards, sidebars, and elevated containers (#2A1D16).
- **Background (Neutral):** The darkest base layer (#1A0F0A), creating a sense of depth and focus.
- **Muted (Earth Grey):** Used for secondary text and disabled states to maintain a low-profile aesthetic.

## Typography

This design system uses a dual-font strategy to balance tradition and utility. 

**Literata** (Serif) is reserved for headlines and editorial moments. Its bookish quality reinforces the "Tertulias" (literary circle) aspect of the brand.

**Manrope** (Sans-serif) is used for all UI elements, navigation, and body copy. It provides a clean, modern contrast to the serif headings, ensuring legibility at small sizes and in data-heavy lists.

Maintain tight tracking for large headlines and generous line-height for body text to enhance the relaxed reading experience.

## Layout & Spacing

The layout follows a **Fluid Grid** model with high-density margins to create a focused "reading column" on desktop. 

- **Grid:** 12-column layout for desktop, 4-column for mobile.
- **Margins:** Desktop utilizes 48px global margins; Mobile uses 16px.
- **Rhythm:** Use the 8px base unit strictly. Sections should be separated by `xxl` (48px) to provide "breathing room" and reinforce the premium, unhurried brand feel.
- **Alignment:** Elements within cards should use the `md` (16px) or `lg` (24px) spacing for internal padding to maintain a feeling of spaciousness.

## Elevation & Depth

This design system avoids heavy shadows, instead using **Tonal Layering** and **Low-Contrast Outlines** to communicate hierarchy.

- **Level 0 (Background):** #1A0F0A.
- **Level 1 (Cards/Sidebar):** #2A1D16. Surfaces are defined by a subtle 1px border (#3D2B22) rather than a shadow.
- **Level 2 (Popovers/Modals):** Slight elevation using a very soft, large-radius amber-tinted shadow (e.g., `0 12px 32px rgba(26, 15, 10, 0.8)`).
- **Interactive States:** Hovering over a card may slightly brighten its background or increase border opacity, but should not "lift" the element off the page.

## Shapes

The shape language is consistently **Rounded**, providing a soft, approachable feel that mimics comfortable furniture and organic forms.

- **Small elements (Badges/Chips):** Full pill shape for distinction.
- **Standard elements (Buttons/Inputs):** 8px (rounded) to maintain a modern UI feel.
- **Large containers (Cards/Sections):** 16px (rounded-lg) to create a soft, framed look for content sessions.

## Components

### Buttons
- **Primary:** Solid Amber (#E8B06F / `--primary-container`) with Deep Brown text. High contrast, reserved for main actions like "Entrar" or "Nueva sesión." `rounded: 0.5rem` (8px), `font: Manrope 600`.
- **Secondary/Outline:** Transparent background with a 1px Amber border and Amber text. Used for secondary navigation or less critical actions.
- **Ghost:** Text-only in Cream or Amber, used for utility links in sidebars and secondary row actions ("Entrar" en listas).

### Cards
- **Session Cards:** Use the #2A1D16 background (`surface-container`) with 16px internal padding (`rounded-lg` 16px). Title in Literata (headline-md 24px 600). Tonal layering with 1px outline `#3D2B22`/`#504539` — no heavy shadows.
- **Member Lists:** Simple rows with subtle 1px dividers (`outline-variant`). Use circular avatars with Amber borders for active users. Status dot `8px` muted.

### Inputs & Selection
- **Inputs:** Darker than the card surface (#140B07 / `surface-container-lowest`) with a subtle border. Focus state uses a 1px Amber glow.
- **Chips:** Small, pill-shaped labels (`rounded-full`) with a slightly lighter brown background and Amber text for "Live" or "Open" statuses.

### Sidebar
- **Navigation:** Active items use a soft Amber background (`primary-container`/`sidebar-primary`) with darker text. Inactive items use low-opacity Cream icons and text.

## Gamification — Miel, no neón

La gamificación usa la misma paleta Lounge, nunca colores extra. Recompensa = calidez, no arcade.

- **Principio:** 1 acento lúdico = `primary/primary-container` (ámbar/miel). Resto en grises tierra (`secondary/tertiary`). Nunca compite con CTAs — vive en feedback y vitrina, no en el dashboard hero.
- **Tokens:**
  - `--reward` → `primary-container` #E8B06F (miel, +XP, monedas). `--reward-foreground` → `#472a00`.
  - `--rank-1` → `#ffcd97` (primary, oro), `--rank-2` → `#c9c6c2` (secondary, plata), `--rank-3` → `#e9d2c6` (tertiary, bronce) — desaturados dentro de DESIGN.md.
  - `--progress-track` → `surface-container-highest` #40322c, `--progress-fill` → `primary` #ffcd97.
- **Componentes:**
  - `LevelBadge` — texto `label-md` (Manrope 12px 600 0.05em uppercase) + barra `h-1.5 rounded-full` sobre `muted`. Siempre en header, quieto.
  - `RewardPill` — `rounded-full px-2.5 py-0.5 bg-secondary text-secondary-foreground text-xs` con `+12` animado solo en toast/cierre.
  - `Vitrina` — grid `gap-md` celdas `aspect-square rounded-lg border border-outline-variant bg-surface-container/60`; vacías `border-dashed` crema 20% — artesanía, no brillo.
  - `StreakDot` / rank — `size-1.5 rounded-full` (`primary` si vivo, `outline-variant` si no). Avatares activos con `ring-1 ring-primary/40`.
- **Reglas:** Dashboard = 0 gamificación salvo LevelBadge. Sala/Rating/Cierre = recompensa. Nunca `amber` + `chart` + `destructive` juntos en una vista. Espacio como jerarquía (`xxl` 48px entre secciones, `md/lg` 16/24px dentro de cards).
