# Cosmic Helix Renderer

This renderer draws a layered, ND-safe sacred geometry tableau without any network calls or build tooling. Double-click `index.html` to open the canvas in a browser. All geometry is static; there is no animation or motion.

## Layers

1. **Vesica grid** - overlapping circles arranged with `3`, `7`, and `9` inspired spacing for a gentle field.
2. **Tree of Life** - ten nodes and twenty-two paths using numerology-aligned radii.
3. **Fibonacci curve** - log spiral built from `144` points and a golden-ratio growth step.
4. **Double helix lattice** - two static strands with `33` period spacing and cross braces every third point.

Color choices are ND-safe: muted blues, teals, ambers, and violets placed over a deep indigo background. There is no flashing or sudden contrast shift.

## Palette overrides

The renderer will attempt to load `data/palette.json`. If the file is missing, it falls back to a safe built-in palette and updates the inline status message. To customize colors, edit the JSON file locally:

```json
{
  "bg": "#0b0b12",
  "ink": "#e8e8f0",
  "layers": ["#4f6db8", "#72d5ff", "#9be5c1", "#ffd285", "#f0a8ff", "#bcc1dc"]
}
```

All files live beside the canvas under `game/` so they remain accessible offline.

## Safety notes

- ND-safe philosophy is explained in code comments: no motion, calm palette, layered ordering.
- Geometry helpers are pure functions for clarity and to avoid hidden side-effects.
- The renderer does not fetch from the network or rely on third-party libraries.

## Local use

1. Open the repository folder.
2. Navigate to `game/`.
3. Double-click `index.html` or open it with `File > Open` in your browser.
4. Optional: adjust `data/palette.json` to taste.

No server or build step is required; everything runs offline.
