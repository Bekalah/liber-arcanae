Per Texturas Numerorum, Spira Loquitur.

# Cosmic Helix Renderer

Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [site/index.html](./site/index.html) directly in a browser; no build steps or network requests.

## Layers
1. **Vesica field** - intersecting circles laid out with the constant 3.
2. **Tree-of-Life** - ten sephirot with twenty-two connecting paths.
3. **Fibonacci curve** - fixed logarithmic spiral honoring natural growth.
4. **Double-helix lattice** - two phase-shifted strands with calm crossbars.

Each layer uses the next color from [`site/data/palette.json`](./site/data/palette.json). If the palette file is missing, a safe fallback loads and a small notice appears.

## Numerology as Spiral Grammar
The constants of the Cathedral are Fibonacci-coded checkpoints rather than flat decoration:

- **21 pillars** - Fibonacci node (8 + 13) aligning to Tarot majors and 21 Taras.
- **33 spine** - triple elevens forming the Christic ladder.
- **72 Shem angels or demons** - lunar decan cycle (8 x 9).
- **78 archetypes** - complete Tarot weave (22 + 56).
- **99 gates** - threefold expansion of the spine (3 x 33).
- **144 lattice** - perfect square of 12 and eighth Fibonacci value.
- **243 completion** - fivefold power of the triad (3 ^ 5).

Geometry routines in this renderer reference sacred numbers 3, 7, 9, 11, 22, 33, 99, and 144 to keep proportions meaningful while staying static.

## Local Use
Double-click [site/index.html](./site/index.html) in any modern browser. The 1440x900 canvas renders immediately with no network calls. The renderer depends on [`site/assets/js/helix-renderer.mjs`](./site/assets/js/helix-renderer.mjs) and optional [`site/data/palette.json`](./site/data/palette.json). Everything runs offline.

## ND-safe Notes
- No motion or flashing; all elements render statically in layer order.
- Palette uses gentle contrast for readability.
- Pure functions, ES modules, UTF-8, and LF newlines.
- Palette file can be edited offline to adjust hues; the page falls back to built-in colors if it is missing.
