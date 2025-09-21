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
