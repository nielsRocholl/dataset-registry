---
  Apply this skill when building any UI, component, artifact, web app, dashboard, landing page,
  or desktop interface in 2026. Triggers on: "make it look good", "design this", "build a UI for",
  "create an app", "style this component", "modern design", "clean interface", or any frontend
  task where aesthetics and interaction quality matter. This skill encodes the current design
  zeitgeist — do not rely on pre-2025 design intuitions. Always read this before writing
  layout, color, typography, animation, or interaction code.
name: claude-design
model: inherit
description: >
---

# Design in 2026: A Field Guide for Coding & Design Agents

> Written from the perspective of the Claude Desktop App design team at Anthropic.
> This document is opinionated. That's the point.

---

## The Vibe Shift

The 2020–2024 era of UI design is over. Its signature moves — purple-to-blue gradients, glassmorphism cards, Inter everywhere, rounded-rect everything, "minimal" meaning "empty" — are now visual clichés. Users have developed strong pattern fatigue from a decade of Figma-templated sameness.

2026 design is defined by **deliberate tension**: high-information density paired with breathing room. Rigorous typographic systems paired with expressive, almost editorial layouts. Calm neutral palettes broken by single moments of color intensity. Interfaces that feel handcrafted, not generated.

The goal: **every screen should feel authored**, not assembled.

---

## Part I — Typography

Typography is doing the heaviest lifting in 2026 design. It's not decoration. It's architecture.

### Rules

**1. Use optical sizing aggressively.**
`font-optical-sizing: auto` and manual `font-variation-settings` are standard. Headlines should feel different from body text not just in size but in weight axis, width, and optical correction.

**2. Pair contrasting type personalities.**
The pairing logic: one workhorse sans (neutral, high-legibility, variable) + one expressive display face (editorial, distinctive, unexpected). Never two serifs. Never two humanist sans. Contrast is the point.

**3. Recommended pairings for 2026:**
- `Instrument Serif` (display) + `Geist` (body) — editorial precision
- `Garamond Premier Pro` (display) + `IBM Plex Mono` (body) — archival intelligence
- `Neue Haas Grotesk` (display) + `Lora` (body) — confident and warm
- `Playfair Display` (display) + `DM Sans` (body) — classical meets functional
- `Fraunces` (display, optical) + `Epilogue` (body) — literary, contemporary
- `Syne` (display) + `Figtree` (body) — geometric with personality

**Never use:** Inter as your primary face, Roboto, SF Pro in web contexts, system-ui as a design choice (only as a fallback), Space Grotesk (overexposed), Raleway.

**4. Type scale is a design system.**
Use a modular scale (1.25 or 1.333 ratio). Not arbitrary pixel sizes. Every size should have a semantic role.

```css
--text-xs:   0.694rem;
--text-sm:   0.833rem;
--text-base: 1rem;
--text-lg:   1.2rem;
--text-xl:   1.44rem;
--text-2xl:  1.728rem;
--text-3xl:  2.074rem;
--text-4xl:  2.488rem;
--text-5xl:  2.986rem;
--text-hero: clamp(3rem, 8vw, 6rem);
```

**5. Line length is sacred.**
Prose: 60–75 characters. UI labels: unrestricted. Never let a reading column exceed 80ch. Use `max-width: 65ch` on paragraph containers, not fixed pixels.

**6. Leading and tracking matter.**
Headlines: tight tracking (`letter-spacing: -0.03em` to `-0.05em`). Body: default or very slightly loose. Subheadings: `letter-spacing: -0.01em`. Mono/code: `letter-spacing: 0`.

---

## Part II — Color

### The 2026 Color Philosophy

**Restraint + one moment of intensity.**

The dominant palette is near-neutral: warm grays, cool whites, off-blacks. Then one color — used sparingly, intentionally, almost sparingly — that defines the product's personality. This is the "ink on paper" model: the page doesn't compete with the content.

Gradients are not dead, but gradient-as-background is. Gradients now live in:
- Micro-elements (icon fills, button hover states)
- Data visualization
- Ambient background effects (subtle, low-opacity)

### Color System Architecture

