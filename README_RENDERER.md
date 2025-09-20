# Cosmic Helix Renderer (Offline, ND-safe)

This renderer paints a layered cosmology without motion so it stays ND-safe and offline-ready. Double-click `index.html` to view the 1440×900 canvas in any modern browser.

## Layers
- **Vesica field** – triadic circle lattice honoring 3/7/9 harmonics.
- **Tree-of-Life nodes** – ten sephirot and twenty-two connective paths rendered with gentle translucency.
- **Fibonacci curve** – static golden spiral drawn from numerology constants (11, 33).
- **Double-helix lattice** – twin strands and crossbars aligned to 22/33/99 cadence, no animation.

## Palette and fallback
- Palette data lives in `data/palette.json`. If the file is missing, the renderer logs a calm status and uses the embedded fallback palette.
- WEBP hero art is declared in `assets/art/manifest.json`. The loader paints an octagram first-paint (`assets/js/first-paint-octagram.js`) and then attempts to mount the WEBP file via `assets/js/art-loader.js`.

## Anti-resurrection guard
- `scripts/verify-absent.mjs` enforces that `img/black-madonna.png` never returns. It runs via the `prebuild` script.
- Set the Netlify build env var `GIT_LFS_SKIP_SMUDGE=1` so deployments never attempt to resurrect forbidden PNGs.

## Scripts
```sh
npm run prebuild   # checks for forbidden PNGs
npm run build      # placeholder (vite build) entry; run after prebuild if you add a bundler
npm test           # existing schema guard
```

All code is pure ES modules, ASCII-only, offline-first. No workflows, no animation, just layered geometry.
