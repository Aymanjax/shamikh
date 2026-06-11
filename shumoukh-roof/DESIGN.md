---
name: Shumoukh ERP
description: RTL Arabic roofing project management — estimation, geometry, worker tracking, and invoicing
colors:
  primary: "#c2703e"
  primary-deep: "#b0632e"
  primary-soft: "#f5e6d8"
  olive: "#6b7c5e"
  olive-deep: "#57664c"
  olive-soft: "#e8ede4"
  neutral-bg: "#f5f0eb"
  neutral-card: "#faf7f4"
  neutral-border: "#e0d5c8"
  neutral-divider: "#c4b8a8"
  ink-primary: "#3d3427"
  ink-secondary: "#6b5e4f"
  ink-muted: "#8a7e6e"
  ink-inverse: "#faf7f4"
  surface-dark: "#1a1510"
  surface-nav: "#2c2418"
typography:
  display:
    fontFamily: "Noto Kufi Arabic, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.25rem, 3vw, 1.5rem)"
    fontWeight: 900
    lineHeight: 1.3
  body:
    fontFamily: "Noto Kufi Arabic, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Noto Kufi Arabic, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.05em"
  mono:
    fontFamily: "JetBrains Mono, Cascadia Code, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 900
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary-deep}"
    textColor: "#faf7f4"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "#b0632e"
  button-accent:
    backgroundColor: "{colors.primary}"
    textColor: "#faf7f4"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.label}"
  input:
    backgroundColor: "#faf7f4"
    textColor: "#2c2418"
    rounded: "12px"
    padding: "10px 16px"
    typography: "{typography.body}"
  input-focus:
    backgroundColor: "#faf7f4"
    textColor: "#2c2418"
    rounded: "12px"
  card:
    backgroundColor: "{colors.neutral-card}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
  sidebar:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-inverse}"
---

# Design System: Shumoukh ERP

## 1. Overview

**Creative North Star: "دفتر المقاول — The Foreman's Logbook"**

Shumoukh ERP is a field tool dressed as an interface. The aesthetic draws from a construction foreman's logbook: ruled, high-contrast, built for fast scanning under harsh site lighting. Numbers lead. Decoration follows strict utility. Every visual choice answers one question: does this help a contractor read a cost, track a worker, or send an invoice faster?

The palette is material and literal: terracotta for the clay tiles on every roof, olive for the landscape outside the site office, earth tones for the ground the crew walks on. Warmth comes from the physical material palette, not from soft gradients, cream backgrounds, or glass effects. This system explicitly rejects SaaS-generic aesthetics: no glassmorphism, no purple gradients, no bouncing card reveals, no tiny tracked eyebrow labels on every section, no gradient text, no identical icon-card grids.

The interface is RTL-first. Arabic is the primary language; layout, typography, and motion direction flow right-to-left by default. Mobile-capable means touch targets large enough for a foreman's thumb on a scaffold.

**Key Characteristics:**

- High-contrast, fast-scan typography with font-weight 900 for all headings and numeric data
- Flat by default with faint 1-2px industrial shadows appearing only on hover or state change
- 3px accent right-border (RTL: right edge) as the primary card signature, replacing drop shadows
- Warm earth tonality through material colors, not through tinted body backgrounds
- Sharp 4px radius on interactive elements; 6px on cards; no pill shapes
- Monospace for all cost, quantity, and measurement data

## 2. Colors: The Material Palette

The palette draws from the physical materials of a roofing construction site: fired terracotta, olive vegetation, and earth tones at every depth. Colors are grouped by role, not by hex order.

