# Cosmic Helix Renderer

This ND-safe renderer draws four static layers of sacred geometry inside a 1440×900 canvas. It works offline by double-clicking `index.html`.

## Files

- `index.html` – Static entry point. Loads the renderer module, fetches optional palette data, and explains fallbacks.
- `js/helix-renderer.mjs` – Pure functions that render each layer with lore-aligned numerology constants.
- `data/palette.json` – Optional palette override. Delete or edit for custom colors; the renderer falls back safely if missing.

## Usage

1. Open `index.html` directly in a modern browser (no server required).
2. If the browser blocks local JSON fetches, the renderer shows a status note and uses internal fallback colors.
3. Adjust geometry parameters inside `js/helix-renderer.mjs` for deeper customization. All key ratios are annotated with numerology references (3, 7, 9, 11, 22, 33, 99, 144).

## ND-Safe Design Choices

- **No motion or timers.** Everything renders once to avoid overstimulation.
- **Layer order:** Vesica field → Tree-of-Life → Fibonacci curve → Helix lattice. This maintains depth without flattening the geometry.
- **Palette:** Gentle contrast (`palette.json`) and inline comments describe why each color is chosen.

## Customizing the Palette

Edit `data/palette.json`:

```json
{
  "bg": "#101018",
  "ink": "#f0f0ff",
  "layers": ["#7195ff", "#7bdff2", "#9effb4", "#ffd27f", "#f5a3ff", "#d7d7f2"]
}
```

Remove the file entirely to fall back to internal defaults. The status message in the header confirms whether the JSON was loaded.
