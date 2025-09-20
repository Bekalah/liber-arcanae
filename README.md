# Cathedral of Circuits Modular Foundation

## Offline cosmic renderer
- `index.html`: Offline-first helix renderer with WEBP hero loader.
- `/js/helix-renderer.mjs`: Draws Vesica field, Tree-of-Life, Fibonacci curve, and double-helix lattice.
- `/assets/js/first-paint-octagram.js`: ND-safe first paint for the hero altar.
- `/assets/js/art-loader.js`: Fetches `/assets/art/manifest.json` and mounts WEBP art.

## Data + palette
- `/data/nodes.json`: Modular nodes for other site interfaces.
- `/data/palette.json`: Preferred ND-safe palette; index falls back gracefully if missing.
- `/assets/art/manifest.json`: Declares WEBP hero art (`black-madonna-altar-1600.webp`). Keep PNG masters offline.

## Safety + guards
- PNG ghosts are ignored via `.gitignore` and blocked by `scripts/verify-absent.mjs` (wired to `npm run prebuild`).
- Set Netlify `GIT_LFS_SKIP_SMUDGE=1` so deployments skip PNG resurrection.
- `core/health-check.html`: Quick page to confirm build time and detect auth gates.

## Scripts
```sh
npm run prebuild   # PROTECT charter — forbids tracked PNG ghosts
npm run build      # Placeholder entry (vite build) for future bundlers
npm test           # Schema guard for interface data
```

Everything remains modular and offline-friendly. Add new lore by updating the JSON files or by extending the renderer modules with additional static layers.