### Primary
- **Baked Terracotta** (#c2703e, terracotta-400): The primary accent. Used on CTA buttons, active navigation items, selection highlights, and the 3px card right-border accent. Saturation anchors the page; rarity is the point. Applied to 10-15% of any given screen.
- **Deep Terracotta** (#b0632e, terracotta-500): The pressed state of primary accent. Button hover/pressed, active sidebar item, and the strong form of the accent when contrast needs reinforcement on dark surfaces.
- **Soft Terracotta** (#f5e6d8, terracotta-100): The accent's background tint. Used for selected rows, tag/chip backgrounds, and the terracotta icon container. Never used as a body background.

### Secondary
- **Field Olive** (#6b7c5e, olive-500): The secondary accent. Used for success states, positive financial indicators, completed project markers, and the primary button variant (olive-700). One full step deeper than the token for button text contrast on white.
- **Deep Olive** (#57664c, olive-600): Pressed olive state. Primary button hover, completed status emphasis.
- **Soft Olive** (#e8ede4, olive-100): Olive's background tint. Used for success badges, completed tags, and the olive icon container.

### Neutral
- **Earth Paper** (#f5f0eb, earth-100, `--surface-bg`): The page background. A warm off-white with minimal chroma toward the earth hue. Never pure white; never cream/sand/beige.
- **Card White** (#faf7f4, `--surface-card`): Card and elevated surface background. Lighter than the page background so cards float forward without shadows.
- **Earth Border** (#e0d5c8, earth-200): The default border color for cards, inputs, dividers. Warm but low-contrast; recedes behind content.
- **Earth Divider** (#c4b8a8, earth-300): For section separators, table borders, and the muted form of borders.
- **Dark Earth** (#1a1510, deep-earth-900, `--surface-sidebar`): Sidebar and mobile bottom nav background. Near-black with earth warmth. The deepest surface in the system.
- **Nav Earth** (#2c2418, earth-900, `--surface-nav`): Secondary dark surface for navigation elements, hover backgrounds on dark surfaces.

### Ink
- **Ink Primary** (#3d3427, earth-800): Body text and headings on light backgrounds. Dark brown, not black. Contrast ratio ≥7:1 against card white.
- **Ink Secondary** (#6b5e4f, warm-gray-600): Supporting text, descriptions, secondary labels. 4.8:1 against card white.
- **Ink Muted** (#8a7e6e, warm-gray-500): Placeholder text, disabled states, tertiary labels. Still hits 4.5:1 against #faf7f4 per WCAG AA for placeholder text.
- **Ink Inverse** (#faf7f4): Text on dark surfaces (sidebar, mobile nav). White-on-dark with ≥10:1 contrast.

### Named Rules

**The Material Rule.** Every color in the palette maps to a physical roofing material. Terracotta = fired clay tile. Olive = vegetation. Earth = ground. If a new color can't be named after something on a construction site, it doesn't belong in the system.

**The Terracotta Restraint Rule.** The primary accent appears on ≤15% of any given screen area. A terracotta card border is 3px; a terracotta button is one per section. The accent earns attention through scarcity, not saturation.

**The No Cream Rule.** The body background is never cream, sand, bone, linen, parchment, or any warm-neutral band above chroma 0.02. The earth paper (#f5f0eb) is the only allowed page background. "Warmth" is carried by the terracotta accent and olive secondary, not by the body bg.

## 3. Typography

**Display Font:** Noto Kufi Arabic (with Segoe UI, system-ui, -apple-system, sans-serif fallback)
**Mono Font:** JetBrains Mono (with Cascadia Code, Consolas, monospace fallback)

**Character:** Kufi's geometric precision paired with JetBrains Mono's technical clarity. The Kufi style is architectural and structured: its straight lines and right angles mirror the geometry of roof frames and tile grids. One font family carries the entire interface; weight contrast (400 to 900) creates hierarchy without adding typefaces. Mono is reserved exclusively for numeric data: costs, quantities, measurements, calculations.

### Hierarchy

- **Display** (font-weight 900, clamp(1.25rem, 3vw, 1.5rem) / 24px, line-height 1.3): Page titles. `text-2xl font-black tracking-tight`. Used once per screen; the loudest typographic element.

- **Headline** (font-weight 900, 1.25rem / 20px, line-height 1.3): Section headers within a page. `text-xl font-black tracking-tight`. Clear section starts without over-sized hero treatment.

- **Title** (font-weight 900, 0.875rem / 14px, line-height 1.4): Card titles, modal titles, subsection labels. `text-sm font-black`. The workhorse heading weight.

- **Body** (font-weight 400, 0.875rem / 14px, line-height 1.6): Paragraphs, descriptions, form content. `text-sm`. Max line length capped at 70ch via container width, not a CSS property (the layout grid enforces it).

- **Label** (font-weight 700, 0.75rem / 12px, letter-spacing 0.05em): Form labels, input hints, metadata. `text-xs font-bold`. Uppercase reserved for short Arabic labels (≤3 words) and badges only.

- **Micro** (font-weight 700, 10px): Subscription badges, timestamp chips, status indicators. Not for body copy.

- **Mono Data** (font-weight 900, 0.875rem / 14px, line-height 1.4): `font-mono text-sm font-black`. All cost, quantity, area, and measurement values. The weight-900 mono creates instant visual distinction between narrative text and hard numbers.

### Named Rules

**The Weight-900-Only Rule.** All headings, labels, and data values use font-weight 900 (`font-black`). `font-bold` (700) is reserved for interactive elements and sub-labels. `font-medium` is for secondary descriptions only. Never use font-weight 400 for anything a user needs to read quickly.

**The Two-Font Cap Rule.** Sans (Noto Kufi Arabic) + Mono (JetBrains Mono). No third typeface. The Kufi family carries the entire interface through weight contrast alone. Adding a serif or display face would violate the foreman's-logbook constraint: a logbook has one handwriting, not a type specimen.

**The RTL-First Rule.** All typography flows right-to-left. `direction: rtl` on `body`. Motion directions, text alignment, and icon placement respect the RTL reading order. ChevronRight points left in RTL (back), ChevronLeft points right (forward).

## 4. Elevation

The system uses a "subtle industrial" elevation philosophy: faint 1-2px shadows that feel like physical material overlap, not soft UI blur. The aesthetic reference is a tile overlapping another tile: a hard edge with minimal shadow depth, not a floating card with a diffuse glow.

At rest, surfaces are flat. Cards separate from the page background through color contrast (card white #faf7f4 on earth paper #f5f0eb), not shadow. Shadows appear only as a response to state: hover lifts a card 2px with a faint shadow; modals add a backdrop blur and a subtle scale-in. No ambient-only shadows; every shadow is tied to an interaction.

### Shadow Vocabulary

- **Card Rest** (`box-shadow: 0 1px 2px rgba(61, 52, 39, 0.04)`): Barely perceptible. The card's white-on-earth color contrast does the heavy lifting.
- **Card Hover** (`box-shadow: 0 2px 6px rgba(61, 52, 39, 0.06)`): A 2px lift. Feels like a tile sliding slightly forward. Paired with border-color shift from earth-200 to earth-300.
- **Sidebar** (`box-shadow: 4px 0 8px rgba(44, 36, 24, 0.08)`): The only structural shadow. Separates the dark sidebar from the light content area. Rendered on the left edge (the RTL "inside" edge).
- **Button** (`box-shadow: 0 1px 2px rgba(61, 52, 39, 0.06)`): Button press shadow. Sinks on active state.

### Named Rules

**The Flat-At-Rest Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, elevation, focus). The card's 3px accent right-border is the primary depth signal, replacing drop shadows as the default card signature.

**The No-Soft-Shadow Rule.** Every shadow in the system uses `rgba(61, 52, 39, ...)` — the earth-800 ink color. Shadows are the same hue as the text, not a neutral gray. Maximum blur radius is 8px. Never use diffuse 24px+, multi-layer, or colored-glow shadows.

## 5. Components

### Buttons

**Character:** Confident and tactile. Sharp 4px corners, thick right-border accent, bold weight. Buttons feel like physical toggles on site equipment, not pillowy web buttons.

- **Shape:** `rounded-sm` (4px). No pill shapes. No fully-rounded.
- **Primary (olive-700):** `bg-olive-700 text-white hover:bg-olive-800 active:bg-olive-900 border-r-3 border-olive-900`. The main action on a screen. Used for save, create, submit. Olive carries the "go" signal without the urgency of terracotta.
- **Secondary:** `bg-white text-earth-700 border border-earth-300 hover:bg-earth-50 hover:border-earth-400 active:bg-earth-100`. The neutral companion. Cancel, back, secondary actions.
- **Accent (terracotta-500):** `bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 border-r-3 border-terracotta-700`. High-attention actions: delete confirmation, premium upgrade, destructive-but-not-red.
- **Ghost:** `bg-transparent text-warm-gray-500 hover:bg-earth-100 hover:text-warm-gray-700 active:bg-earth-200`. Inline actions, toolbar buttons, icon-only buttons.
- **Sizes:** sm (px-3 py-1.5 text-xs), md (px-4 py-2.5 text-sm), lg (px-6 py-3 text-base). Gap scales with size: gap-1.5 / gap-2 / gap-2.5.
- **Hover / Focus:** `transition-all duration-150`. All variants shift background and border on hover. Active state darkens further. Disabled: `opacity-40 pointer-events-none`.
- **Icon support:** Left icon slot (renders right in RTL) via `shrink-0` span. Icon sizes: w-3.5 h-3.5 (sm), w-4 h-4 (md).

### Cards / Containers

**Character:** A ruled notebook page. White surface, earth border, terracotta right-edge accent. The 3px accent border is the identifying mark of a Shumoukh card.

- **Corner Style:** `rounded` (6px). Sharper than the 4px button radius so cards feel like containers, not controls.
- **Background:** `var(--surface-card)` (#faf7f4).
- **Border:** `1px solid #e0d5c8` (earth-200). The right border is overridden to `3px solid var(--accent-terracotta)` (#c2703e).
- **Shadow:** `var(--shadow-card)` at rest; `var(--shadow-card-hover)` on hover.
- **Hover:** `box-shadow` lifts 2px; border color shifts to `#c4b8a8` (earth-300); right-border shifts to `var(--accent-terracotta-border)` (#d4844f).
- **Internal Padding:** `p-4` (16px) default; `p-5` (20px) for modals and larger cards.
- **Nesting:** Never nest cards inside cards. One `.earth-card` per logical container. If content needs subdivision, use borders or background tints, not nested cards.

### Inputs / Fields

**Character:** Soft-rounded (12px) white field with earth borders. The 12px radius is the softest corner in the system; it signals "type here" through shape contrast with the sharp 4px buttons.

- **Style:** `bg-white border-2 border-earth-200 rounded-xl py-2.5 px-4 text-sm text-earth-900`.
- **Placeholder:** `placeholder:text-earth-400` (#a89888). 4.6:1 against white background; meets WCAG AA for placeholder text.
- **Focus:** `border-terracotta-400 ring-2 ring-terracotta-100`. A warm terracotta glow replaces the browser default blue outline.
- **Error:** `border-red-300 focus:border-red-400 focus:ring-red-100`. Red ring replaces terracotta ring.
- **Disabled:** `bg-earth-50 text-earth-500 cursor-not-allowed`.
- **Icon:** Right-side icon slot (RTL: right = start of text). `pr-10` padding when icon present. Icon color: `text-earth-400`.
- **Label:** Above the input: `block text-xs font-bold text-earth-700`. 8px gap (`space-y-1.5`).
- **Error text:** Below the input: `text-[11px] text-red-500 font-medium`.

### Navigation

**Sidebar (desktop):** Dark surface (`bg-deep-earth-900 border-l border-deep-earth-700`), sticky, full viewport height. Collapsible: 240px expanded (`w-60`), 64px collapsed (`w-16`), with `transition-all duration-300`.
- **Active item:** `bg-terracotta-500/10 text-terracotta-400 border-r-2 border-terracotta-500`. 10% opacity terracotta background on the dark surface.
- **Inactive item:** `text-earth-500 hover:text-earth-300 hover:bg-deep-earth-800 border-r-2 border-transparent`.
- **Logo:** `w-8 h-8 rounded-sm bg-terracotta-500 border-l-2 border-terracotta-300` with white Home icon.
- **Icons:** `w-5 h-5 shrink-0` in both collapsed and expanded states.

**Floating Command Bar (mobile):** Fixed `bottom-4`, centered horizontally, `max-w-xl`. `bg-deep-earth-900 border border-deep-earth-700 rounded-sm`. Distributes nav items with `justify-around`.
- **Active item:** `bg-terracotta-500/10 text-terracotta-400 border-t-2 border-terracotta-500` (top border, not right, for horizontal bar).
- **Item layout:** Icon above label, `flex-col`, `min-w-[48px]` touch target. Icons: `w-4 h-4`. Labels: `text-[8px] font-bold`.
- **Collapse:** Toggles to a single ChevronUp button at `bottom-6`.

### Modal

- **Backdrop:** `bg-black/50 backdrop-blur-sm`. Click to close.
- **Panel:** `bg-white border border-earth-200 rounded-sm`. Sizes: sm (max-w-sm) through xl (max-w-xl).
- **Animation:** Framer Motion AnimatePresence. Backdrop fades (opacity 0→1, 150ms). Panel scales in (0.96→1, y: 10→0, 200ms easeOut).
- **Header:** `px-5 py-4 border-b border-earth-200`. Title: `text-sm font-black text-earth-900`. Close button: `p-1.5 rounded-sm`, X icon `w-4 h-4`.
- **Body:** `p-5`.

### Empty State

- **Icon:** `size-14 rounded-full bg-earth-100 border-2 border-earth-200`. Inside: `size-6 text-earth-400` Lucide icon.
- **Title:** `text-sm font-black text-earth-700 mb-1`.
- **Description:** `text-xs text-earth-400 max-w-xs mb-4`.
- **Action:** The slot renders the primary CTA button for the empty state.

### Tags / Chips

- **Shape:** `rounded` (3px). Angular, not pill-shaped. Feels like a labeled bin tag.
- **Terracotta tag:** `bg-accent-terracotta-soft text-accent-terracotta border border-accent-terracotta-border`.
- **Olive tag:** `bg-accent-olive-soft text-accent-olive border border-accent-olive-border`.
- **Amber tag:** `bg-accent-amber-soft text-accent-amber border border-accent-amber-border`.

### Toggle

- **Style:** `bg-terracotta-500` when checked, `bg-earth-200` when off. Sharp corners. No pill shape.

## 6. Do's and Don'ts

Every anti-reference from PRODUCT.md is enforced here as a concrete visual guardrail.

### Do:

- **Do** use font-weight 900 (`font-black`) for all headings, labels, and numeric data values. Weight contrast is the primary hierarchy tool.
- **Do** use the 3px terracotta right-border (`border-r-3 border-terracotta-500`) as the card signature. Cards are white with one colored edge, not floating with shadows.
- **Do** use monospace (`font-mono font-black`) for every cost, quantity, area, and measurement value. Numbers must look different from prose.
- **Do** use `rounded-sm` (4px) for interactive elements and `rounded` (6px) for containers. Never mix radii randomly within a component.
- **Do** separate surfaces through color contrast (card white #faf7f4 on earth paper #f5f0eb), not through drop shadows. Shadows are for hover state only.
- **Do** respect `prefers-reduced-motion: reduce`. All animations must have a reduced-motion fallback: instant transitions or crossfades.
- **Do** keep touch targets ≥48px on mobile (the FloatingCommandBar's `min-w-[48px]`). Contractors on site use thumbs.
- **Do** use `text-wrap: balance` on page titles and section headers for even line lengths in Arabic.
- **Do** keep the max content width at `max-w-7xl` (1280px) with responsive padding: p-4 (mobile), p-6 (md), p-8 (lg).

### Don't:

- **Don't** use cream, sand, beige, bone, linen, parchment, or any near-white warm-tinted body background. The page background is #f5f0eb. Never warmer, never creamier.
- **Don't** use glassmorphism, backdrop-blur decorative cards, or frosted glass effects. The `glass-card` class redirects to `earth-card` internally; the name is a migration alias, not a permission slip.
- **Don't** use gradient text (`background-clip: text` with any gradient). Color comes from solid fills; emphasis comes from weight and size.
- **Don't** use `border-left` or `border-right` greater than 3px for decorative stripes on cards. The 3px terracotta right-border is the system's one accent-border signature. Anything thicker is a side-stripe anti-pattern.
- **Don't** use tiny uppercase tracked eyebrows ("ABOUT", "PROCESS", "PRICING") above sections. No eyebrow labels. Headings carry their own weight.
- **Don't** use numbered section markers (01/02/03) as default scaffolding. Numbers earn their place only when the section is genuinely sequential (a real 3-step process).
- **Don't** use identical icon-card grids where every card has the same shape, same icon size, same heading+text pattern. Vary card content or use a different layout.
- **Don't** use purple, magenta, teal, or any cool-spectrum color. The palette is warm earth exclusively: terracotta, olive, earth, amber. Cool colors would break the material metaphor.
- **Don't** use pill-shaped buttons, fully-rounded inputs, or round avatars. The system is sharp-cornered. Rounded-full is reserved for the empty-state icon circle only.
- **Don't** nest cards inside cards. One `.earth-card` per logical container. For subdivisions, use border separators or background tint shifts.
- **Don't** use font-weight 400 for any text a user needs to read at a glance. Labels are 700, headings are 900, data is 900. 400 is for long-form prose only.
- **Don't** add a third typeface. The cap is two: Noto Kufi Arabic (sans) + JetBrains Mono (mono). No serif, no display, no handwriting.

---

## 7. Cockpit Layer (Engineering Dark Mode — current primary shell)

A deliberate identity pivot requested by the owner: the entire app now renders inside the
"cockpit" engineering shell (`src/styles/cockpit.css`, `src/components/cockpit/`).
The warm-earth system above remains the semantic source of truth; the cockpit re-maps it.

### Mechanism
- Everything is scoped under `.cockpit-root`. Tailwind v4 utilities resolve through
  `var(--color-*)`, so the cockpit redefines the palette variables once and every page
  re-skins automatically. No per-page styling.
- Inversion rule: light surfaces (earth-50/100, white) become graphite/steel
  (#0e1116, #151a21, #1b222b); dark ink (earth-800/900) becomes warm white (#ece6dc).
  Terracotta becomes the "instrument light" amber (#ed9450) — warm laser on cold steel,
  NOT the cyan-terminal cliché.
- `--color-paper` (#faf7f4) never changes; use `text-paper` for text that must stay light
  in both themes. Use `text-earth-100` on accent-colored (terracotta/olive/amber/red/earth
  400-900) backgrounds: it resolves light-on-dark in the light theme and dark-on-light in
  the cockpit.

### Components
- `CockpitShell`: blueprint-grid canvas, top instrument rail (live dot, mono clock,
  notifications). Replaces Sidebar + FloatingCommandBar in `AppLayout` on all viewports.
- `RadialCommandMenu`: bottom-center hub fanning navigation nodes on an arc with dashed
  hairline connectors (SVG pathLength animation), expo-out stagger, Escape/scrim close,
  reduced-motion fallbacks. THE signature interaction; do not replace it with a sidebar.
- `CockpitConsole` (`/`): primary readout + measurement ruler + paid/pending bar +
  module tiles + ruled ledger. Monospace numerals everywhere (`.mono`, tnum + slashed zero).

### Rules specific to the cockpit
- Sharp edges only: border-radius 2-3px. Panels separate by hairlines
  (`rgba(233,221,208,.07-.16)`), never by drop shadows.
- Motion is mechanical: `cubic-bezier(0.16,1,0.3,1)` or `(0.7,0,0.2,1)`. No bounce.
- The drawing canvas (BuildingCanvas / 3D viewers) stays light — a drafting sheet on a
  dark instrument desk (CAD convention). Never dark-skin the drawing surface.
- Semantic z-scale: instrument 20 → scrim 80 → radial 90 → toast 100.
