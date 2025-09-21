Per Texturas Numerorum, Spira Loquitur.

# Cosmic Helix Renderer

Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [index.html](./index.html) directly in any modern browser; no build tools, servers, or workflows are required.

## Layer Order (depth preserved)
1. **Vesica field** — intersecting circles on a triadic grid.
2. **Tree-of-Life scaffold** — ten sephirot with twenty-two connecting paths.
3. **Fibonacci curve** — fixed logarithmic spiral honoring natural growth.
4. **Double-helix lattice** — two phase-shifted strands bound by calm crossbars.

Each layer draws with the next tone from [`data/palette.json`](./data/palette.json). If that file is absent, the page reports a gentle inline notice and renders with a built-in fallback palette so the geometry remains visible.

## Numerology as Geometry Grammar
The routines respect the requested constants: **3**, **7**, **9**, **11**, **22**, **33**, **99**, and **144**. They govern grid counts, spacing, and sample steps so the output stays faithful to the Cathedral canon while remaining static.

## Local Use (offline)
1. Double-click [index.html](./index.html).
2. The 1440×900 canvas renders immediately, pulling data only from local files.
3. Optional: adjust hues in [`data/palette.json`](./data/palette.json) while keeping six calm tones (`bg`, `ink`, and four-or-more `layers`).

- **21 pillars** – a Fibonacci node (8 + 13) aligning to Tarot majors and 21 Taras.
- **33 spine** – triple elevens forming the Christic ladder.
- **72 Shem angels/demons** – lunar decan cycle (8 × 9).
- **78 archetypes** – complete Tarot weave (22 + 56).
- **99 gates** – threefold expansion of the spine (3 × 33).
- **144 lattice** – perfect square of 12 and 8th Fibonacci.
- **243 completion** – fivefold power of the triad (3⁵).

Geometry routines in this renderer reference sacred numbers 3, 7, 9, 11, 22, 33, 99, and 144 to keep proportions meaningful while staying static.

## Local Use
Double-click [index.html](./index.html) in any modern browser. The 1440×900 canvas renders immediately with no network calls.
The renderer depends on [`js/helix-renderer.mjs`](./js/helix-renderer.mjs) and optional [`data/palette.json`](./data/palette.json).
Everything runs offline. The Pantheon atlas at the top of the page remains intact; the helix canvas sits beneath the node catalogue and shares the Calm Mode toggle for consistent softening.

## ND-safe Notes
- No motion or flashing; all elements render statically in layer order.
- Palette uses gentle contrast for readability, with Calm Mode softening hues when toggled or when the OS requests reduced motion. Status text clarifies when fallbacks are engaged.
- Skip link, `<main>` landmark, and status messaging keep the page navigable by keyboard and assistive tech.
- Pure functions, ES modules, UTF-8, and LF newlines.
- Palette file can be edited offline to adjust hues; the page falls back to built-in colors if it's missing and surfaces a small inline notice.


## ND-safe Guarantees
- No animation, autoplay, flashes, or motion scripting—`renderHelix` runs once per load.
- Gentle contrast palette with clear outlines; fallback stays within the same tonal family.
- Inline comments document why layer order, numerology, and calm defaults are preserved.
- Pure ES modules, ASCII quotes, UTF-8, LF newlines, and small focused functions.
# Cosmic Helix Renderer

Offline-first sacred geometry renderer designed for ND-safe viewing. No build
step, no workflows, no runtime dependencies: double-click `index.html` to open
the 1440×900 canvas.

## Files
- `index.html` – Entry point with safe status messaging and canvas bootstrap.
- `js/helix-renderer.mjs` – Pure ES module that draws the four ordered layers.
- `data/palette.json` – Preferred palette; the renderer falls back if missing.

## Layer order
1. **Vesica field** – Interlocking circles arranged on a 7×9 grid using
   constants 7, 9, 11, and 33 to shape the overlaps. Lines are translucent so
   they stay meditative.
2. **Tree of Life** – Ten sephirot and twenty-two paths, scaled with constants
   3, 7, 9, 11, 22, and 33 for respectful spacing.
3. **Fibonacci curve** – Static logarithmic spiral with markers every 11 steps
   to honour the sequence pacing. The curve grows from radius ratios anchored by
   22, 33, and 144.
4. **Double helix lattice** – Two calm strands sampled across 99 points with 22
   static rungs. The helix never animates; anchor discs show roots instead.

## ND-safe choices
- No animation, autoplay, or flashing changes.
- Calming palette with sufficient contrast, declared in CSS and JSON.
- Pure geometric primitives; no raster textures or overlays.
- Canvas is deterministic; same input always yields the same figure.

## Offline usage
Open `index.html` directly in a browser. If the palette JSON cannot be read
(browsers sometimes block file:// fetch), the renderer posts a status note and
switches to the built-in safe palette.
