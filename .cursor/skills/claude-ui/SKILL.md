---
name: claude-design
description: >
  Design system and UI/UX philosophy for the medical dataset catalogue
  application. Read this file before touching any component, page, or
  style. Apply these rules to every visual decision — new features,
  fixes, and refactors alike. The standard is: would the head of
  UI/UX at Claude.ai be proud to ship this as a passion project?
---

# Design Philosophy — Medical Dataset Catalogue

## The One-Sentence Bar

Every screen should feel like **Notion meets Linear meets a medical
instrument**: calm, precise, and considered. No dashboard clutter.
No loud gradients. No assembled-component feeling. Designed, not built.

---

## 1. DESIGN IDENTITY

### Aesthetic Direction
- **Base**: Claude.ai's calm composition — warm neutral canvas,
  editorial serif titles, quiet borders, restrained motion.
- **Accent**: Terracotta (`#C4674F`) is the single brand color.
  It appears on: active chips, section left-bars, CTA buttons,
  the asterisk brand mark, required field indicators, and
  progress fills. Nowhere else.
- **Typography**: Editorial serif for page titles (`font-serif`).
  System sans for all UI text. Monospace (`font-mono`) exclusively
  for slugs, IDs, file paths, and technical strings.
- **Voice**: The UI should whisper, not shout. Muted text should
  be genuinely muted. Active elements should feel deliberate, not
  jarring.

### What This App Is Not
- Not a SaaS settings dashboard
- Not a data-heavy admin panel
- Not a form with dropdowns
- Not a component library demo

---

## 2. COLOR TOKENS

### Light Mode
```
Page background:      #F5F4F0  (warm off-white, not pure white)
Card surface:         #FFFFFF  with border-border/40
Card border:          rgba(0,0,0,0.08)
Card shadow:          0 1px 4px rgba(0,0,0,0.04)

Terracotta accent:    #C4674F
Terracotta hover:     #B85A43
Terracotta subtle bg: rgba(196,103,79,0.10)
Terracotta border:    rgba(196,103,79,0.40)

Text — primary:       text-foreground        (~#1a1a18)
Text — secondary:     text-foreground/75     (labels)
Text — muted:         text-muted-foreground/60  (captions, subtitles)
Text — whisper:       text-muted-foreground/40  (placeholders, helper)
Text — timestamp:     text-muted-foreground/35
```

### Dark Mode Surface Stack
Four levels. Always distinguishable. Never collapse two levels
into the same perceived tone.
```
Level 0 — Page background:   #111110  (warm near-black)
Level 1 — Section cards:     #1c1c1a  (visible lift from bg)
Level 2 — Input fields:      #252523  (lifted from card)
Level 3 — Focused/active:    #2e2e2b  (interaction state)
```

Dark mode text scale:
```
Page titles:          dark:text-white/90
Section titles:       dark:text-white/85
Field labels:         dark:text-white/70
Helper text:          dark:text-white/38
Placeholder text:     dark:text-white/25
Captions/subtitles:   dark:text-white/40
Monospace values:     dark:text-[#a8c4a2]  (sage green, terminal feel)
Eyebrow labels:       dark:text-white/35
```

Dark mode borders:
```
Card border:          dark:border-white/[0.08]
Input border:         dark:border-white/[0.10]
Input hover:          dark:hover:border-white/[0.18]
Chip unselected:      dark:border-white/[0.12]
Terracotta left-bar:  dark:border-[#C4674F]/60
Footer divider:       dark:border-white/[0.08]
```

**Rule**: Never apply dark mode by simply inverting light mode
values. Define each token explicitly for dark. Run both modes
side-by-side before shipping.

---

## 3. SPACING SYSTEM

Use deliberate, generous spacing. Cramped UIs feel like
assembled components. Breathed UIs feel designed.

```
Page outer padding:         px-6 or px-8
Card padding:               28px (p-7)
Gap between section cards:  gap-5 or gap-6 (16–20px)
Gap between fields:         gap-5 (20px) within a section
Gap between chip groups:    gap-2 (8px) flex-wrap
Section header → chips:     mb-4 or mb-5
Field label → input:        mb-1.5 or mb-2 (6px)
Input → helper text:        mt-1 (4px)
```

