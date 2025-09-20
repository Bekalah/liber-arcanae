// Per Texturas Numerorum, Spira Loquitur.  //
/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers (drawn in order):
    1) Vesica field
    2) Tree-of-Life scaffold
    3) Fibonacci curve
    4) Double-helix lattice (two phase-shifted strands with calm crossbars)

  Rationale:
    - No motion or autoplay; everything renders once.
    - Soft contrast palette keeps focus gentle.
    - Pure functions highlight numerology constants.
*/
// Per Texturas Numerorum, Spira Loquitur.
/**
 * Render a static, four-layer sacred-geometry composition onto a canvas.
 *
 * Clears the canvas, paints the background, configures rounded stroke rendering, ensures four layer colors
 * (pads palette.layers with a neutral fallback if needed), and draws the layers in depth order:
 * vesica field, tree-of-life scaffold, Fibonacci curve, and double-helix lattice.
 *
 * @param {Object} opts - Rendering options.
 * @param {number} opts.width - Canvas width in pixels.
 * @param {number} opts.height - Canvas height in pixels.
 * @param {Object} opts.palette - Color palette; must include `bg` and `layers` (an array of layer colors).
 * @param {Object} opts.NUM - Numerology constants used by the internal draw routines.
 */

export function renderHelix(ctx, opts) {
  const { width, height, palette, NUM } = opts;
  const colors = palette.layers.slice(0, 4);
  while (colors.length < 4) {
    colors.push("#e8e8f0"); // guardrail ensures all four layers render even if palette is short
  }
  const [vesicaColor, treeColor, fibonacciColor, helixColor] = colors;

  ctx.clearRect(0, 0, width, height);
  // ND-safe: paint background immediately to avoid flashes during render.
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Layer order preserves depth: base geometry first, lattice last.
  drawVesica(ctx, width, height, vesicaColor, NUM);
  drawTreeOfLife(ctx, width, height, treeColor, NUM);
  drawFibonacciCurve(ctx, width, height, fibonacciColor, NUM);
  drawHelixLattice(ctx, width, height, helixColor, NUM);
}

/**
 * Render a 3×3 vesica field: two horizontally offset stroked circles centered in each grid cell.
 *
 * The function draws paired circles at the center of each cell in a 3×3 grid across the provided
 * width/height on the given canvas context. Circle radius is computed from the minimum canvas
 * dimension and NUM.NINE to maintain balanced spacing. If `color` is falsy a neutral fallback
 * ("#e8e8f0") is used to preserve legibility.
 *
 * @param {string} color - Stroke color for the circles; fallback "#e8e8f0" is applied when falsy.
 * @param {object} NUM - Numeric constants provider; the function reads NUM.THREE and NUM.NINE.
 */
function drawVesica(ctx, w, h, color, NUM) {
  const strokeColor = color || "#e8e8f0"; // fallback keeps geometry legible if palette trims
  const cols = NUM.THREE;
  const rows = NUM.THREE;
  const r = Math.min(w, h) / NUM.NINE; // ND-safe: gentle radius balances the grid
  ctx.strokeStyle = strokeColor;
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

// Layer 2: Tree-of-Life scaffold with 10 nodes and 22 paths
function drawTreeOfLife(ctx, w, h, color, NUM) {
  const tone = color || "#e8e8f0"; // calm ink fallback maintains contrast for nodes and paths
  ctx.strokeStyle = tone;
  ctx.fillStyle = tone;
  ctx.lineWidth = 1; // ND-safe: thin lines keep focus soft

  const nodes = [
    [w / 2, h * 0.05],
    [w * 0.3, h * 0.18],
    [w * 0.7, h * 0.18],
    [w * 0.3, h * 0.35],
    [w * 0.7, h * 0.35],
    [w / 2, h * 0.5],
    [w * 0.3, h * 0.65],
    [w * 0.7, h * 0.65],
    [w / 2, h * 0.8],
    [w / 2, h * 0.95]
  ];

  const paths = [
    [0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[3,5],[4,5],[3,6],[4,7],
    [5,6],[5,7],[6,7],[6,8],[7,8],[6,9],[7,9],[8,9],[1,5],[2,5],
    [0,5],[5,9]
  ]; // 22 paths honoring NUM.TWENTYTWO

  for (const [a, b] of paths) {
    const [ax, ay] = nodes[a];
    const [bx, by] = nodes[b];
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  const r = NUM.NINE; // gentle node radius
  for (const [x, y] of nodes) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Render a Fibonacci (golden-ratio) spiral as a stroked path on the canvas.
 *
 * Draws a continuous spiral centered near (75% width, 30% height). Radius grows exponentially using the golden ratio; the curve is sampled in NUM.THIRTYTHREE steps and stroked.
 *
 * @param {string} [color] - Stroke color; falsy values fall back to "#e8e8f0".
 * @param {object} NUM - Numeric constants required by the algorithm. Must include THIRTYTHREE, SEVEN, NINE, and NINETYNINE.
 */
function drawFibonacciCurve(ctx, w, h, color, NUM) {
  const curveColor = color || "#e8e8f0"; // ensures spiral stays visible even with short palettes
  const phi = (1 + Math.sqrt(5)) / 2;
  const center = { x: w * 0.75, y: h * 0.3 };
  const scale = Math.min(w, h) / NUM.NINETYNINE;
  ctx.strokeStyle = curveColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= NUM.THIRTYTHREE; i++) {
    const theta = i * (Math.PI / NUM.SEVEN);
    const r = scale * Math.pow(phi, i / NUM.NINE);
    const x = center.x + r * Math.cos(theta);
    const y = center.y + r * Math.sin(theta);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// Layer 4: Static double-helix lattice
/**
 * Render a static double-helix lattice: two phase-shifted sinusoidal strands across the canvas,
 * connected by evenly spaced vertical crossbars.
 *
 * Scales to the provided width/height and draws stroked paths onto the supplied CanvasRenderingContext2D.
 * Mutates the context (stroke operations). If `color` is falsy a neutral fallback "#e8e8f0" is used.
 *
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string} color - Stroke color for strands and crossbars; uses "#e8e8f0" when falsy.
 * @param {object} NUM - Numeric configuration object with required properties:
 *                       ONEFORTYFOUR (number of vertical steps),
 *                       TWENTYTWO (amplitude divisor used to compute wave amplitude),
 *                       ELEVEN (divisor controlling sine wavelength/phase rate),
 *                       NINE (divisor used to derive crossbar spacing).
 */
function drawHelixLattice(ctx, w, h, color, NUM) {
  const steps = NUM.ONEFORTYFOUR; // 144 vertical steps
  const amp = h / NUM.NINE;
  const mid = h / 2;
  const latticeColor = color || "#e8e8f0"; // static fallback preserves ladder visibility
  ctx.strokeStyle = latticeColor;
  ctx.lineWidth = 1; // ND-safe: fine lines keep lattice subtle

  // strand A
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = mid + amp * Math.sin(i / NUM.ELEVEN);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // strand B (phase-shifted by π)
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = mid + amp * Math.sin(i / NUM.ELEVEN + Math.PI);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // crossbars every 16 steps (approx 144/9)
  const barStep = Math.floor(steps / NUM.NINE); // ND-safe: static crossbars provide calm symmetry
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
