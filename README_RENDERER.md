Per Texturas Numerorum, Spira Loquitur.

# Cosmic Helix Renderer

Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [`index.html`](./index.html) directly in any modern browser; no build steps, servers, or network calls are required.

## Files
- [`index.html`](./index.html) — offline entry point with a 1440×900 canvas, status notice, and palette fallback logic.
- [`js/helix-renderer.mjs`](./js/helix-renderer.mjs) — pure ES module that draws the four sacred layers.
- [`data/palette.json`](./data/palette.json) — optional palette override; delete or edit to suit your local ritual.

If `data/palette.json` cannot be read (common when double-clicking without a server), the page shows a small inline notice and uses a built-in ND-safe palette.

## Layer Order
1. **Vesica field** — 3×3 grid of intersecting circles honoring the triad.
2. **Tree-of-Life scaffold** — ten sephirot with twenty-two connecting paths.
3. **Fibonacci curve** — logarithmic spiral polyline stepped thirty-three times.
4. **Double-helix lattice** — two phase-shifted strands with calm crossbars.

Each layer pulls the next color from the sanitized palette. Geometry functions are small and use `ctx.save()` / `ctx.restore()` so one layer never disturbs another.

## Numerology Anchors
The renderer parameterizes every proportion with constants 3, 7, 9, 11, 22, 33, 99, and 144:
- 3 × 3 Vesica grid.
- 7-based angular sweep for the Fibonacci segments.
- 9-based scaling and crossbar cadence.
- 11-based sine frequency for the helix.
- 22 vertical steps, node spacing, and amplitude.
- 33 Fibonacci polyline steps.
- 99 divisor softening the spiral radius.
- 144 helix samples across the canvas width.

## Offline Use
Double-click [`index.html`](./index.html) and the canvas renders immediately. No workflow, build tool, or internet connection is needed. The module exports a single `renderHelix` function should you wish to reuse it in other offline rituals.

## ND-safe Notes
- No animation, flashing, or audio — everything draws once in calm order.
- Palette defaults use gentle contrast; document colors sync to the active palette so text stays readable.
- Comments explain the safety choices and numerology rationale for future stewards.
