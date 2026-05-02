# Glyde — Design System

## Product context

Glyde is a private advisor workspace for wealth advisors working with business owner clients. The advisor uses it alone — before meetings, between sessions, to prepare. There is no client-facing surface. The product should feel calm, focused, and trustworthy — like a well-designed private banking tool that an advisor is proud to have open on their screen.

---

## Feeling

**Light, airy, and professional.** Clean white surfaces with generous whitespace. Green is the accent — it signals the brand without dominating. Data is readable at a glance. Nothing feels cluttered or corporate. The advisor opens this before a client meeting and feels oriented and confident.

Reference products in feel (not visual copy):
- White page background, sidebar with green accents, clean card layout, green CTA buttons
- Light gray page background, white cards, green primary color, clear typographic hierarchy
- Notion: quiet, lots of breathing room
- Linear: information density done right, nothing wasted

---

## Color

**Light surfaces, green accent, warm neutrals.**

```css
/* Page & surfaces */
--color-bg-page:          #F4F6F4   /* very light gray-green — page background */
--color-bg-card:          #FFFFFF   /* white — cards, panels */
--color-bg-sidebar:       #FFFFFF   /* white sidebar */
--color-bg-hover:         #F0F4F0   /* light green-gray — hover states */
--color-bg-input:         #F8FAF8   /* near-white — input backgrounds */

/* Borders */
--color-border-subtle:    #E8EDE8
--color-border-default:   #D4DDD4
--color-border-strong:    #B8C8B8

/* Text */
--color-text-primary:     #1A2E1A   /* near-black green */
--color-text-secondary:   #4A6A4A   /* medium green-gray */
--color-text-tertiary:    #7A9A7A   /* muted — captions, labels */
--color-text-inverse:     #FFFFFF

/* Brand green */
--color-green-50:         #F0F7F0
--color-green-100:        #D4EDD4
--color-green-200:        #A8D8A8
--color-green-400:        #5CA85C   /* primary — CTAs, active nav */
--color-green-600:        #3D7A3D   /* hover on primary */
--color-green-800:        #1F4A1F   /* text on light green */
--color-green-900:        #0D2A0D

/* Semantic */
--color-danger-bg:        #FEF2F2
--color-danger-border:    #FECACA
--color-danger-text:      #C0392B
--color-warning-bg:       #FFFBEB
--color-warning-border:   #FDE68A
--color-warning-text:     #B45309
--color-success-bg:       #F0FDF4
--color-success-border:   #BBF7D0
--color-success-text:     #166534

/* Data */
--color-data-positive:    #166534
--color-data-negative:    #C0392B
--color-data-neutral:     #1A2E1A
```

**Rules:**
- Page background is `--color-bg-page` (light gray-green) — gives cards contrast
- Cards are always white with subtle border and very light shadow
- Green used for: primary buttons, active sidebar items, badges, progress
- Never use bright or saturated green — `--color-green-400` is maximum saturation
- Severity colors use background + border + text combinations, never solid fills

---

## Typography

```css
--font-body:    'DM Sans', system-ui, sans-serif
--font-data:    'DM Mono', 'Fira Code', monospace
```

Google Fonts: DM Sans (300, 400, 500, 600) + DM Mono (400, 500)

**Type scale:**
```
11px / 1.4  — eyebrows, timestamps, captions
13px / 1.5  — secondary labels, metadata, nav items
15px / 1.6  — body text, descriptions
18px / 1.4  — section headings
22px / 1.3  — page headings
28px / 1.2  — hero stats
36px / 1.1  — valuation hero, large display
```

**Rules:**
- All financial figures use `--font-data` (monospace)
- Weight 600: headings, primary labels
- Weight 500: secondary headings, buttons
- Weight 400: body
- Weight 300: large display numbers (36px+)
- Uppercase labels: 11px, `letter-spacing: 0.05em`, weight 500
- No Fraunces. No Inter. No decorative serif.

---

## Cards

```css
background: #FFFFFF;
border: 1px solid var(--color-border-subtle);
border-radius: 10px;
box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
padding: 20px 24px;           /* standard */
padding: 14px 18px;           /* compact */
```

**Stat cards:**
- Label: 11px uppercase tracked, `--color-text-tertiary`
- Value: 24–28px, `--font-data`, `--color-text-primary`
- Secondary line: 13px, `--color-text-secondary`

---

## Sidebar

```
width collapsed:  56px
width expanded:   220px
background:       white
border-right:     1px solid var(--color-border-subtle)
```

Nav items:
- Default: `--color-text-secondary`, no background
- Active: `--color-green-400` icon, `--color-green-800` text, `--color-green-50` background, `border-radius: 8px`
- Hover: `--color-bg-hover` background, `border-radius: 8px`

---

## Buttons

Primary: `--color-green-400` bg, white text, `border-radius: 8px`, `padding: 9px 18px`, weight 500
Secondary: transparent, `1px solid --color-border-default`, `--color-text-primary`
Ghost: no border, `--color-text-secondary`

---

## Inputs

```css
background: var(--color-bg-input);
border: 1px solid var(--color-border-default);
border-radius: 8px;
padding: 9px 12px;
font-size: 14px;
```
Focus: `border-color: --color-green-400`, `box-shadow: 0 0 0 3px --color-green-50`

---

## Data display

- All financial figures: `--font-data` always
- Hero numbers: 36px, weight 300
- Severity bars: 4px height, full column width
- Severity pills: 11px, semantic bg + text + border — never solid dark fills

---

## Severity

```
High:     --color-danger-bg  / --color-danger-text  / --color-danger-border
Moderate: --color-warning-bg / --color-warning-text / --color-warning-border
Low:      --color-success-bg / --color-success-text / --color-success-border
```

---

## Layout

```
Page background:   --color-bg-page
Max width:         1120px centered
Page padding:      32px 40px
Two-column gap:    24px
Left column:       1.5fr
Right column:      1fr
Section spacing:   28px
Card gap:          12px
```

---

## Motion

```
Sidebar:    150ms ease
Tabs:       100ms ease
Hover:      100ms ease
State:      instant
```

No entrance animations. No skeleton pulse. No page transitions.

---

## Auth screens

Split layout stays. Right panel: white background, form matches spec above.
Left panel: `auth-bg.jpg` stays dark — the contrast between dark left and light right is intentional.

---

## What this is NOT

- Not dark mode
- Not Inter on white with blue primary
- Not Fraunces doing editorial serif work
- Not cards with colored header strips
- Not dense or compressed — whitespace is part of the premium feel
- Not startup gradients

---

## Stack

- Next.js App Router + Tailwind v4
- shadcn/ui — always restyled, never default
- CSS custom properties in globals.css — extend, don't replace
- DM Sans + DM Mono via Google Fonts — add to layout.tsx
- Lucide icons — already installed, no new libraries
