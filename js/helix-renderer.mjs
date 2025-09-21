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
 * Render the full multi-layer helix composition onto a 2D canvas context.
 *
 * Renders, in order, a vesica-field grid, a simplified Tree-of-Life scaffold, a Fibonacci-like spiral with markers,
 * and a double-helix lattice with cross-links and anchors. The function clears and fills the canvas background,
 * normalizes palette and numeric constants, and draws the four layers with stable, high-contrast styling.
 *
 * If `ctx` is falsy the function returns early. All drawing is performed directly on the provided canvas context.
 *
 * Options:
 * - width, height: override canvas dimensions used for layout (default: ctx.canvas.width/height).
 * - NUM: partial override of numeric layout constants (merged with defaults).
 * - palette: partial palette overrides (merged and normalized).
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
 * Return a palette merging DEFAULT_PALETTE with optional overrides, ensuring the layers array keeps the default order and length.
 *
 * @param {Object} [custom] - Partial palette overrides. If `custom.layers` is an array its entries will override corresponding default layer colors.
 * @returns {Object} Normalized palette with a guaranteed `layers` array whose length and ordering match DEFAULT_PALETTE.layers.
 */
function normalisePalette(custom) {
  const palette = { ...DEFAULT_PALETTE, ...(custom || {}) };
  const baseLayers = DEFAULT_PALETTE.layers;
  const provided = Array.isArray(palette.layers) ? palette.layers : baseLayers;
  palette.layers = baseLayers.map((color, index) => provided[index] ?? color);
  return palette;
}

/**
 * Fill the canvas area with the palette background color.
 *
 * Paints a filled rectangle covering [0, 0, width, height] using palette.bg. The canvas state is saved and restored.
 * @param {number} width - Width of the area to fill.
 * @param {number} height - Height of the area to fill.
 * @param {{bg: string}} palette - Palette object containing a `bg` CSS color string used as the background.
 */
function fillBackground(ctx, width, height, palette) {
  ctx.save();
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Draws a grid of vesica-style circles and a central paired vesica on the canvas.
 *
 * Renders a lattice of evenly spaced circles (rows × cols) centered in the given dimensions,
 * then draws two larger, slightly offset central circles to emphasize the lattice core.
 *
 * @param {Object} dims - Drawing bounds; object with numeric `width` and `height`.
 * @param {Object} palette - Palette object; the first entry in `palette.layers` is used for strokes.
 * @param {Object} NUM - Numeric constants object (expects fields used here: NINE, SEVEN, ELEVEN, THIRTYTHREE, TWENTYTWO, THREE).
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
 * Render a simplified "Tree of Life" scaffold onto a canvas context.
 *
 * Draws a fixed 10-node diagram with 23 straight-line connections and filled circular nodes.
 * - Connection strokes use palette.layers[1].
 * - Node fills use palette.layers[2]; inner rings are stroked with palette.ink.
 * The layout is deterministically positioned from dims and NUM constants (spacing, margins, and node radius).
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw into.
 * @param {{width:number,height:number}} dims - Drawing surface dimensions; used to compute node positions and spacing.
 * @param {object} palette - Color palette; expects layers array and an ink color (palette.layers[1], palette.layers[2], palette.ink).
 * @param {object} NUM - Numeric constants used for spacing and sizing (e.g., SEVEN, NINE, ELEVEN, THIRTYTHREE).
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
 * Draws a static Fibonacci-like logarithmic spiral and periodic markers.
 *
 * Computes a sequence of points forming a calm, 1.5-rotation log-spiral anchored at a
 * canvas-relative centre, strokes the resulting polyline with the fourth palette layer,
 * and places subdued circular markers on every 11th point using the fifth palette layer.
 *
 * @param {Object} dims - Drawing dimensions; required properties: `width` and `height`.
 * @param {Object} palette - Colour palette expected to contain a `layers` array; layer indices 3 and 4 are used.
 * @param {Object} NUM - Numeric constants object used for layout (expects keys like THREE, TWENTYTWO, NINETYNINE, ELEVEN, ONEFORTYFOUR).
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
 * Render a static double-helix with cross-link "rungs" and four anchor circles onto a canvas.
 *
 * Draws two intertwined polylines (left/right strands), periodic lattice rungs connecting them,
 * and anchor circles at the helix ends. Styling and dimensions are driven by `palette` colors
 * and numeric constants from `NUM`. Uses `dims.width`/`dims.height` to size and center the helix.
 *
 * Parameters:
 * - `palette.layers[4]` and `palette.layers[5]` are used for the two strands; `palette.ink` is used for rungs.
 * - `NUM` supplies integer constants (e.g., ELEVEN, NINETYNINE, TWENTYTWO, SEVEN, NINE, THREE) used for spacing, amplitude, and sampling.
 *
 * Side effects:
 * - Mutates the provided 2D canvas context (`ctx`) state (alpha, line width, stroke/fill styles) but restores it before returning.
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
 * Stroke a continuous polyline through a sequence of 2D points.
 *
 * Renders a single stroked path connecting the provided points in order.
 *
 * @param {Array<{x:number,y:number}>} points - Ordered list of point coordinates to connect. If empty, the function does nothing.
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
