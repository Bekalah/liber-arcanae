# Cosmic Helix Renderer


A calm, offline canvas study of the Liber Arcanae cosmology. Double-click `index.html` to render four static layers: Vesica field, Tree of Life, Fibonacci curve, and the double-helix lattice. There are no network requests, no build steps, and no animation.

## Files
- `index.html` - Minimal shell that loads the renderer module, reads the palette JSON, and updates the on-page status message.
- `data/palette.json` - Tunable palette. If missing, the renderer falls back to an ND-safe default and paints a subtle notice on the canvas.
- `js/helix-renderer.mjs` - Pure ES module that paints each layer with numerology-derived proportions.
- `README_RENDERER.md` - This usage guide.

## Running locally (offline)
1. Ensure all four files live in the same directory tree (no server required).
2. Double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari, Arc).
3. If the palette file is present, the header will read "Palette loaded." Removing it triggers the fallback message and canvas notice without errors.

## Palette tuning
- `bg`: Canvas background. Keep contrast gentle but legible for neurodivergent readers.
- `ink`: Text and lattice line accents.
- `layers`: Six colors applied to the Vesica, Tree-of-Life, Fibonacci, and helix layers in order. Prefer desaturated pastels to maintain the ND-safe tone.

## Design intent
- **Layer order** keeps depth: Vesica foundation -> Tree scaffold -> Fibonacci growth -> Helix lattice.
- **Numerology** constants (3, 7, 9, 11, 22, 33, 99, 144) shape radii, spacing, and lattice rhythm.
- **Accessibility**: No animation, high readability, and clear fallbacks when resources are absent.

Everything is plain text and UTF-8. Edit with any code editor - no extra tooling is required.


This appendix renderer is an offline, ND-safe canvas sketch that mirrors the layered cosmology used across the Cathedral projects.

## Layers
- **L1 Vesica Field** — overlapping circles establish the womb of forms.
- **L2 Tree-of-Life** — ten sephirot nodes and twenty-two paths build the teaching scaffold.
- **L3 Fibonacci Curve** — a static spiral encoded with φ progression for gentle movement cues without animation.
- **L4 Double Helix Lattice** — twin strands with fixed rungs referencing the circuitum double-helix.

## Usage
1. Download or clone the repository.
2. Double-click `index.html` (no server required).
3. Optional: adjust `data/palette.json` for bespoke palettes. Missing palettes fall back to a safe in-memory set.

## ND-Safe Considerations
- No animation or motion APIs.
- Soft contrast palette with calm blues, violets, and golds.
- Layer rendering order follows grounding-first principles: field → scaffold → curve → helix.
- Geometry constants reference 3, 7, 9, 11, 22, 33, 99, and 144 to echo cosmogenesis numerology.

## Extending
- `js/helix-renderer.mjs` exposes a single `renderHelix(ctx, options)` function.
- Introduce new layers by composing additional pure functions that accept the drawing context and numerology constants.
- Keep all assets offline; avoid external network calls.

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


