// Per Texturas Numerorum, Spira Loquitur.
/**
 * Render a static, four-layer sacred-geometry composition onto a canvas.
 *
 * Ensures exactly four layer colors by taking the first four entries of `opts.palette.layers`
 * and padding with the neutral fallback `#e8e8f0` when necessary. Clears the canvas, fills the
 * background with `opts.palette.bg`, configures rounded stroke rendering, then draws layers
 * in depth order: vesica field, Tree of Life scaffold, Fibonacci curve, and double-helix lattice.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw into.
 * @param {Object} opts - Rendering options.
 * @param {number} opts.width - Canvas width in pixels.
 * @param {number} opts.height - Canvas height in pixels.
 * @param {Object} opts.palette - Color palette; must include `bg` and `layers` (array of layer colors).
 * @param {Object} opts.NUM - Numerology constants consumed by the internal draw routines.
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
 * Draws a 3x3 vesica field: paired overlapping circles in each grid cell.
 *
 * Draws two small, horizontally offset stroked circles at the center of each
 * cell in a 3×3 grid across the given width/height. Uses a gentle radius
 * derived from the minimum dimension and NUM.NINE to keep spacing visually
 * balanced. If `color` is falsy, the function falls back to "#e8e8f0".
 *
 * @param {string} color - Stroke color for the circles; fallback "#e8e8f0" used when falsy.
 * @param {object} NUM - Numeric constants provider; function reads NUM.THREE and NUM.NINE.
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

/**
 * Draws the "Tree of Life" scaffold: ten nodes positioned along a vertical axis with up to 22 connecting edges and filled node markers.
 *
 * Nodes are spaced using verticalStep = h / NUM.TWENTYTWO. Edges are taken from a fixed raw path list and sliced to NUM.TWENTYTWO entries;
 * each path is stroked with the provided color. Node circles are filled and sized relative to the canvas using NUM.TWENTYTWO, NUM.NINE, and NUM.THREE.
 *
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string} color - Stroke and fill color for lines and nodes.
 * @param {Object} NUM - Numeric configuration constants. Required properties: TWENTYTWO, NINE, THREE (used for spacing and node sizing).
 */
function drawTreeOfLife(ctx, w, h, color, NUM) {
  const tone = color || "#e8e8f0"; // calm ink fallback maintains contrast for nodes and paths
  ctx.strokeStyle = tone;
  ctx.fillStyle = tone;
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
 * Render a static Fibonacci (golden-ratio) spiral onto the canvas.
 *
 * Draws a stroked spiral centered near (75% width, 30% height). Radius grows exponentially
 * using the golden ratio; the path is drawn with 33 segments (inclusive).
 *
 * @param {string} [color] - Stroke color for the curve. Falls back to "#e8e8f0" when falsy.
 * @param {object} NUM - Numeric constants object. Required keys: THIRTYTHREE, SEVEN, NINE, NINETYNINE.
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

/**
 * Draws a static double-helix lattice — two phase-shifted sinusoidal strands connected by vertical crossbars — onto the provided canvas context.
 *
 * Scales to the given width and height, uses numeric constants from `NUM` to control resolution, amplitude, phase, and crossbar spacing, and mutates the supplied CanvasRenderingContext2D by stroking paths. If `color` is falsy the function falls back to "#e8e8f0".
 *
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string} color - Stroke color for strands and crossbars; falls back to "#e8e8f0" when falsy.
 * @param {object} NUM - Numeric configuration object expected to contain:
 *                       ONEFORTYFOUR (total steps),
 *                       TWENTYTWO (amplitude divisor),
 *                       ELEVEN (sine phase divisor),
 *                       NINE (divisor used to compute crossbar spacing).
 */
function drawHelixLattice(ctx, w, h, color, NUM) {
  const steps = NUM.ONEFORTYFOUR; // 144 vertical steps
  const amp = h / NUM.TWENTYTWO; // amplitude woven from 22 sacred paths
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