**Rule**: If something feels cluttered, the fix is almost
always spacing — not removing elements.

---

## 4. TYPOGRAPHY SCALE

```
Page eyebrow ("NEW ENTRY", "BROWSE"):
  text-[10px] font-medium tracking-[0.12em] uppercase
  text-muted-foreground/60 — whisper

Page title ("Register a dataset", "All datasets"):
  font-serif text-4xl font-[450]
  Slightly heavier than regular, not bold

Page subtitle / description:
  text-[15px] text-muted-foreground/70
  max-w-[480px] leading-relaxed

Section title ("Identity", "Classification"):
  text-[13px] font-semibold tracking-[0.02em]
  text-foreground/80

Section subtitle (italic caption):
  text-[13px] italic text-muted-foreground/60 mt-0.5

Field label:
  text-[13px] font-medium text-foreground/75

Helper / hint text:
  text-[12px] text-muted-foreground/55 leading-relaxed

Badge / chip text:
  text-[13px]

Monospace (IDs, paths, slugs):
  font-mono text-[13px]

Count badges on chips:
  text-[10px] font-medium text-muted-foreground/45
  4px left margin — superscript weight, not inline text
```

---

## 5. COMPONENTS

### Cards / Section Containers
```tsx
className="rounded-2xl border border-border/40 bg-card
           shadow-[0_1px_4px_rgba(0,0,0,0.04)]
           dark:bg-[#1c1c1a] dark:border-white/[0.08]
           dark:shadow-[0_1px_6px_rgba(0,0,0,0.35)]"
```

### Section Headers (inside cards)
Left terracotta bar signals section identity:
```tsx
// Wrapper
<div className="border-l-2 border-[#C4674F]/50 pl-3
                dark:border-[#C4674F]/60">
  <h2 className="text-[13px] font-semibold tracking-[0.02em]
                 text-foreground/80">Identity</h2>
  <p className="text-[13px] italic text-muted-foreground/60 mt-0.5">
    Name the dataset and define the stable catalogue id.
  </p>
</div>
```

### Text Inputs
```tsx
className="h-[42px] text-[14px] font-[400]
           placeholder:text-muted-foreground/40
           border-input/60
           focus:ring-0 focus:border-[#C4674F]/60
           focus:shadow-[0_0_0_3px_rgba(196,103,79,0.08)]
           dark:bg-[#252523] dark:border-white/[0.10]
           dark:text-white/90
           dark:placeholder:text-white/25
           dark:focus:border-[#C4674F]/50
           dark:focus:shadow-[0_0_0_3px_rgba(196,103,79,0.12)]"
```

Monospace / technical inputs (IDs, paths):
```tsx
// Additional classes on top of base input
className="font-mono bg-muted/40
           dark:bg-[#252523] dark:text-[#a8c4a2]"
```

### Dropdowns / Selects
- Same height (h-[42px]) and focus treatment as text inputs
- Use `ChevronsUpDown` lucide icon at 14px, muted — not a
  single chevron (reads as accordion collapse)
- Prefer converting small option sets (≤4 options) to inline
  chip-toggle groups — fewer clicks, better affordance

### Chips / Toggle Pills
The chip is the app's primary interactive element. It appears
in: filter atlas, editor form, admin vocabulary panel.
Treat it as a system, not a one-off per location.

```
Shape:     rounded-full (pill — more tactile than rounded-md)
Height:    34px
Padding:   px-[14px]
Font:      text-[13px]
Gap wrap:  flex flex-wrap gap-2
```

States:
```tsx
// Unselected
"bg-transparent border border-border/60
 text-foreground/65
 hover:bg-muted/60 hover:border-border
 dark:bg-white/[0.04] dark:border-white/[0.10]
 dark:text-white/60
 dark:hover:bg-white/[0.07] dark:hover:border-white/[0.16]"

// Selected (terracotta)
"bg-[#C4674F]/10 border border-[#C4674F]/40 text-[#C4674F]
 font-medium
 dark:bg-[#C4674F]/18 dark:border-[#C4674F]/45
 dark:text-[#e8896f]"
// Note: use #e8896f (lighter) for dark mode chip text —
// standard #C4674F is too low contrast on dark surfaces

// Zero-count / unavailable (filter atlas only)
"opacity-35 pointer-events-none"
// Do NOT hide zero-count chips — catalogue shape matters

// Transition on all states
"transition-all duration-150"
```

