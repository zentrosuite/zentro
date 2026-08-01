# Zentro Inventory — marketing site

A static, dependency-free marketing site for the Zentro Inventory application.
Open `index.html` in a browser, or serve the folder with anything:

```bash
python3 -m http.server 8899     # then http://localhost:8899
```

There is no build step, no bundler and no npm install. Every asset is local — the only
external request is the Inter webfont from Google Fonts, and the page degrades to system
fonts without it.

## What's here

```
index.html            the whole page
assets/css/style.css  design tokens + layout, light and dark
assets/js/site.js     theme toggle, mobile nav, suite dropdown, feature tabs, scroll reveal
assets/img/
  brand/              the Zentro logo — mark, and wordmark in dark-text and light-text
  products/           12 product illustrations (SVG, drawn for this project)
  shot-*.webp         real screenshots of the application, one pair per screen
  mockup-hero-*.webp  device composite for the hero (transparent background)
  mockup-network-*.webp  "built for every kind of Indian business"
  zentro-tour-*.mp4   8-second product tour, 1280×720 (1s per slide)
  tour-poster-*.webp  video poster frames
```

## Light and dark

Both are first-class. The theme resolves in this order:

1. a stored choice from a previous visit (`localStorage.zentro-theme`)
2. otherwise the operating system's `prefers-color-scheme`

It is applied by an inline script in `<head>` **before first paint**, so a dark-mode visitor
never gets a white flash. After someone clicks the toggle their choice wins permanently —
changing the OS theme no longer overrides it, because that would silently undo a deliberate
action.

**Every screenshot exists twice.** The app was captured in both themes and the page swaps
between them:

```html
<img class="shot shot--light" src="…-light.webp">
<img class="shot shot--dark"  src="…-dark.webp">
```

`.shot--light` / `.shot--dark` are toggled by CSS on `:root[data-theme]`. The swap rules carry
deliberate extra specificity (`img.shot--dark`, `video.shot--dark`) because a later rule like
`.video video` is class-plus-type and would otherwise win, showing both themes' assets at once.

## Where the images came from

Nothing here is stock photography or a licensed asset.

- **Screenshots** are real captures of the running application, taken over the Chrome
  DevTools Protocol at a 1440×1000 viewport, plus a genuine 390×844 mobile capture for the
  phone in the hero.
- **The data in them is demo data** — a shop called "NuNu Electronics" with a month of
  generated trading behind it. It was produced through the application's own services, so the
  charts, GST figures and stock values are really derived rather than painted on. It is not
  anyone's real business.
- **Product illustrations** were drawn as SVG for this project.
- **The logo** was designed for this project: three stacked bars read as inventory layers,
  and the diagonal cuts a Z through them.
- **The tour video** was composed from the same screenshots and encoded with ffmpeg.

## A note on the "across India" graphic

The reference design for this section is a map of India with business types pinned to it.
This site uses a **constellation** instead — the same message (many kinds of business, all
over the country, connected) without drawing a national boundary.

That is a deliberate choice. An inaccurately drawn Indian border is not a neutral design
error, and a hand-traced outline was not going to be accurate. If you want a literal map,
source a properly surveyed one rather than redrawing it.

## Asset weight

Everything raster is WebP at quality 82, which is visually lossless for flat UI screenshots
and roughly a quarter of the PNG weight (10.3 MB → 2.2 MB across 22 images).

The tour video is 1280×720 at 24fps, ~370 KB per theme — eight slides, one second each,
with a 0.25s crossfade (a longer fade would eat most of a one-second slide). It was 1080p at first, which was
paying for pixels nobody sees — the player is never wider than about 1100 CSS pixels. Static
scenes with slow crossfades also compress far better at a low frame rate.

For reference, the site this was benchmarked against ships a 2.5 MB feature video and 64 KB
hero images; this one is well under both.

If you re-export a screenshot as PNG, convert it before committing:

```bash
ffmpeg -i shot-x.png -c:v libwebp -quality 82 -compression_level 6 shot-x.webp
```

## Contact form

Posts to Formspree at `https://formspree.io/f/xrenweov` with `method="POST"` and a `name` on
every field — so it works with JavaScript switched off. Two enhancements sit on top:

