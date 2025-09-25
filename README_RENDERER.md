# Cosmic Helix Renderer

Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [`index.html`](./index.html) directly in any modern browser; no build tools, servers, or workflows are required.

## Layer Order (depth preserved)
1. **Vesica field** — intersecting circles on a triadic grid.
2. **Tree-of-Life scaffold** — ten sephirot with twenty-two connecting paths.
3. **Fibonacci curve** — fixed logarithmic spiral honoring natural growth.
4. **Double-helix lattice** — two phase-shifted strands bound by gentle crossbars.

Each layer draws with the next tone from [`data/palette.json`](./data/palette.json). If that file is absent, the page reports a calm inline notice and renders with a built-in fallback palette so the geometry remains visible.

## Numerology as Geometry Grammar
The routines respect the requested constants: **3**, **7**, **9**, **11**, **22**, **33**, **99**, and **144**. They govern grid counts, spacing, and sample steps so the output stays faithful to the Cathedral canon while remaining static.

Key correspondences:
- **3** — Vesica rows and the spiral's rotational cadence.
- **7** — Vesica columns and harmonic spacing.
- **9** — Spiral rotations and calming completion.
- **11** — Vesica margins and helix amplitude.
- **22** — Tree paths and helix crossbars.
- **33** — Helix strand segments anchoring the spine.
- **99** — Spiral samples and node radii scaling.
- **144** — Spiral radius seed derived from the sacred square.

## Local Use (offline)
1. Double-click [`index.html`](./index.html).
2. The 1440×900 canvas renders immediately, pulling data only from local files.
3. Optional: adjust hues in [`data/palette.json`](./data/palette.json) while keeping calm tones (`bg`, `ink`, and an array of `layers`).

## ND-safe Notes
- No motion or flashing; `renderHelix` runs once per load.
- Palette uses gentle contrast for readability; fallback stays within the same tonal family and sets a small inline notice.
- Comments in [`js/helix-renderer.mjs`](./js/helix-renderer.mjs) document the ND-safe reasoning and numerology per layer.
- Pure ES modules, ASCII quotes, UTF-8, and LF newlines keep the code approachable offline.