Count badges (filter atlas chips):
```tsx
<span className="text-[10px] font-medium text-muted-foreground/45 ml-1">
  {count}
</span>
```

### Buttons

Primary CTA ("Create dataset", "New dataset"):
```tsx
"bg-[#C4674F] hover:bg-[#B85A43] text-white
 h-10 px-6 text-sm font-medium rounded-md
 hover:shadow-[0_2px_8px_rgba(196,103,79,0.30)]
 transition-all duration-150"
```

Secondary / outline ("Search", "Cancel" siblings):
```tsx
// Must ALWAYS match CTA in height. h-10 hard-coded, never rely on CVA defaults.
"h-10 px-4 text-sm font-medium rounded-md
 border border-input bg-background
 hover:bg-muted/60
 dark:border-white/[0.10] dark:hover:bg-white/[0.06]"
```

Ghost ("Cancel"):
```tsx
"ghost variant text-muted-foreground/70 hover:text-foreground/90
 dark:text-white/50 dark:hover:text-white/80
 no visible border"
```

**Rule**: Sibling buttons must be pixel-identical in height.
Hard-code `h-10` after `buttonVariants()` in `cn()` to win
the specificity race if CVA defaults differ.

Icon-only (delete X on chips, star):
```tsx
"h-8 w-8 rounded-full ghost
 hover:bg-destructive/10 hover:text-destructive
 transition-colors duration-150"
```

### Sticky Footer (forms)
```tsx
"sticky bottom-0
 bg-background/80 dark:bg-[#111110]/85
 backdrop-blur-sm
 border-t border-border/30 dark:border-white/[0.08]
 py-4"

// Layout: progress left, actions right
<div className="flex items-center justify-between">
  <ProgressIndicator />
  <div className="flex gap-3">
    <CancelButton />
    <CreateButton />
  </div>
</div>
```

Progress indicator (required fields remaining):
```tsx
// Text
<span className="text-xs text-muted-foreground/60 font-medium
                 dark:text-white/40">
  {n} fields remaining
</span>

// Dot track — 4px circles, fill terracotta as fields complete
<div className="flex gap-1 ml-3">
  {requiredFields.map((filled, i) => (
    <div key={i} className={cn(
      "w-1 h-1 rounded-full transition-colors duration-200",
      filled
        ? "bg-[#C4674F]/80"
        : "bg-muted-foreground/20 dark:bg-white/15"
    )} />
  ))}
</div>
```

### Tab Strips (admin panel field picker)
Use a CSS underline tab pattern, not ToggleGroup:
```tsx
// Container
"flex gap-1 border-b border-border/30 dark:border-white/[0.08]
 pb-0 mb-6"

// Inactive tab
"px-3 py-2 text-[13px] cursor-pointer rounded-t-md
 text-muted-foreground/60
 hover:text-foreground/80 hover:bg-muted/40
 transition-colors duration-150"

// Active tab
"px-3 py-2 text-[13px] font-medium
 text-foreground border-b-2 border-[#C4674F] -mb-px
 bg-transparent"
// The terracotta underline IS the selection indicator
```

---

## 6. ICON RULES

### The Glance Test
Every icon must be understood in under 300ms without reading
its label. If a user needs the label to understand the icon,
remove the icon — the label alone is cleaner.

### Icon Library Priority
1. **Lucide** — default for all generic UI actions:
   search, add, reset, close, folder, chevron, star, trash,
   settings, sidebar, external link.
2. **Healthicons** — only for medical semantics where a
   lucide equivalent doesn't exist or is clearly weaker:
   CT scan, X-ray, microscope, clinical record.
3. **Custom SVG** — only when both libraries fail.

Never mix icon styles within the same component.

### Specific Icon Assignments
```
Search:           lucide Search
Add / new:        lucide Plus
Reset / clear:    lucide RotateCcw  (with hover:rotate-180 animation)
Delete:           lucide Trash2
Close / remove:   lucide X
Folder / path:    lucide Folder
Settings:         lucide Settings2
Segmentation:     lucide Scissors
Detection:        lucide ScanSearch
Classification:   lucide Tags
CT scan:          healthicons CT  OR  lucide ScanLine
MRI:              lucide Waves
Annotation box:   lucide RectangleHorizontal
Annotation point: lucide Dot
Voxel mask:       lucide Box
2D mask:          lucide Square
Report/text:      lucide FileText
Scale/stack:      lucide Layers
```

