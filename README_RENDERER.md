# Cosmic Helix Renderer

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
