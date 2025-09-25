# Cosmic Helix Renderer

Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [`index.html`](./index.html) directly in any modern browser; no build tools, servers, or workflows are required.

## Layer Order (depth preserved)
1. **Vesica field** — intersecting circles on a triadic-by-heptadic grid to seed the field.
2. **Tree-of-Life scaffold** — ten sephirot with twenty-two connecting paths.
3. **Fibonacci curve** — fixed logarithmic spiral honoring natural growth.
4. **Double-helix lattice** — two phase-shifted strands bound by calm crossbars.

Each layer draws with the next tone from [`data/palette.json`](./data/palette.json). If that file is absent, the page reports a gentle inline notice and renders with a built-in fallback palette so the geometry remains visible.

## Numerology as Geometry Grammar
The routines respect the requested constants: **3**, **7**, **9**, **11**, **22**, **33**, **99**, and **144**. They govern grid counts, spacing, and sample steps so the output stays faithful to the Cathedral canon while remaining static.

Highlights:
- **21 pillars** – a Fibonacci node (8 + 13) aligning to Tarot majors and 21 Taras.
- **33 spine** – triple elevens forming the Christic ladder.
- **72 Shem angels/demons** – lunar decan cycle (8 × 9).
- **78 archetypes** – complete Tarot weave (22 + 56).
- **99 gates** – threefold expansion of the spine (3 × 33).
- **144 lattice** – perfect square of 12 and 8th Fibonacci.
- **243 completion** – fivefold power of the triad (3⁵).

Geometry routines in this renderer reference sacred numbers to keep proportions meaningful while staying static and offline.

## Local Use (offline)
1. Double-click [`index.html`](./index.html).
2. The 1440×900 canvas renders immediately, pulling data only from local files.
3. Optional: adjust hues in [`data/palette.json`](./data/palette.json) while keeping six calm tones (`bg`, `ink`, and at least four `layers`).

## ND-safe Notes
- No motion or flashing; all elements render statically in layer order.
- Palette uses gentle contrast for readability; fallback stays within the same tonal family.
- Status text clarifies when fallbacks are engaged.
- Pure functions, ES modules, ASCII quotes, UTF-8, and LF newlines.
- Palette file can be edited offline to adjust hues; the page falls back to built-in colors if it is missing and surfaces a small inline notice.