### Icon Sizing
```
In text / labels:   16px  (w-4 h-4)
In buttons:         16px  (w-4 h-4), gap-2 from text
Section headers:    16px, text-muted-foreground/50
Standalone / hero:  20–24px
```

**Rule**: All icons use `currentColor`. Create a shared
`MedicalIcon` wrapper so healthicons and lucide share
sizing, color, and chip behavior.

---

## 7. MOTION

Less is more. Motion earns its place by communicating state,
not decorating the page.

### Allowed Motion
```
Chip state change:        transition-all duration-150
Button hover/press:       transition-colors duration-150,
                          scale-[0.97] on :active
Clear filters icon:       hover:rotate-180 transition-transform duration-300
New chip entrance:        animate-in fade-in duration-300
Deleted chip exit:        animate-out fade-out duration-200
Result count crossfade:   animate-in fade-in on number change
Row stagger on load:      short, once, increasing delay per row
```

### Never
- Skeleton loaders that animate longer than 400ms
- Page transition animations
- Tooltips that animate in (instant is fine)
- Any motion that repeats or loops in idle state

### Accessibility
Always wrap non-essential motion in:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## 8. EMPTY, LOADING, AND ERROR STATES

Every list and async surface needs all three states.

### Empty
```tsx
<div className="py-10 text-center">
  <p className="text-[13px] text-muted-foreground/45 italic">
    No options yet. Add the first one above.
  </p>
</div>
```

### Loading (skeleton)
Use pill/row skeletons that mirror the shape of real content:
```tsx
// Chip skeleton
<div className="h-8 rounded-full bg-muted/60 animate-pulse w-24" />
// Vary widths: w-20, w-28, w-24, w-32 — never uniform
```

### Error
Inline below the affected surface. No modal, no toast for
non-action errors:
```tsx
<p className="text-[13px] text-destructive/70 mt-2">
  Failed to load. Try refreshing.
</p>
```

### Success Feedback
- New item appearing with `animate-in fade-in` IS the confirmation.
- Deleted item exiting with `animate-out fade-out` IS the confirmation.
- **No toast for successful CRUD.** Toast only for hard errors
  (network failure, API error).

---

## 9. DESTRUCTIVE ACTIONS (2-STEP DELETE)

All delete/remove actions are 2-step. No exceptions.

### Dialog Anatomy
```
Max width:   max-w-sm (compact — this is a confirmation, not a form)
Title:       "Remove [human label]?" — use label, not slug
Body line 1: Monospace slug in font-mono text-sm
Body line 2: "Used in N datasets." or "Not used in any datasets."
```

If N > 0 — blocked state:
```tsx
// Amber notice (not red — this is a warning, not a crisis)
<div className="bg-amber-50 border border-amber-200 text-amber-800
                dark:bg-amber-900/20 dark:border-amber-700/40
                dark:text-amber-300
                text-[13px] rounded-lg px-3 py-2 mt-3">
  This option is still in use. Edit those datasets before removing.
</div>
// Confirm button: disabled
```

If N = 0:
```tsx
// Cancel: ghost button
// Confirm: destructive — bg-destructive text-white
```

Match the outer chrome of `admin-members-panel.tsx` revoke
dialog exactly for visual consistency.

---

## 10. PAGE-LEVEL PATTERNS

### Header Card (masthead)
Every primary page has a header card that sets editorial tone:
```tsx
<div className="rounded-2xl border border-border/30 bg-card p-9
                dark:bg-[#1c1c1a] dark:border-white/[0.08]">
  <p className="text-[10px] font-medium tracking-[0.12em] uppercase
                text-muted-foreground/60 dark:text-white/35 mb-2">
    {eyebrow}
  </p>
  <h1 className="font-serif text-4xl font-[450] mb-3">{title}</h1>
  <p className="text-[15px] text-muted-foreground/70 dark:text-white/45
                max-w-[480px] leading-relaxed">
    {subtitle}
  </p>
</div>
```

