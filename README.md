# Zentro — brand site

The parent marketing site for the Zentro suite. It sits at the repository root and the
individual product sites live in folders beneath it, so `inventory/` keeps working exactly
as it does today.

```
/
├── index.html          brand site — hero, suite, platform, roadmap, pricing, FAQ, contact
├── products.html       all ten applications in detail, plus a comparison table
├── assets/
│   ├── css/style.css   the whole design system, one file
│   ├── js/site.js      all behaviour, no dependencies
│   └── img/
│       ├── brand/      logo lock-ups and the app mark
│       ├── og-cover.png
│       └── shot-*.webp screenshots reused from the Inventory build
└── inventory/          the existing Zentro Inventory site, untouched
```

Static HTML, CSS and JavaScript. No build step, no framework, no package manager —
open `index.html` or point any web server at the folder.

```bash
python3 -m http.server 8000     # then visit http://localhost:8000
```

## The suite

Ten applications, one shipping. The site says so plainly rather than implying more:

| App | Category | Status |
|---|---|---|
| Inventory | Operations | **Live** — links out to the published product site |
| CRM | Sales | In development |
| HRMS | People | In development |
| Books | Finance | In design |
| Expense | Finance | In design |
| Payroll | People | In design |
| Backstage | Marketing | Planned |
| Survey | Marketing | Planned |
| Notebook | Productivity | Planned |
| Tables | Productivity | Planned |

Each app carries an accent colour, a hand-drawn 24×24 icon and a category. The colour is set
once per card with an inline `--accent` custom property; the icon comes from an inline SVG
sprite at the top of each page and is referenced with `<use>`.

Adding an eleventh app means copying one `.app` block, giving it an `--accent` and a
`data-cat`, and adding a `<symbol>` to the sprite. Nothing else needs to change — the filter
counts in the button labels are the only hand-maintained numbers.

### Accent colours as foreground

Raw amber or teal on a white card does not carry enough contrast to be read. Every accent is
pulled toward the current `--ink` before it is used as a text or icon colour:

```css
color: color-mix(in srgb, var(--accent) 70%, var(--ink));
```

Because `--ink` flips with the theme, the same expression darkens the accent in light mode
and lightens it in dark mode. No second set of colour tokens.

## Design system

**Typography** — Plus Jakarta Sans for display and headings, Inter for body and UI,
JetBrains Mono for labels, eyebrows and captions. The scale is fluid (`clamp()`) from
`--t-display` down to `--t-label`, so nothing needs a breakpoint to resize.

**Colour** — every value is a token in `:root`, overridden wholesale under
`:root[data-theme="dark"]`. Both themes are designed rather than inverted: the dark palette
has its own shadows, glows and grid-line alpha.

**Theme** — an inline script in `<head>` reads the stored choice before first paint, so a
dark-mode visitor never sees a white flash. A stored choice always beats the OS preference;
the OS is only followed while the visitor has never chosen.

**Contrast** — all body, caption and label colours were measured against every surface they
actually sit on and clear WCAG AA (4.5:1). `--faint`, `--ok-600` and the eyebrow colour were
each darkened after measuring.

## Motion

| Effect | Where |
|---|---|
| Scroll reveal | `data-reveal="up\|fade\|scale\|left\|right"`, delay via `--d` |
| Stagger | `data-stagger` on a parent; JS stamps `--i` on each child |
| Animated counters | `data-count`, with `data-prefix` / `data-suffix` / `data-decimals` |
| Floating tiles | hero app cards and the "one login" ribbon |
| Drifting orbs | three blurred gradients behind the hero |
| Cursor spotlight | product cards track the pointer via `--mx` / `--my` |
| Marquee | industry strip, row cloned in JS for a seamless loop |
| Page transition | body fade-in, plus `@view-transition` between the two pages |

The markup always holds the final value — counters animate *towards* what is already there,
and reveals only add a class. With JavaScript off the page reads in full.

`prefers-reduced-motion: reduce` collapses every duration to ~0 and cancels the orbs, the
floats and the hero's 3D tilt.

## Accessibility

- Skip link, landmark elements, one `<h1>` per page
- Visible focus ring on every interactive element, never removed
- Mega menu closes on `Escape` and returns focus to its trigger
- Product filter announces its result through an `aria-live` region
- Placeholders are never the only label — every field carries an `aria-label`
- Decorative artwork is `aria-hidden`; the platform diagram has a text alternative
- Screenshots swap between light and dark rather than being tinted

## Contact form

Both pages post to Formspree at `https://formspree.io/f/mbdnvkqa`. The form submits normally
with JavaScript off; the script only intercepts it so the visitor is not navigated away. A
hidden `_gotcha` field is the spam trap — Formspree drops any submission that fills it.

To change the destination, edit the `action` on `#contact-form` in `index.html` and
`products.html`.

## Deploying

Push to the branch GitHub Pages serves. The site is entirely relative except for the links to
the published Inventory site, which are absolute
(`https://zentrosuite.github.io/zentro/inventory/`), so the folder can also be served from any
sub-path or opened straight from disk.
