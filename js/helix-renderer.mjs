/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)
    3) Fibonacci curve (log spiral polyline; static)
    4) Double-helix lattice (two phase-shifted strands with rungs)

  We keep functions pure and small, and describe ND-safe rationale inline so
  collaborators understand why the geometry stays static and high-contrast.
*/

const DEFAULT_NUM = {
  THREE: 3,
  SEVEN: 7,
  NINE: 9,
  ELEVEN: 11,
  TWENTYTWO: 22,
  THIRTYTHREE: 33,
  NINETYNINE: 99,
  ONEFORTYFOUR: 144
};

const DEFAULT_PALETTE = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"]
};

/**
 * Render a static, layered "helix" composition onto a 2D canvas.
 *
 * Draws four deterministic layers (vesica grid, Tree-of-Life scaffold, Fibonacci-inspired spiral, and a double-helix lattice)
 * into the provided canvas context using a normalized palette and numeric layout constants.
 *
 * If `ctx` is falsy the function returns immediately. `options` may override canvas dimensions and rendering parameters:
 * - options.width, options.height: explicit canvas size to use instead of ctx.canvas dimensions.
 * - options.NUM: partial override of numeric layout constants (merged with module DEFAULT_NUM).
 * - options.palette: custom palette object (merged via normalisePalette).
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context to draw into.
 * @param {Object} [options] - Optional overrides for size, numeric constants, and palette.
 * @returns {void}
 */
export function renderHelix(ctx, options = {}) {
  if (!ctx) {
    return;
  }

  const width = options.width ?? ctx.canvas?.width ?? 0;
  const height = options.height ?? ctx.canvas?.height ?? 0;
  const NUM = { ...DEFAULT_NUM, ...(options.NUM || {}) };
  const palette = normalisePalette(options.palette);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  fillBackground(ctx, width, height, palette);

  const dims = { width, height };
  drawVesicaField(ctx, dims, palette, NUM);
  drawTreeOfLife(ctx, dims, palette, NUM);
  drawFibonacciCurve(ctx, dims, palette, NUM);
  drawDoubleHelix(ctx, dims, palette, NUM);

  ctx.restore();
}

/**
 * Normalize a palette by merging a partial custom palette with defaults and ensuring layer order/length.
 *
 * Merges `custom` over DEFAULT_PALETTE and guarantees `palette.layers` has the same length and order
 * as DEFAULT_PALETTE.layers: provided layer colors replace defaults at the same indices, and any
 * missing entries fall back to the default colors.
 *
 * @param {Object} [custom] - Partial palette; may include `bg`, `ink`, and `layers` (an array of color strings).
 * @return {Object} A new palette object with defaults applied and a fully populated `layers` array.
 */
function normalisePalette(custom) {
  const palette = { ...DEFAULT_PALETTE, ...(custom || {}) };
  const baseLayers = DEFAULT_PALETTE.layers;
  const provided = Array.isArray(palette.layers) ? palette.layers : baseLayers;
  palette.layers = baseLayers.map((color, index) => provided[index] ?? color);
  return palette;
}

/**
 * Fill the full canvas area with the palette background color.
 *
 * The function preserves the canvas context state and uses palette.bg as the fill style.
 * @param {{bg: string}} palette - Palette object whose `bg` color is used to fill the rectangle.
 */