```css
/* Neutrals — the foundation. Warm or cool, never pure gray */
--neutral-50:  #FAFAF8;   /* warm white */
--neutral-100: #F5F4F1;
--neutral-200: #E8E6E1;
--neutral-300: #D1CEC8;
--neutral-400: #A8A49C;
--neutral-500: #7C7870;
--neutral-600: #5A5650;
--neutral-700: #3D3A35;
--neutral-800: #252320;
--neutral-900: #131210;
--neutral-950: #0A0908;

/* Brand accent — one color, used surgically */
--accent:      #D4622A;   /* example: terracotta */
--accent-soft: color-mix(in oklch, var(--accent) 15%, transparent);
--accent-text: color-mix(in oklch, var(--accent) 85%, var(--neutral-900));

/* Semantic */
--color-success: oklch(65% 0.15 145);
--color-warning: oklch(75% 0.18 75);
--color-error:   oklch(55% 0.20 25);
--color-info:    oklch(60% 0.15 240);
```

### Dark Mode

Dark mode in 2026 is not `#000000` backgrounds. It's deep, warm-tinted darks:

```css
/* Dark surface scale — never pure black */
--surface-base:    #0F0E0D;
--surface-raised:  #161513;
--surface-overlay: #1E1C1A;
--surface-sunken:  #0A0908;

/* Borders in dark mode — visible but subtle */
--border-subtle:   rgba(255, 255, 255, 0.06);
--border-default:  rgba(255, 255, 255, 0.10);
--border-strong:   rgba(255, 255, 255, 0.18);
```

### Color Functions to Use

```css
/* oklch is the 2026 standard — perceptually uniform, wide gamut */
color: oklch(55% 0.18 280);

/* color-mix for tinting and alpha */
background: color-mix(in oklch, var(--accent) 8%, var(--surface-base));

/* light-dark() for effortless theming */
color: light-dark(var(--neutral-900), var(--neutral-100));
```

---

## Part III — Layout & Spatial Composition

### The Grid Is Not Sacred

CSS Grid is powerful. Use it. But don't let the grid become a prison of equal-width columns. 2026 layouts use **asymmetric grids**, **named areas**, and **subgrid** to create visual hierarchy through space, not just size.

```css
.layout {
  display: grid;
  grid-template-columns: 1fr 2.5fr 1fr;
  grid-template-rows: auto;
  gap: clamp(1rem, 3vw, 3rem);
}

/* Subgrid for aligned inner components */
.card-grid {
  display: grid;
  grid-template-columns: subgrid;
}
```

### Spatial Principles

**Density is a feature, not a bug.**
The 2020s tendency toward empty space has swung back. Dense, information-rich UIs are back — think Bloomberg terminals made beautiful. The key is **structured density**: clear visual grouping, strong type hierarchy, and intentional white space *between* sections (not inside them).

**Breathing room is architectural.**
Use `padding-block` and `padding-inline` as section-level design decisions. A section's internal rhythm shouldn't compete with inter-section spacing. Use a spacing scale:

```css
--space-1:  0.25rem;
--space-2:  0.5rem;
--space-3:  0.75rem;
--space-4:  1rem;
--space-6:  1.5rem;
--space-8:  2rem;
--space-12: 3rem;
--space-16: 4rem;
--space-24: 6rem;
--space-32: 8rem;
```

**Overlap and layering create depth.**
Elements that overlap their containers, images that bleed across grid lines, text that sits over imagery — these signal intentional design rather than template filling.

```css
/* Z-layering as design */
.hero-text {
  position: relative;
  z-index: 2;
  margin-top: -4rem;  /* intentional overlap */
}
```

### Container Queries Are Standard

Stop using viewport breakpoints for component-level design. Components should respond to their container:

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card-layout {
    grid-template-columns: 1fr 2fr;
  }
}
```

---

## Part IV — Motion & Animation

### The Hierarchy of Motion

Motion has a strict priority order. Violating it creates chaos:

1. **Functional motion** — communicates state change (loading, success, error). Never omit.
2. **Navigational motion** — communicates spatial relationship (page transitions, drawer opens). Use sparingly.
3. **Expressive motion** — adds delight (hover effects, entrance animations). Use very sparingly.
4. **Ambient motion** — background, environmental (gradients, particles). Use almost never.

### Easing in 2026

The era of `ease-in-out` defaults is over. Use physics-based and custom bezier curves:

```css
/* The standard toolkit */
--ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-quart:  cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-expo:    cubic-bezier(0.7, 0, 0.84, 0);
--ease-spring:     linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25%, 0.849 31.1%, 0.937 38.1%, 0.968 41.8%, 0.991 45.8%, 1.006 50.2%, 1.014 55%, 1.015 57.9%, 1.011 65.8%, 1.004 76.6%, 1 100%);

