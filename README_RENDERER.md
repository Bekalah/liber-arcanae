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