function fillBackground(ctx, width, height, palette) {
  ctx.save();
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Draws a grid of overlapping circles (a vesica field) and a central paired vesica.
 *
 * Renders a soft, semi-transparent lattice of circles arranged in NUM.NINE rows and NUM.SEVEN columns,
 * with circle radius derived from the smaller canvas dimension (radius = min(width, height) / NUM.ELEVEN).
 * After the grid is drawn, two larger central circles (scaled by NUM.THIRTYTHREE / NUM.TWENTYTWO) are
 * drawn as a paired vesica centered on the canvas.
 *
 * @param {Object} dims - Layout dimensions.
 * @param {number} dims.width - Canvas width in pixels.
 * @param {number} dims.height - Canvas height in pixels.
 * @param {Object} palette - Normalized palette; uses palette.layers[0] for the field color.
 * @param {Object} NUM - Numeric constants used for sizing and spacing (expects keys like NINE, SEVEN, ELEVEN, THIRTYTHREE, TWENTYTWO, THREE).
 */
function drawVesicaField(ctx, dims, palette, NUM) {
  const { width, height } = dims;
  const rows = NUM.NINE; // 9 rows encode triple triads.
  const cols = NUM.SEVEN; // 7 columns mirror the planets.
  const radius = Math.min(width, height) / NUM.ELEVEN;
  const horizontalStep = radius * (NUM.NINE / NUM.ELEVEN);
  const verticalStep = radius * (Math.sqrt(3) / 2);
  const startX = width / 2 - (cols - 1) * horizontalStep / 2;
  const startY = height / 2 - (rows - 1) * verticalStep / 2;

  ctx.save();
  ctx.strokeStyle = palette.layers[0];
  ctx.globalAlpha = 0.32; // Soft lines for a meditative field.
  ctx.lineWidth = 1.5;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = startX + col * horizontalStep;
      const cy = startY + row * verticalStep;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Central vesica pair with 33:22 ratio to emphasise the heart of the lattice.
  const centralRadius = radius * (NUM.THIRTYTHREE / NUM.TWENTYTWO);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  const offset = centralRadius / NUM.THREE;
  ctx.beginPath();
  ctx.arc(width / 2 - offset, height / 2, centralRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width / 2 + offset, height / 2, centralRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Render a Tree-of-Life scaffold: positioned sephirot (nodes) and connecting paths.
 *
 * The function computes a 10-node layout proportionally from `dims` using numeric
 * constants from `NUM`, strokes the inter-node paths with `palette.layers[1]`,
 * and draws filled node discs (with a subtle inner stroke) using `palette.layers[2]`
 * and `palette.ink`. All drawing is performed directly on the provided canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx - 2D canvas context to draw into.
 * @param {{width:number, height:number}} dims - Rendering bounds; used to derive node positions and spacing.
 * @param {{layers: string[], ink: string}} palette - Color palette (expects at least three layer colors and an ink color).
 * @param {object} NUM - Numeric constants (e.g., SEVEN, NINE, ELEVEN, THIRTYTHREE) used for spacing and sizing.
 */
function drawTreeOfLife(ctx, dims, palette, NUM) {
  const { width, height } = dims;
  const centerX = width / 2;
  const xSpacing = width / NUM.SEVEN;
  const ySpacing = height / NUM.NINE;
  const topMargin = height / NUM.ELEVEN;
  const nodeRadius = Math.min(width, height) / NUM.THIRTYTHREE;

  const nodes = [
    { id: "keter", x: centerX, y: topMargin },
    { id: "chokmah", x: centerX - xSpacing * 0.75, y: topMargin + ySpacing },
    { id: "binah", x: centerX + xSpacing * 0.75, y: topMargin + ySpacing },
    { id: "chesed", x: centerX - xSpacing, y: topMargin + ySpacing * 2 },
    { id: "geburah", x: centerX + xSpacing, y: topMargin + ySpacing * 2 },
    { id: "tiphareth", x: centerX, y: topMargin + ySpacing * 3.3 },
    { id: "netzach", x: centerX - xSpacing * 1.05, y: topMargin + ySpacing * 4.6 },
    { id: "hod", x: centerX + xSpacing * 1.05, y: topMargin + ySpacing * 4.6 },
    { id: "yesod", x: centerX, y: topMargin + ySpacing * 6 },
    { id: "malkuth", x: centerX, y: topMargin + ySpacing * 7.1 }
  ];

  const paths = [
    [0, 1], [0, 2], [0, 5],
    [1, 2], [1, 3], [1, 5], [1, 6],
    [2, 4], [2, 5], [2, 7],
    [3, 4], [3, 5], [3, 6],
    [4, 5], [4, 7],
    [5, 6], [5, 7], [5, 8],
    [6, 7], [6, 8], [7, 8],
    [8, 9]
  ];

  ctx.save();
  ctx.strokeStyle = palette.layers[1];
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2.2;

  for (const [a, b] of paths) {
    const start = nodes[a];
    const end = nodes[b];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  ctx.fillStyle = palette.layers[2];
  ctx.globalAlpha = 0.95;
  for (const node of nodes) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.ink;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = palette.layers[2];
  }

  ctx.restore();
}

/**
 * Draws a static, logarithmic "Fibonacci-inspired" spiral and subtle point markers.
 *
 * Generates a smooth spiral centered at a fractional position of the canvas using
 * a geometric radius interpolation from a small start radius to a larger final radius
 * over NUM.NINETYNINE steps (approximately 1.5 rotations). The spiral polyline is stroked
 * with palette.layers[3]. Quiet circular markers are filled on every NUM.ELEVEN-th point
 * using palette.layers[4].
 *
 * Does not return a value; renders directly to the provided 2D canvas context.
 *
 * @param {{width: number, height: number}} dims - Canvas dimensions (uses width and height to compute center and radii).
 * @param {Object} palette - Normalized palette; expects layer colors at indices 3 (curve) and 4 (markers).
 * @param {Object} NUM - Numeric constants used for layout (expects NINETYNINE, THREE, TWENTYTW O? NO; expects ONEFORTYFOUR, ELEVEN, THREE, TWENTYTWO, NINETYNINE). 
 */
function drawFibonacciCurve(ctx, dims, palette, NUM) {
  const { width, height } = dims;
  const centre = { x: width * 0.27, y: height * 0.62 };
  const startRadius = Math.min(width, height) / NUM.TWENTYTWO;
  const finalRadius = Math.min(width, height) / NUM.THREE;
  const steps = NUM.NINETYNINE;
  const totalAngle = NUM.THREE * Math.PI; // 1.5 rotations keeps the curve calm.

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * totalAngle;
    const radius = startRadius * Math.pow(finalRadius / startRadius, t);
    const x = centre.x + Math.cos(angle) * radius;
    const y = centre.y + Math.sin(angle) * radius;
    points.push({ x, y });
  }

  ctx.save();
  ctx.strokeStyle = palette.layers[3];
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  strokePolyline(ctx, points);

  // Quiet markers on every 11th point to honour the sequence pacing.
  ctx.fillStyle = palette.layers[4];
  ctx.globalAlpha = 0.55;
  const markerRadius = Math.min(width, height) / NUM.ONEFORTYFOUR;
  for (let i = 0; i < points.length; i += NUM.ELEVEN) {
    const p = points[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, markerRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render a static double-helix pair with connecting lattice rungs and anchor circles.
 *
 * Draws two phase-shifted helix polylines inside the given drawing bounds, connects them
 * with regularly spaced "rungs", and paints four soft anchor disks at the top and bottom.
 *
 * Parameters:
 * - dims.width / dims.height: bounding box used to compute helix placement and scale.
 * - palette.layers[4] and palette.layers[5] are used for the two helix strands; palette.ink
 *   is used for the lattice rungs and subdued anchors use the last helix layer color.
 * - NUM controls numeric layout constants (expects at least ELEVEN, NINETYNINE, TWENTYTWO,
 *   SEVEN, THREE, and NINE).
 *
 * Side effects: issues drawing commands on the provided 2D canvas rendering context (no return).
 */
function drawDoubleHelix(ctx, dims, palette, NUM) {
  const { width, height } = dims;
  const helixHeight = height * 0.72;
  const top = (height - helixHeight) / 2;
  const amplitude = width / NUM.ELEVEN;
  const steps = NUM.NINETYNINE;
  const phaseShift = Math.PI / NUM.SEVEN;
  const leftOffset = width * 0.35;
  const rightOffset = width * 0.65;
  const totalAngle = NUM.NINE * Math.PI / NUM.THREE; // 3π for gentle twist.

  const leftPoints = [];
  const rightPoints = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = top + helixHeight * t;
    const angle = totalAngle * t;
    const leftX = leftOffset + Math.sin(angle) * amplitude;
    const rightX = rightOffset + Math.sin(angle + phaseShift) * amplitude;
    leftPoints.push({ x: leftX, y });
    rightPoints.push({ x: rightX, y });
  }

  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = palette.layers[4];
  strokePolyline(ctx, leftPoints);
  ctx.strokeStyle = palette.layers[5];
  strokePolyline(ctx, rightPoints);

  // Lattice rungs every fourth step (22 connectors over 99 samples).
  const rungStep = Math.max(1, Math.floor(steps / NUM.TWENTYTWO));
  ctx.strokeStyle = palette.ink;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= steps; i += rungStep) {
    const left = leftPoints[i];
    const right = rightPoints[i];
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }

  // Anchor circles to show the helix roots without implying motion.
  const anchorRadius = Math.min(width, height) / NUM.TWENTYTWO;
  ctx.fillStyle = palette.layers[5];
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(leftPoints[0].x, top, anchorRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rightPoints[0].x, top, anchorRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(leftPoints[steps].x, top + helixHeight, anchorRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rightPoints[steps].x, top + helixHeight, anchorRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Stroke an open polyline through a sequence of 2D points on the provided canvas context.
 *
 * Draws straight segments from the first point to each subsequent point and calls ctx.stroke().
 * The path is not closed. If `points` is empty the function returns without drawing.
 *
 * @param {Array<{x: number, y: number}>} points - Ordered array of points with numeric `x` and `y`.
 */
function strokePolyline(ctx, points) {
  if (points.length === 0) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}
