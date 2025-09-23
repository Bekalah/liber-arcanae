# Cosmic Helix Renderer

This static, ND-safe renderer draws the layered cosmology described in the Cosmic Helix brief. Open `index.html` directly in any modern browser (no server or build tools required) to see the 1440×900 canvas render the following layers:

1. **Vesica field** — intersecting circles forming the foundational harmonic grid.
2. **Tree-of-Life scaffold** — ten sephirot and twenty-two connecting paths.
3. **Fibonacci curve** — a calm golden spiral polyline guiding motion-free growth.
4. **Double-helix lattice** — two static strands with gentle crossbars, reinforcing depth without animation.

## Offline-first behavior

- All files are local. Double-click `index.html` and the module will run without any network access.
- The renderer attempts to load `data/palette.json`. If the file is missing or malformed, the canvas displays a small inline notice and falls back to a bundled ND-safe palette.
- Geometry routines are parameterized with numerology constants (3, 7, 9, 11, 22, 33, 99, 144) to align with the layered cosmology requirements.

## Customizing the palette

Edit `data/palette.json` to adjust background, ink, or layer colors. The structure is:

```json
{
  "bg": "#0a1419",
  "ink": "#f2f7f7",
  "layers": ["#4ab6b6", "#7bd389", "#f2d184", "#d1b3ff", "#f8c0c8", "#9fd0ff"]
}
```

Keep the hues calm and high-contrast for ND-safe readability. If `layers` contains fewer than six colors the renderer will reuse them cyclically, ensuring harmonious coverage.

## File overview

- `index.html` — shell document with inline status text and module bootstrap.
- `js/helix-renderer.mjs` — pure ES module that draws each layer in order.
- `data/palette.json` — local palette definition consumed by the renderer.

No build steps or workflows are required. The renderer operates entirely offline and does not rely on external libraries.
