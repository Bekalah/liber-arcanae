Per Texturas Numerorum, Spira Loquitur.

# Cosmic Helix Renderer

Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [index.html](./index.html) directly in any modern browser; no build tools, servers, or workflows are required.

## Layer Order (depth preserved)
1. **Vesica field** — intersecting circles on a triadic grid.
2. **Tree-of-Life scaffold** — ten sephirot with twenty-two connecting paths.
3. **Fibonacci curve** — fixed logarithmic spiral honoring natural growth.
4. **Double-helix lattice** — two phase-shifted strands bound by calm crossbars.

Each layer draws with the next tone from [`data/palette.json`](./data/palette.json). If that file is absent, the page reports a gentle inline notice and renders with a built-in fallback palette so the geometry remains visible.

## Numerology as Geometry Grammar
The routines respect the requested constants: **3**, **7**, **9**, **11**, **22**, **33**, **99**, and **144**. They govern grid counts, spacing, and sample steps so the output stays faithful to the Cathedral canon while remaining static.

## Local Use (offline)
1. Double-click [index.html](./index.html).
2. The 1440×900 canvas renders immediately, pulling data only from local files.
3. Optional: adjust hues in [`data/palette.json`](./data/palette.json) while keeping six calm tones (`bg`, `ink`, and four-or-more `layers`).

## ND-safe Guarantees
- No animation, autoplay, flashes, or motion scripting—`renderHelix` runs once per load.
- Gentle contrast palette with clear outlines; fallback stays within the same tonal family.
- Inline comments document why layer order, numerology, and calm defaults are preserved.
- Pure ES modules, ASCII quotes, UTF-8, LF newlines, and small focused functions.
