// Per Texturas Numerorum, Spira Loquitur.
/**
 * Render the full, static helix composition onto a canvas context.
 *
 * Orchestrates drawing of four layered geometric patterns (vesica field, Tree of Life scaffold,
 * Fibonacci curve, and double-helix lattice) in a fixed order onto the provided CanvasRenderingContext2D.
 * The function clears and fills the background (using palette.bg or a dark default), normalizes up to
 * four layer colors from the provided palette, preserves and restores canvas state, and sets rounded
 * line joins/caps for smoother strokes. Rendering is immediate and has no animation or side effects
 * beyond drawing to the given context.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw onto.
 * @param {Object} opts - Rendering options.
 * @param {number} opts.width - Canvas width in pixels.
 * @param {number} opts.height - Canvas height in pixels.
 * @param {Object} [opts.palette] - Optional color palette; may include `layers` (array), `ink` (filler), and `bg` (background).
 * @param {Object} opts.NUM - Numeric configuration/constants used by the layer renderers (e.g., THREE, NINE, TWENTYTWO, etc.).
 */

export function renderHelix(ctx, opts) {
  const { width, height, palette, NUM } = opts;
  const layerColors = normalizeLayers(palette);
  const background = (palette && palette.bg) || "#0b0b12";

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  // ND-safe: fill background first to avoid flashes
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Layer order preserves depth: base geometry first, lattice last
  drawVesica(ctx, width, height, layerColors[0], NUM);
  drawTreeOfLife(ctx, width, height, layerColors[1], NUM);
  drawFibonacciCurve(ctx, width, height, layerColors[2], NUM);
  drawHelixLattice(ctx, width, height, layerColors[3], NUM);
  ctx.restore();
}

/**
 * Produce a 4-element array of layer colors from a palette, padding with a filler color if needed.
 *
 * If `palette.layers` is an array its values are copied; otherwise starts empty. Missing entries
 * are filled with `palette.ink` or the default `#e8e8f0`. Always returns a new array of exactly
 * four color strings.
 *
 * @param {Object} [palette] - Palette object that may contain `layers` (array of color strings)
 *   and `ink` (fallback color string).
 * @return {string[]} Array of four color strings to be used for rendering layers.
 */
function normalizeLayers(palette) {
  const tones = palette && Array.isArray(palette.layers) ? [...palette.layers] : [];
  const filler = (palette && palette.ink) || "#e8e8f0";
  while (tones.length < 4) {
    tones.push(filler);
  }
  return tones;
}