/* Duration scale */
--duration-instant:  50ms;
--duration-fast:    150ms;
--duration-normal:  250ms;
--duration-slow:    400ms;
--duration-slower:  600ms;
```

### The One Well-Orchestrated Entrance

Instead of animating every element, pick **one moment** per view/page and orchestrate it beautifully. A staggered entrance of a content section is more impressive than 20 individual micro-animations.

```css
/* Staggered entrance — the right way */
.item { opacity: 0; transform: translateY(12px); }
.item:nth-child(1) { animation: enter 400ms var(--ease-out-quart) 0ms forwards; }
.item:nth-child(2) { animation: enter 400ms var(--ease-out-quart) 60ms forwards; }
.item:nth-child(3) { animation: enter 400ms var(--ease-out-quart) 120ms forwards; }

@keyframes enter {
  to { opacity: 1; transform: translateY(0); }
}
```

### Scroll-Driven Animations (CSS-native)

```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.reveal-on-scroll {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}
```

### Respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Part V — Component Design Patterns

### Buttons

2026 buttons are not pill-shaped or rounded-rect by default. They match the design system's geometric language.

```css
.btn {
  /* Geometric, not pill */
  border-radius: 4px;  /* or 0 for brutalist, or 6px for soft */
  
  /* Padding that feels crafted */
  padding: 0.625rem 1.25rem;
  
  /* Typography that's intentional */
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: 0.01em;
  
  /* Transition only what changes */
  transition: background 150ms var(--ease-out-quart),
              transform 100ms var(--ease-out-quart),
              box-shadow 150ms var(--ease-out-quart);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in oklch, var(--accent) 30%, transparent);
}

.btn:active {
  transform: translateY(0);
  transition-duration: 50ms;
}
```

### Cards

Cards in 2026 are not containers with border-radius and box-shadow. They're **micro-layouts** — internally structured, contextually responsive.

```css
.card {
  /* Border over shadow — more precise */
  border: 1px solid var(--border-default);
  border-radius: 8px;
  
  /* Subtle background separation */
  background: light-dark(
    color-mix(in oklch, white 60%, var(--neutral-50)),
    var(--surface-raised)
  );
  
  /* No drop shadow by default; earn it with interaction */
  box-shadow: none;
  transition: border-color 200ms, box-shadow 200ms;
}

.card:hover {
  border-color: var(--border-strong);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}
```

### Inputs

```css
.input {
  /* Underline or full-border — choose one, commit */
  border: 1px solid var(--border-default);
  border-radius: 4px;
  background: transparent;
  
  padding: 0.625rem 0.875rem;
  font-size: var(--text-base);
  font-family: inherit;
  
  transition: border-color 150ms, box-shadow 150ms;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
```

### Loading States

Skeleton screens have replaced spinners for content loading. Spinners are for actions.

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-200) 25%,
    var(--neutral-100) 50%,
    var(--neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Part VI — Visual Texture & Atmosphere

### Noise and Grain

Flat design is dead again. Surfaces have texture. The most common treatment: subtle noise overlay that adds material quality without literal skeuomorphism.

```css
/* SVG noise filter approach */
.textured {
  position: relative;
}
.textured::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  border-radius: inherit;
}
```

### Borders as Design Elements

Borders are not afterthoughts. In 2026 design, they carry visual weight and define spatial relationships.

```css
/* Gradient border */
.gradient-border {
  border: 1px solid transparent;
  background: 
    linear-gradient(var(--surface-base), var(--surface-base)) padding-box,
    linear-gradient(135deg, var(--accent), transparent) border-box;
}

/* Hairline border */
--border-hairline: 0.5px solid var(--border-subtle);
```

### Shadows

Shadows in 2026 are colored, layered, and intentional — not `box-shadow: 0 4px 8px rgba(0,0,0,0.1)`.

```css
/* Layered shadow system */
--shadow-sm:
  0 1px 2px rgba(0,0,0,0.04),
  0 1px 4px rgba(0,0,0,0.04);

--shadow-md:
  0 2px 4px rgba(0,0,0,0.04),
  0 4px 8px rgba(0,0,0,0.06),
  0 8px 16px rgba(0,0,0,0.04);

--shadow-lg:
  0 4px 8px rgba(0,0,0,0.04),
  0 8px 16px rgba(0,0,0,0.06),
  0 16px 32px rgba(0,0,0,0.08),
  0 32px 48px rgba(0,0,0,0.04);

/* Colored accent shadow for elevated elements */
--shadow-accent:
  0 4px 16px color-mix(in oklch, var(--accent) 20%, transparent),
  0 1px 4px rgba(0,0,0,0.06);
