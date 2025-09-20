// Per Texturas Numerorum, Spira Loquitur.  //
/**
 * Render the complete static helix composition onto a 2D canvas context.
 *
 * Renders four stacked layers (in order): a vesica field, Tree-of-Life scaffold,
 * a Fibonacci-inspired curve, and a double-helix lattice. The function clears
 * the canvas and fills the background from the provided palette, then draws
 * each layer once using the numerology constants in `NUM`.
 *
 * @param {Object} opts - Rendering options.
 * @param {number} opts.width - Canvas width in pixels.
 * @param {number} opts.height - Canvas height in pixels.
 * @param {Object} opts.palette - Color configuration. Must include `bg` and `layers` (array of 4 layer colors).
 * @param {Object} opts.NUM - Numerology constants used by the layer renderers.
 */

export function renderHelix(ctx, opts) {
  const { width, height, palette, NUM } = opts;
  ctx.clearRect(0, 0, width, height);
  // ND-safe: fill background first to avoid flashes
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  // Layer order preserves depth: base geometry first, lattice last
  drawVesica(ctx, width, height, palette.layers[0], NUM);
  drawTreeOfLife(ctx, width, height, palette.layers[1], NUM);
  drawFibonacciCurve(ctx, width, height, palette.layers[2], NUM);
  drawHelixLattice(ctx, width, height, palette.layers[3], NUM);
}

/**
 * Draws a 3×3 Vesica field: pairs of adjacent circles (vesicas) in each grid cell.
 *
 * Each grid cell is centered within the canvas; two circles are drawn per cell with
 * their centers offset horizontally by half the circle radius. Radius is computed
 * as min(width, height) / NUM.NINE to keep proportions ND-safe and gentle.
 *
 * @param {CanvasRenderingContext2D} ctx - 2D canvas rendering context to draw on.
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string} color - Stroke color used for the vesica outlines.
 * @param {Object} NUM - Numeric constants object (expects at least NUM.THREE and NUM.NINE).
 */
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
 * Render a static Tree-of-Life scaffold: 10 spatially fixed nodes connected by 22 straight paths.
 *
 * Draws a fixed arrangement of 10 node positions (relative to the canvas width/height), strokes 22 connecting
 * edges using the provided color, then fills circular nodes at each position with a small radius.
 *
 * The function mutates the supplied 2D canvas context (no return value). Node positions are hard-coded as
 * proportional coordinates; edge order is stroked before nodes are filled so nodes appear on top.
 *
 * @param {Object} NUM - Numerology constants object. Expected to provide at least:
 *                       - NUM.NINE: radius (in pixels) used for each node.
 *                       (The paths array contains 22 links corresponding to NUM.TWENTYTWO conceptually.)
 */
function drawTreeOfLife(ctx, w, h, color, NUM) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
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
 * Draws a continuous Fibonacci-like spiral curve (33 segments) and strokes it.
 *
 * The path is generated from the golden ratio (phi) with radius growing as
 * phi^(i/NUM.NINE) and angle theta = i*(PI/NUM.SEVEN), for i = 0..NUM.THIRTYTHREE.
 * The curve is centered at (0.75*w, 0.3*h), scaled by Math.min(w, h) / NUM.NINETYNINE,
 * and stroked with lineWidth 2 using the provided color.
 *
 * @param {string} color - Stroke color for the curve.
 * @param {object} NUM - Numerology constants object. Must include:
 *                       NUM.NINE, NUM.SEVEN, NUM.THIRTYTHREE, and NUM.NINETYNINE.
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
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/**
 * Render a static double-helix lattice across the canvas.
 *
 * Draws two phase-shifted sinusoidal strands spanning the canvas width and vertical crossbars
 * connecting them, producing a calm double-helix lattice. Geometry and spacing are driven by the
 * provided NUM constants.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw into.
 * @param {number} w - Canvas width in pixels (used to span the strands horizontally).
 * @param {number} h - Canvas height in pixels (used to compute vertical midline and amplitude).
 * @param {string} color - Stroke color for strands and crossbars.
 * @param {Object} NUM - Numeric constants object; must include:
 *   - ONEFORTYFOUR: number of vertical steps,
 *   - NINE: divisor used for amplitude and crossbar spacing,
 *   - ELEVEN: divisor used in the sine argument for strand winding.
 */
function drawHelixLattice(ctx, w, h, color, NUM) {
  const steps = NUM.ONEFORTYFOUR; // 144 vertical steps
  const amp = h / NUM.NINE;
  const mid = h / 2;
  ctx.strokeStyle = color;
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