### Toolbar Buttons (masthead actions)
Sibling buttons must always be the same height. Enforce h-10
explicitly. Do not trust CVA size variants to resolve correctly.

```tsx
// The pair pattern
<div className="flex items-center gap-3">
  <Button variant="outline"
    className="h-10 px-4 text-sm gap-2 [&_svg]:size-4">
    <Search className="opacity-60" /> Search
  </Button>
  <Button asChild
    className="h-10 px-4 text-sm gap-2 [&_svg]:size-4
               bg-[#C4674F] hover:bg-[#B85A43] text-white">
    <Link href="/datasets/new"><Plus /> New dataset</Link>
  </Button>
</div>
```

### Dataset Row / Browse Card
Three-row anatomy. No justify-between. No min-h. Let content
determine height. Uniformity comes from consistent padding and
line-clamp, not forced sizing.

```
Row 1: [icon] Title ············· [CT] [task] [access] ☆
Row 2: Description (line-clamp-2)
Row 3: mono-id · anatomy · N patients · N studies · Nd
```

```tsx
<li className="rounded-2xl border border-border/40 bg-card
               dark:bg-[#1c1c1a] dark:border-white/[0.08]
               px-5 py-5 flex flex-col gap-3 relative
               hover:border-border/70 transition-colors duration-150">
  {/* Row 1 */}
  <div className="flex items-start justify-between gap-3 pr-10">
    <div className="flex items-center gap-3">
      <ModIcon className="text-[#C4674F] shrink-0" />
      <h3 className="text-[15px] font-medium line-clamp-1">{name}</h3>
    </div>
    <BadgeCluster tags={[modality, task, access]} author={author} />
  </div>
  {/* Row 2 */}
  <p className="text-sm text-muted-foreground/70 leading-relaxed
                line-clamp-2">
    {description}
  </p>
  {/* Row 3 */}
  <p className="font-mono text-xs text-muted-foreground/50 truncate">
    {id} · {anatomy} · {scale}
  </p>
  {/* Star */}
  <StarButton className="absolute top-5 right-4" />
</li>
```

Badges in rows:
```tsx
"h-6 px-2 text-xs rounded-md border border-border/60
 text-foreground/65 dark:border-white/[0.12] dark:text-white/50"
```

---

## 11. RULES THAT CANNOT BE BROKEN

1. **Terracotta is the only accent color.** No blue primary
   buttons. No green success fills. No purple anything.

2. **Every sibling button pair must be the same height.**
   Measure in devtools if unsure.

3. **No min-h on list cards.** Height is determined by content
   + padding only.

4. **No toast for successful CRUD.** The UI change is the
   confirmation.

5. **Icons must pass the glance test.** If you need to read
   the label to understand the icon, remove the icon.

6. **Dark mode is explicitly defined, not inverted.**
   Every token has a deliberate dark value. Never assume
   light mode values invert correctly.

7. **No mobile considerations.** This app is desktop-only.
   Do not add responsive breakpoints, flex-col mobile
   overrides, or touch target sizing.

8. **No layout changes without explicit instruction.**
   Spacing, color, and typography fixes are safe. Moving
   sections, adding/removing columns, or restructuring
   information architecture requires explicit instruction.

9. **Chips are pills.** Always `rounded-full`. Never
   `rounded-md` for filter/toggle chips.

10. **Destructive actions are always 2-step.** No single-click
    deletes anywhere in the app.

---

## 12. THE SELF-CHECK BEFORE SHIPPING

Run through this before marking any UI work done:

- [ ] Does every surface in dark mode have a visibly distinct
      luminance from its parent? (page → card → input)
- [ ] Are sibling action buttons identical in height?
- [ ] Do chips have all three states: unselected, selected,
      unavailable? Do they look distinct in both light and dark?
- [ ] Is the terracotta accent the only color carrying meaning?
- [ ] Does every icon pass the 300ms glance test?
- [ ] Is there a loading, empty, and error state for every
      async surface?
- [ ] Are all destructive actions 2-step with a confirmation
      dialog?
- [ ] Is light mode completely unchanged if only dark mode
      was touched?
- [ ] Would the head of UI/UX at Claude.ai ship this?