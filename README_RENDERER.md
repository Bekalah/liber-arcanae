# Cosmic Helix Renderer

A lightweight, offline-first HTML + Canvas tableau that encodes the layered cosmology of Vesica geometry, the Tree of Life, a Fibonacci curve, and a static double-helix lattice. The renderer favors ND-safe calm over spectacle: no animation, muted gradients, and clear contrasts for mindful viewing.

## Files

- `index.html` – entry point with a 1440×900 canvas, palette loader, and numerology constants.
- `js/helix-renderer.mjs` – pure ES module that draws all four layers with no external dependencies.
- `data/palette.json` – tweakable color palette used by the renderer; safe fallbacks are bundled.

Double-click `index.html` in any modern browser to see the layered image. No build tools, servers, or network access are required, which keeps the repo portable for an eventual Fly.io static deployment or any other host.

## Palette and Accessibility

The palette keeps to teal, emerald, and lavender values inspired by the provided imagery. Modify `data/palette.json` to adapt the atmosphere or increase contrast—the module automatically blends alpha values to maintain softness. If the file is missing, the script shows a small inline notice and falls back to the same ND-safe defaults.

## Layer Overview

1. **Vesica Field (Layer 1)** – A 3×7 circle grid derived from the numerology set (3, 7, 9, 11, 22, 33, 99, 144) forms the breathing background.
2. **Tree-of-Life Scaffold (Layer 2)** – Ten sephirot positioned over seven vertical levels with twenty-two connecting paths, echoing the Hebrew-letter bridges.
3. **Fibonacci Curve (Layer 3)** – A golden spiral polyline stabilized by 22 segments and softened stroke widths.
4. **Double-Helix Lattice (Layer 4)** – Two interwoven strands with thirty-three crossbars, statically rendered to avoid motion triggers.

Each function in `helix-renderer.mjs` documents the ND-safe design choices so future caretakers can tune parameters without adding animation or external dependencies.

## Local Customization

- Update `data/palette.json` to try new tones. Keep contrast between `bg` and `ink` high enough for text legibility.
- Adjust numerology-driven constants inside `index.html` if different proportions are desired. The module reads the same structure, so host migrations remain simple.

## Offline Verification

Open `index.html` directly from the filesystem. If you want to validate in a terminal, any static file preview (for example, `npx serve .`) works offline, but is optional.
