# Cosmic Helix Renderer

ND-safe, offline-first canvas composition that encodes the layered cosmology requested for Liber Arcanae.

## Structure
- **Layer 1 - Vesica Field:** Interlocking circles arranged in a 3x7 grid (21 vessels) referencing the 33 spine and 21 pillars.
- **Layer 2 - Tree-of-Life Scaffold:** Ten numbered nodes with 22 connective paths. Coordinates are parameterized with the numerology constants so spacing stays proportional.
- **Layer 3 - Fibonacci Curve:** Static polyline approximating a logarithmic spiral using the golden ratio. No animation or automated motion is present.
- **Layer 4 - Double Helix Lattice:** Two static braids (33 segments) linked by eleven crossbars to echo the helix motif without movement.

## Usage
1. Open `index.html` directly in any modern browser (double-click from Finder or Explorer). No build tools or servers are required.
2. The renderer attempts to load `data/palette.json`; if missing, it falls back to a safe in-memory palette and draws a subtle inline notice on the canvas.
3. All modules are ES modules with plain ASCII characters and LF newlines.

## Palette
Update the calm palette in `data/palette.json` if needed. Each color supports AA contrast against the deep background. Avoid high saturation flashes to keep the experience ND-safe.

## Offline and Safety Notes
- There are no external dependencies or network requests beyond the optional palette load.
- Motion is absent; reduced-motion users see an identical static composition.
- Canvas dimensions are fixed at 1440x900 to keep the geometry ratios stable.
- Comments throughout the code explain layer ordering and safety considerations.