```

---

## Part VII — The AI-Native Interface

Since this document is written for the Claude ecosystem, specific patterns for AI-native UIs deserve their own section.

### Principles

**1. Streaming is the primary interaction model.**
Text streams in. Design for it. Characters appear one at a time. Layout must not jump. Line heights must be stable. Containers must not resize as content fills them.

```css
.streaming-container {
  /* Stable height from the start */
  min-height: 1lh;
  
  /* Don't animate the text itself — let streaming do the work */
  /* DO animate the container's appearance */
}

/* Streaming cursor */
.streaming-cursor::after {
  content: '▋';
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: var(--accent);
  margin-left: 1px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
```

**2. Thinking states are first-class.**
The model thinking / loading state is part of the experience, not a spinner to minimize. Give it space and design.

**3. Markdown rendering must be beautiful.**
Prose response typography should be as well-designed as editorial content. Code blocks need syntax highlighting, copy affordances, and language labels. Tables need proper horizontal scrolling on mobile.

**4. Conversation rhythm guides layout.**
User messages and assistant messages have distinct visual identities. They shouldn't just be left vs. right alignment. Consider:
- Different background treatments
- Different type weights
- Clear visual separation between turns
- Timestamps that appear on hover, not cluttering the thread

**5. Actions are secondary to content.**
Copy, share, thumbs-up — these are secondary UI. They appear on hover or in a contextual menu. They never compete with the content itself.

---

## Part VIII — Anti-Patterns to Actively Avoid

These are **prohibited** in 2026 work:

| Anti-Pattern | Why It's Dead | What to Do Instead |
|---|---|---|
| Purple→blue gradient backgrounds | Overexposed, feels AI-generated | Warm neutrals with a single color accent |
| Glassmorphism main cards | Legibility nightmare, no longer novel | Solid surfaces with subtle border treatment |
| `border-radius: 9999px` on everything | Overly bubbly, childish in professional contexts | Match border-radius to design language: 0–12px |
| Inter as the sole typeface | Used in 90% of web UIs | Pair a display and body face with personality |
| `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` as default shadow | Flat, unconvincing | Layered, colored shadows or no shadow at all |
| Centered hero with gradient button | Template fatigue | Asymmetric, editorial layouts |
| Emoji as bullet points | Unprofessional noise | Typographic markers or custom SVG icons |
| Full-page loading spinners | Disorienting, slow-feeling | Skeleton screens, optimistic UI |
| All-caps for all headings | Strains legibility at scale | Reserve for labels, metadata, categories |
| `transition: all 0.3s ease` | Animates everything including layout, causes jank | Explicit property transitions with custom easing |
| `z-index: 9999` | Signals broken stacking context | Use a z-index scale (1, 10, 100, 1000) |
| `!important` in CSS | Technical debt, overrides system | Refactor specificity |

---

## Part IX — Implementation Checklist

Before shipping any UI in 2026, verify:

**Typography**
- [ ] Display font is distinctive, not generic
- [ ] Type scale uses modular ratio
- [ ] Line length controlled on reading text
- [ ] Letter-spacing tuned per size
- [ ] `font-optical-sizing: auto` applied

**Color**
- [ ] Using oklch for new color definitions
- [ ] Palette has ≤ 1 accent color used intentionally
- [ ] Dark mode uses warm-tinted dark surfaces
- [ ] Contrast ratios meet WCAG AA minimum (4.5:1 for body)
- [ ] `color-mix()` used for tints/alpha variants

**Layout**
- [ ] Grid uses `subgrid` where alignment matters
- [ ] Container queries for component responsiveness
- [ ] Spacing uses design-system scale
- [ ] No fixed pixel heights on containers that hold dynamic content

**Motion**
- [ ] `prefers-reduced-motion` respected
- [ ] Custom easing (not `ease-in-out`)
- [ ] One primary entrance animation per view
- [ ] Transition only explicit properties (not `all`)

**Polish**
- [ ] Loading states use skeletons (not spinners for content)
- [ ] Hover states feel intentional, not just opacity changes
- [ ] Focus states are visible and on-brand
- [ ] Error states have color + icon + text (not just red)
- [ ] Mobile touch targets minimum 44×44px

---

## Closing Principle

The best interfaces in 2026 feel like they were made by a person with taste, not generated by a template engine. Every design decision — from the easing curve on a button hover to the choice between a 4px and 8px border-radius — should be **intentional and defensible**.

Ask of every UI element: *why this, and not something else?* If you can't answer that, redesign it.

The model for 2026 design isn't "make it look like the latest design trend." It's: **understand the product's personality deeply, then execute its visual identity with surgical precision.**

---

*Maintained by the Claude Design System team · Updated Q1 2026*