- **Submitting without leaving the page.** A `fetch` intercepts the submit and shows an inline
  result, falling back to a normal form post if `fetch` is unavailable.
- **Guessing the location from the IP.** Two providers are tried in order (`ipwho.is`, then
  `get.geojs.io`) because the free tiers rate-limit per IP, and one provider alone means the
  guess quietly stops working for exactly the visitors on a busy shared connection. The result
  is only ever a *suggestion* — "Looks like Karnataka, India is your location. Change?" swaps
  the sentence back for the text input, which is the field that actually posts either way.

  Worth knowing: this sends the visitor's IP to a third party on page load. If that is not
  acceptable, delete the `geoSources` block in `site.js` and the field becomes a plain input.

`_gotcha` is a honeypot Formspree drops silently, and `_subject` sets the notification subject.

**The placeholder is the label.** Each field also carries an `aria-label`, because a
placeholder is not an accessible name and it disappears the moment someone starts typing.

## Layout notes

- **Sections** sit on `clamp(2.1rem, 1.7rem + 1.1vw, 2.9rem)` of vertical padding. Two adjacent
  sections both contribute, so the gap between blocks is roughly double that — about 86px at
  1440px. Change the one token and the whole rhythm moves.
- **`.split`** is the two-column layout used by the tour (video left, copy right) and the
  who-it-is-for band (image left, copy right, via `.split--media-first`). Both collapse to one
  column under 900px.
- **Watch out for `clamp()` syntax.** CSS requires whitespace around `+` inside a math
  expression: `clamp(2rem, 1.5rem + 1vw, 3rem)`. Written as `1.5rem+1vw` the whole declaration
  is a parse error and is dropped silently — which is exactly how every section on this page
  ended up with `padding: 0` without anything looking obviously broken.

## Editing

- **Copy and structure** — all in `index.html`, one section per commented block.
- **Colour, spacing, radii** — the token block at the top of `style.css`. Both themes are
  defined there; changing `--brand-600` restyles the whole site.
- **Adding a screenshot** — capture it in both themes, convert both to WebP, drop the pair in
  `assets/img/`, and add two `<img>` tags with `shot--light` and `shot--dark`.
- **Adding a tab** — a `<button class="tab" data-tab="x">` and a matching
  `<div class="panel" data-panel="x">`. The JavaScript wires them up by name.

## Accessibility and performance

- Semantic landmarks, one `<h1>`, visible focus rings, `aria-selected` on the tabs and
  `aria-expanded` on the dropdown and mobile menu.
- The FAQ is an exclusive accordion — opening one answer closes the rest, so nine questions
  never turn into several screens of scrolling. It is plain `<details>`, so it still works
  with JavaScript off; only the auto-close needs the script.
- Arrow keys move between feature tabs; Escape closes the dropdown.
- `prefers-reduced-motion` disables the reveal animation, smooth scrolling and hover lifts.
- Images below the fold are `loading="lazy"` and carry `width`/`height` so nothing reflows.
- The tour video autoplays muted and loops, but only while it is on screen — an
  IntersectionObserver pauses it once you scroll past, and the theme toggle hands playback to
  whichever copy the new theme reveals. The off-theme video is never playing.
- No horizontal overflow at 390px.

## What the pricing says

Three tiers, and the copy across the hero, pricing and FAQ is kept consistent with them:

| Tier | What it is |
|---|---|
| **Free** | Encrypted build, one user / one counter / one location, core reports |
| **Business** | One-time licence, everything unlocked, unlimited users and locations |
| **Managed hosting** | Business plus we host, patch, monitor and back it up |

**Source code is not part of any plan** — the product ships as an encrypted build. That is
stated outright in a FAQ entry rather than left to be discovered, and the "no feature gate"
line that used to be in the FAQ has been removed because it contradicted the free tier.

## Still to do before this goes live

- Replace `hello@zentro.example` with a real address, and the "On request" prices with
  real numbers.
- Add a favicon PNG fallback for browsers that ignore SVG icons.
- Point the OG image at an absolute URL once there is a domain.
- Decide whether "Zentro" is the final brand — it is a working name.
