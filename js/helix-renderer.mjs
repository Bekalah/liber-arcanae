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
 * Render a static, layered "helix" composition onto a 2D canvas context.
 *
 * Draws four stacked visual layers (vesica field, Tree of Life scaffold, Fibonacci spiral,
 * and double-helix lattice) filling the provided canvas area. The function is idempotent
 * for a given context and options: it resets the context transform, clears the drawing
 * surface, paints the background, renders each layer in order, and then restores the
 * context state.
 *
 * If `ctx` is falsy the function returns immediately and does nothing.
 *
 * @param {Object} [options] - Rendering options.
 * @param {number} [options.width] - Canvas width to render into; falls back to `ctx.canvas.width`.
 * @param {number} [options.height] - Canvas height to render into; falls back to `ctx.canvas.height`.
 * @param {Object} [options.NUM] - Numeric constants override merged with library defaults.
 * @param {Object|Array} [options.palette] - Palette override passed to internal normalisePalette.
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
 * Produce a complete palette object by merging user overrides with defaults.
 *
 * Creates a new palette based on DEFAULT_PALETTE, applying any top-level properties
 * from `custom`. For the `layers` entry specifically, if `custom.layers` is an
 * array it will be used to override corresponding positions in the default
 * layers while preserving any missing entries; non-array `layers` values are
 * ignored and the default layer list retained.
 *
 * @param {Object} [custom] - Partial palette overrides (may include `bg`, `ink`, and `layers`).
 * @return {Object} A normalized palette object where `layers` is an array matching DEFAULT_PALETTE.layers length.
 */
function normalisePalette(custom) {
  const palette = { ...DEFAULT_PALETTE, ...(custom || {}) };
  const baseLayers = DEFAULT_PALETTE.layers;
  const provided = Array.isArray(palette.layers) ? palette.layers : baseLayers;
  palette.layers = baseLayers.map((color, index) => provided[index] ?? color);
  return palette;
}

/**
 * Fill the drawing surface with the palette background color.
 *
 * Uses palette.bg as the canvas fillStyle and paints a rectangle at (0,0)
 * covering width × height.
 *
 * @param {number} width - Width of the area to fill in pixels.
 * @param {number} height - Height of the area to fill in pixels.
 * @param {{bg: string}} palette - Palette object; `bg` is a CSS color used for the background.
 */
function fillBackground(ctx, width, height, palette) {
  ctx.save();
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Draws a centered grid of overlapping "vesica" circles and a larger central vesica pair.
 *
 * Renders a soft, evenly spaced lattice of circles (rows = NUM.NINE, cols = NUM.SEVEN) stroked with
 * palette.layers[0], then draws two larger central circles whose radius is scaled by NUM.THIRTYTHREE/NUM.TWENTYTWO.
 *
 * @param {Object} dims - Object with numeric `width` and `height` of the drawing surface.
 * @param {Object} palette - Palette object; this function uses `palette.layers[0]` for stroke color.
 * @param {Object} NUM - Numeric constants used for layout and sizing. Expected properties: NINE, SEVEN, ELEVEN, THREE, THIRTYTHREE, TWENTYTWO.
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
 * Render a simplified "Tree of Life" scaffold (nodes and connecting links) onto a 2D canvas.
 *
 * Renders a fixed arrangement of ten nodes positioned relative to the provided canvas dimensions,
 * strokes connecting paths between those nodes, and paints filled node discs with a smaller
 * inner stroke. Styling uses entries from the provided palette and numeric spacing constants from
 * NUM.
 *
 * @param {Object} dims - Drawing surface dimensions; must contain numeric `width` and `height`.
 * @param {Object} NUM - Numeric constants object (e.g., spacing and divisor constants) used to compute layout.
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
 * Render a static Fibonacci-like logarithmic spiral as a stroked polyline with periodic circular markers.
 *
 * The spiral is centered near 27% width / 62% height, its radius interpolates exponentially from
 * min(width,height)/NUM.TWENTYTWO to min(width,height)/NUM.THREE over NUM.NINETYNINE steps, and it covers
 * 1.5 rotations. The curve is stroked with palette.layers[3]; quieter markers (palette.layers[4]) are
 * placed every NUM.ELEVEN points with a radius of min(width,height)/NUM.ONEFORTYFOUR.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context.
 * @param {{width:number,height:number}} dims - Drawing surface dimensions.
 * @param {Object} palette - Normalized palette; expects color values in palette.layers.
 * @param {Object} NUM - Constants bag (e.g., THREE, NINETYNINE, ELEVEN, ONEFORTYFOUR) used for sizing and steps.
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
 * Render a static two-strand double-helix with transverse rungs and four anchor caps onto a 2D canvas context.
 *
 * Draws two sinusoidal strands (left and right), strokes each with different layer colors, renders evenly spaced
 * rung connectors between the strands to form a lattice, and paints semi-transparent anchor circles at the top and
 * bottom roots. This is a purely visual, non-animated rendering that mutates the provided canvas context state
 * (saved and restored within the function).
 *
 * @param {Object} dims - Drawing dimensions; must include numeric `width` and `height`.
 * @param {Object} palette - Color palette object; expects a `layers` array and `ink` color used for rungs/anchors.
 * @param {Object} NUM - Numeric constants object (e.g., NUM.ELEVEN, NUM.NINE, NUM.TWENTYTWO, NUM.NINETYNINE) used
 *   to scale amplitudes, sample counts, and spacing.
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
 * Stroke a continuous polyline on a canvas 2D context.
 *
 * Using the provided context, begins a path at the first point and draws
 * straight segments to each subsequent point, then strokes the path. If
 * `points` is empty the function returns without altering the context.
 *
 * @param {{x:number,y:number}[]} points - Ordered list of vertex coordinates to connect.
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
