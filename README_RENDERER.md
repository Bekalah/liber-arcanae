Per Texturas Numerorum, Spira Loquitur.

# Cosmic Helix Renderer

Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [index.html](./index.html) directly in a browser; no build steps or network requests.

## Layers
1. **Vesica field** – intersecting circles laid out with the constant 3.
2. **Tree-of-Life** – ten sephirot with twenty-two connecting paths.
3. **Fibonacci curve** – fixed logarithmic spiral honoring natural growth.
4. **Double-helix lattice** – two phase-shifted strands with calm crossbars.

Each layer uses the next color from [`data/palette.json`](./data/palette.json). If the palette file is missing, a calm inline status notice appears and the renderer falls back to built-in hues.
Each layer draws with the next tone from [`data/palette.json`](./data/palette.json). If that file is absent, the page reports a gentle inline notice and renders with a built-in fallback palette so the geometry remains visible.

## Numerology as Spiral Grammar
The constants of the Cathedral are Fibonacci-coded checkpoints rather than flat decoration:

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
The renderer depends on [`js/helix-renderer.mjs`](./js/helix-renderer.mjs) and optional [`data/palette.json`](./data/palette.json); if the palette is missing or blocked by `file://` security, the inline fallback keeps the experience calm.
Everything runs offline.

## ND-safe Notes
- No motion or flashing; all elements render statically in layer order.
- Palette uses gentle contrast for readability, with Calm Mode softening hues when toggled or when the OS requests reduced motion.
- Palette uses gentle contrast for readability and honors reduced-motion preferences by avoiding animation entirely.
The renderer depends on [`js/helix-renderer.mjs`](./js/helix-renderer.mjs) and optional [`data/palette.json`](./data/palette.json).
Everything runs offline. The Pantheon atlas at the top of the page remains intact; the helix canvas sits beneath the node catalogue and shares the Calm Mode toggle for consistent softening.

## ND-safe Notes
- No motion or flashing; all elements render statically in layer order.
- Palette uses gentle contrast for readability, with Calm Mode softening hues when toggled or when the OS requests reduced motion. Status text clarifies when fallbacks are engaged.
- Skip link, `<main>` landmark, and status messaging keep the page navigable by keyboard and assistive tech.
- Pure functions, ES modules, UTF-8, and LF newlines.
- Palette file can be edited offline to adjust hues; the page falls back to built-in colors if it's missing and surfaces a small inline notice.

