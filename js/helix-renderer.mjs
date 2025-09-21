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
 * Render a static, multi-layered sacred-geometry composition onto a 2D canvas.
 *
 * Draws four compositional layers (vesica field, Tree of Life scaffold, a
 * Fibonacci-like spiral, and a double-helix lattice) using a normalized palette
 * and numeric constants. The function preserves and restores the canvas state;
 * if `ctx` is falsy the call is a no-op.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw into.
 * @param {object} [options] - Optional rendering overrides.
 * @param {number} [options.width] - Canvas width to render into (defaults to ctx.canvas.width).
 * @param {number} [options.height] - Canvas height to render into (defaults to ctx.canvas.height).
 * @param {object} [options.NUM] - Partial overrides for numeric layout constants (merged with defaults).
 * @param {object} [options.palette] - Custom palette (merged and normalized with defaults).
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
 * Merge a custom palette with the defaults and ensure a complete layers array.
 *
 * The returned palette contains all default properties, with any provided
 * fields from `custom` overriding defaults. The `layers` array is normalized
 * so it has the same length as the default layers: missing entries are filled
 * from the defaults while provided entries are preserved.
 *
 * @param {Object} [custom] - Partial palette (may include `background`, `ink`, and `layers`).
 * @return {Object} Normalized palette ready for rendering.
 */
function normalisePalette(custom) {
  const palette = { ...DEFAULT_PALETTE, ...(custom || {}) };
  const baseLayers = DEFAULT_PALETTE.layers;
  const provided = Array.isArray(palette.layers) ? palette.layers : baseLayers;
  palette.layers = baseLayers.map((color, index) => provided[index] ?? color);
  return palette;
}

/**
 * Fill the canvas with the palette background color.
 *
 * Uses the palette's `bg` value as a CSS color and fills the entire rectangle
 * from (0,0) to (width,height). Saves and restores the canvas state around the fill.
 *
 * @param {number} width - Canvas width in pixels.
 * @param {number} height - Canvas height in pixels.
 * @param {{bg: string}} palette - Palette object containing a `bg` CSS color string.
 */
function fillBackground(ctx, width, height, palette) {
  ctx.save();
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Draws a soft, grid-like vesica field of circles and a central vesica pair onto the canvas.
 *
 * Renders a 9x7 grid of evenly spaced circles using the first layer color from the palette,
 * then overlays a slightly larger, dual central "vesica" pair (33:22 radius ratio) to emphasize
 * the composition's center. Uses semi-transparent strokes and restores the canvas state on exit.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw into.
 * @param {{width: number, height: number}} dims - Drawing dimensions; only `width` and `height` are used.
 * @param {Object} palette - Normalized palette object; the function uses `palette.layers[0]` for strokes.
 * @param {Object} NUM - Numeric constants object (expects properties like NINE, SEVEN, ELEVEN, THREE, THIRTYTHREE, TWENTYTWO) used to compute grid sizing and ratios.
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
 * Draws a simplified "Tree of Life" scaffold: connection lines between fixed nodes and styled circular nodes.
 *
 * Renders a centered arrangement of ten nodes positioned relative to the provided canvas dimensions, strokes
 * the inter-node connections, fills each node with a layer color and draws an inner ring to create visual depth.
 * The function saves and restores the canvas state before and after drawing.
 *
 * @param {{width:number,height:number}} dims - Canvas dimensions used to compute node positions and sizing.
 * @param {object} palette - Normalized palette containing at least `layers` (array) and `ink` (string) color entries.
 * @param {object} NUM - Numeric constants object (e.g., SEVEN, NINE, ELEVEN, THIRTYTHREE) used for spacing and sizing.
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
 * Draws a static Fibonacci-like logarithmic spiral and a series of quiet markers along it.
 *
 * The function computes a smooth spiral of `NUM.NINETYNINE + 1` points between a start
 * radius (min(width,height) / NUM.TWENTYTWO) and a final radius (min(width,height) / NUM.THREE),
 * centered at { x: width * 0.27, y: height * 0.62 }. It strokes the resulting polyline using
 * palette.layers[3], then places filled circular markers at every NUM.ELEVEN-th point using
 * palette.layers[4] with radius min(width,height) / NUM.ONEFORTYFOUR.
 *
 * The canvas drawing state is saved and restored by this function; it does not return a value.
 *
 * @param {{width:number,height:number}} dims - Canvas dimensions; used to compute center and radii.
 * @param {Object} palette - Normalized palette object; this function uses palette.layers[3] and palette.layers[4].
 * @param {Object} NUM - Numeric constants object (expects properties TWENTYTWO, THREE, NINETYNINE, ELEVEN, ONEFORTYFOUR).
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
 * Draws a static double-helix lattice with connector rungs and anchor nodes onto a canvas.
 *
 * Renders two phase-shifted helix polylines, evenly spaced vertical connectors ("rungs"),
 * and circular anchor markers at the top and bottom of each strand. The routine mutates
 * the provided canvas 2D context but preserves its state (saves and restores ctx).
 *
 * @param {Object} dims - Drawing dimensions; must include numeric `width` and `height`.
 * @param {Object} palette - Color palette object; expects `ink` and a `layers` array with colors used for the helices and anchors.
 * @param {Object} NUM - Numeric constants object (e.g., ELEVEN, NINETYNINE, SEVEN, TWENTYTWO, NINE, THREE) used to control spacing, steps, amplitudes, and radii.
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
 * Stroke a polyline connecting the given points on the supplied 2D canvas context.
 *
 * Does nothing if `points` is empty. The polyline is drawn using the context's current
 * path and stroke styles.
 *
 * @param {Array<{x: number, y: number}>} points - Ordered list of coordinates to connect.
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
