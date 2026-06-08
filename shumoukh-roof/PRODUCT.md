# Product

## Register

product

## Users

Roofing contractors and foremen running field operations. They work on construction sites, often on scaffolding, using mobile devices with one hand (thumbs). They need to scan costs, track workers, estimate materials, and send invoices quickly under harsh outdoor lighting. The interface must work in bright sun and dim site offices alike.

## Product Purpose

Shumoukh ERP is a field tool for roofing project management: material estimation (tile and steel quantities), project tracking, worker management, and invoicing. It replaces paper notebooks and mental arithmetic with a digital foreman's logbook. Success means a contractor can price a roof, dispatch workers, and invoice a client without leaving the site.

## Brand Personality

Utilitarian, industrial, precise. The aesthetic draws from a construction foreman's logbook: ruled, high-contrast, built for fast scanning. Numbers lead; decoration follows strict utility. Every visual choice answers one question: does this help a contractor read a cost, track a worker, or send an invoice faster?

## Anti-references

- SaaS-generic aesthetics: glassmorphism, purple gradients, bouncing card reveals
- Cream/sand/beige body backgrounds (the saturated AI default)
- Gradient text, pill-shaped buttons, soft diffuse shadows
- Tiny uppercase tracked eyebrow labels on every section
- Numbered section markers as default scaffolding
- Identical icon-card grids
- Decorative motion that doesn't convey state
- Cool-spectrum colors (purple, magenta, teal); palette is warm earth exclusively
- Display fonts in UI labels, buttons, or data
- Nesting cards inside cards
- Modals used as first thought before inline alternatives

## Design Principles

1. **Numbers first, decoration last.** The interface is a tool. Data density and scanability beat visual complexity. Monospace for all costs, quantities, and measurements.

2. **One handwriting, maximum legibility.** One font family (Noto Kufi Arabic) carries the entire interface through weight contrast. Weight-900 for all headings and data. The foreman's logbook has one pen, not a type specimen.

3. **Material is the metaphor.** Every color maps to a physical roofing material (terracotta = clay tile, olive = vegetation, earth = ground). A new color earns its place only if it can be named after something on a construction site.

4. **Flat by default, depth on demand.** Surfaces separate through color contrast, not drop shadows. Shadows appear only in response to interaction (hover, focus, elevation). The interface is quiet until the user touches it.

5. **RTL-first, mobile-capable.** Arabic is the primary language. Layout, typography, and motion direction flow right-to-left. Touch targets are large enough for a foreman's thumb on a scaffold.

## Accessibility & Inclusion

- WCAG AA minimum; body text contrast >= 4.5:1, placeholders >= 4.5:1
- Touch targets >= 44px on mobile
- All animations have `prefers-reduced-motion` fallbacks
- Keyboard navigation for all interactive elements
- Arabic-first with RTL layout and direction attributes
- Proper ARIA labels and semantic HTML throughout