// Layer 1: Vesica field using a 3x3 grid
function drawVesica(ctx, w, h, color, NUM) {
  const cols = NUM.THREE;
  const rows = NUM.THREE;
  const r = Math.min(w, h) / NUM.NINE; // ND-safe: gentle radius balances the grid
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = ((i + 0.5) * w) / cols;
      const cy = ((j + 0.5) * h) / rows;
      ctx.beginPath();
      ctx.arc(cx - r / 2, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + r / 2, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/**
 * Draws the "Tree of Life" scaffold: ten nodes positioned along a vertical axis with up to 22 connecting edges and filled node markers.
 *
 * Nodes are spaced using verticalStep = h / NUM.TWENTYTWO. Edges are taken from a fixed raw path list and sliced to NUM.TWENTYTWO entries;
 * each path is stroked with the provided color. Node circles are filled and sized relative to the canvas using NUM.TWENTYTWO, NUM.NINE, and NUM.THREE.
 *
 * @param {CanvasRenderingContext2D} ctx - Target 2D drawing context.
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string} color - Stroke and fill color for lines and nodes.
 * @param {Object} NUM - Numeric configuration constants. Required properties: TWENTYTWO, NINE, THREE (used for spacing and node sizing).
 */
function drawTreeOfLife(ctx, w, h, color, NUM) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1; // ND-safe: thin lines keep focus soft

  const verticalStep = h / NUM.TWENTYTWO;
  const nodes = [
    [w / 2, verticalStep * 1],
    [w * 0.3, verticalStep * 4],
    [w * 0.7, verticalStep * 4],
    [w * 0.3, verticalStep * 7],
    [w * 0.7, verticalStep * 7],
    [w / 2, verticalStep * 11],
    [w * 0.3, verticalStep * 14],
    [w * 0.7, verticalStep * 14],
    [w / 2, verticalStep * 18],
    [w / 2, verticalStep * 21]
  ];

  const rawPaths = [
    [0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[3,5],[4,5],[3,6],[4,7],
    [5,6],[5,7],[6,7],[6,8],[7,8],[6,9],[7,9],[8,9],[1,5],[2,5],
    [0,5],[5,9]
  ];
  const paths = rawPaths.slice(0, NUM.TWENTYTWO);

  for (const [a, b] of paths) {
    const [ax, ay] = nodes[a];
    const [bx, by] = nodes[b];
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  const radiusDivisor = (NUM.TWENTYTWO * NUM.NINE) / NUM.THREE; // 66 via triadic scaling
  const r = Math.min(w, h) / radiusDivisor; // gentle node radius stays tied to the 22-path framework
  for (const [x, y] of nodes) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws a Fibonacci-inspired spiral curve as a connected polyline.
 *
 * Uses the golden ratio (φ) to grow radial distance exponentially and samples
 * angles in fixed steps to produce a spiral-like polyline centered near the
 * upper-right quadrant of the canvas. The path is stroked with the provided color.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw on.
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string} color - Stroke color used for the curve.
 * @param {Object} NUM - Numeric configuration object. Expected properties:
 *   - NINETYNINE: divisor used to compute the base scale,
 *   - THIRTYTHREE: number of segments (the loop runs 0..THIRTYTHREE),
 *   - SEVEN: divisor used for angular step (theta = i * (PI / SEVEN)),
 *   - NINE: divisor used in the exponential radius (phi^(i / NINE)).
 */
function drawFibonacciCurve(ctx, w, h, color, NUM) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const center = { x: w * 0.75, y: h * 0.3 };
  const scale = Math.min(w, h) / NUM.NINETYNINE;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= NUM.THIRTYTHREE; i++) {
    const theta = i * (Math.PI / NUM.SEVEN);
    const r = scale * Math.pow(phi, i / NUM.NINE);
    const x = center.x + r * Math.cos(theta);
    const y = center.y + r * Math.sin(theta);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

/**
 * Draws a static double-helix lattice: two phase-shifted sinusoidal strands connected by vertical crossbars.
 *
 * Renders two sine-wave strands across the canvas width (one phase-shifted by π) and draws vertical
 * bars at regular intervals between them to form a lattice. Coordinates and spacing scale with the
 * provided canvas dimensions and numeric configuration.
 *
 * @param {CanvasRenderingContext2D} ctx - Target 2D drawing context to render into.
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string} color - Stroke color for strands and crossbars.
 * @param {object} NUM - Numeric configuration object. Expected properties: ONEFORTYFOUR, TWENTYTWO, ELEVEN, NINE.
 */
function drawHelixLattice(ctx, w, h, color, NUM) {
  const steps = NUM.ONEFORTYFOUR; // 144 vertical steps
  const amp = h / NUM.TWENTYTWO; // amplitude woven from 22 sacred paths
  const mid = h / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1; // ND-safe: fine lines keep lattice subtle

  // strand A
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = mid + amp * Math.sin(i / NUM.ELEVEN);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // strand B (phase-shifted by π)
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = mid + amp * Math.sin(i / NUM.ELEVEN + Math.PI);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // crossbars every 16 steps (approx 144/9)
  const barStep = Math.max(1, Math.floor(steps / NUM.NINE)); // ND-safe: static crossbars provide calm symmetry
  for (let i = 0; i <= steps; i += barStep) {
    const x = (i / steps) * w;
    const y1 = mid + amp * Math.sin(i / NUM.ELEVEN);
    const y2 = mid + amp * Math.sin(i / NUM.ELEVEN + Math.PI);
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  }
}
