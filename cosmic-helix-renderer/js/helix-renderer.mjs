/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)
    3) Fibonacci curve (log spiral polyline; static)
    4) Double-helix lattice (two phase-shifted braids + crossbars)

  All drawing routines are pure functions that accept explicit parameters, so the
  geometry stays predictable and offline friendly.
*/

/**
 * @typedef {Object} RenderOptions
 * @property {number} width
 * @property {number} height
 * @property {{ bg:string, ink:string, layers:string[] }} palette
 * @property {{ THREE:number, SEVEN:number, NINE:number, ELEVEN:number, TWENTYTWO:number, THIRTYTHREE:number, NINETYNINE:number, ONEFORTYFOUR:number }} NUM
 */

/**
 * Render the complete helix composition.
 * @param {CanvasRenderingContext2D} ctx
 * @param {RenderOptions} options
 */
export function renderHelix(ctx, options) {
  const { width, height, palette, NUM } = options;
  const layerColors = normalizeLayers(palette.layers);

  clearCanvas(ctx, palette.bg, width, height);
  drawVesicaField(ctx, { width, height, stroke: layerColors[0], NUM });
  drawTreeOfLife(ctx, {
    width,
    height,
    nodeFill: layerColors[2],
    pathStroke: layerColors[1],
    textColor: palette.ink,
    NUM,
  });
  drawFibonacciCurve(ctx, { width, height, stroke: layerColors[3], NUM });
  drawDoubleHelix(ctx, { width, height, strokeA: layerColors[4], strokeB: layerColors[5], NUM });
}

function normalizeLayers(colors) {
  const fallback = ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"];
  const safe = Array.isArray(colors) ? colors.slice(0, 6) : [];
  while (safe.length < 6) {
    safe.push(fallback[safe.length]);
  }
  return safe;
}

/**
 * Fill the entire canvas area with a solid color.
 *
 * Fills the rectangle from (0,0) to (width,height) on the provided canvas
 * context with the specified CSS color. The canvas state is saved and
 * restored so the caller's drawing state (transforms, styles, etc.) is preserved.
 *
 * @param {string} color - Any valid CSS color used to fill the background.
 * @param {number} width - Width of the area to fill, in pixels.
 * @param {number} height - Height of the area to fill, in pixels.
 */
function clearCanvas(ctx, color, width, height) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Draws a gentle vesica field: a 3×7 grid of overlapping circles centered on the canvas.
 *
 * The circles are stroked with the provided color and rendered with reduced opacity (33/99)
 * to produce a soft overlay. Radii and horizontal/vertical spacing are computed from the
 * supplied NUM numeric-constants object so sizes scale consistently across canvases.
 *
 * @param {number} width - Canvas width in pixels.
 * @param {number} height - Canvas height in pixels.
 * @param {string} stroke - Stroke color used for the circle outlines.
 * @param {Object} NUM - Numeric constants used to derive scale factors (e.g., ONEFORTYFOUR, NINE, ELEVEN, SEVEN, THIRTYTHREE, NINETYNINE).
 */
function drawVesicaField(ctx, { width, height, stroke, NUM }) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = NUM.THIRTYTHREE / NUM.NINETYNINE; // 33/99 keeps the vesica field gentle.
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) / (NUM.ONEFORTYFOUR / NUM.NINE);
  const horizontalStep = baseRadius * (NUM.ELEVEN / NUM.SEVEN);
  const verticalStep = baseRadius * (NUM.NINE / NUM.ELEVEN);

  const columns = [-1, 0, 1];
  const rows = [-3, -2, -1, 0, 1, 2, 3]; // Seven rows echoing the 7 heavens.

  columns.forEach((col) => {
    rows.forEach((row) => {
      const cx = centerX + col * horizontalStep;
      const cy = centerY + row * verticalStep;
      drawCircle(ctx, cx, cy, baseRadius);
    });
  });

  ctx.restore();
}

/**
 * Draws an outlined circle (stroke only) at the specified canvas coordinates.
 *
 * @param {number} x - X coordinate of the circle center in pixels.
 * @param {number} y - Y coordinate of the circle center in pixels.
 * @param {number} radius - Radius of the circle in pixels.
 */
function drawCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Draws a Tree-of-Life scaffold (10 labeled nodes and 22 connecting paths) onto the canvas.
 *
 * Positions and spacing are computed from the supplied width/height and the NUM constant ratios.
 * The function renders:
 *  - 10 circular nodes labeled "1"–"10"
 *  - 22 straight-line connections between nodes (classic Tree-of-Life layout)
 * Node radii, vertical bounds, column offsets and row steps are all derived from the NUM numeric map to keep layout scale-independent.
 *
 * @param {Object} options - Rendering options (see fields).
 * @param {number} options.width - Canvas width used to compute layout.
 * @param {number} options.height - Canvas height used to compute layout.
 * @param {string} options.nodeFill - CSS color used to fill each node.
 * @param {string} options.pathStroke - CSS color used to stroke the connecting paths.
 * @param {string} options.textColor - CSS color used for node outlines and label text.
 * @param {Object} options.NUM - Map of numeric constants (e.g., ELEVEN, ONEFORTYFOUR, THIRTYTHREE, etc.) used for ratio-driven geometry.
 */
function drawTreeOfLife(ctx, { width, height, nodeFill, pathStroke, textColor, NUM }) {
  ctx.save();
  const top = height * (NUM.ELEVEN / NUM.ONEFORTYFOUR);
  const bottom = height * (NUM.ONEFORTYFOUR - NUM.ELEVEN) / NUM.ONEFORTYFOUR;
  const centerX = width * 0.5;
  const columnOffset = width / (NUM.ONEFORTYFOUR / NUM.THIRTYTHREE);
  const rowStep = (bottom - top) / (NUM.NINE - NUM.THREE);

  const nodes = [
    { name: "1", x: centerX, y: top },
    { name: "2", x: centerX + columnOffset, y: top + rowStep * (NUM.NINE / NUM.SEVEN) },
    { name: "3", x: centerX - columnOffset, y: top + rowStep * (NUM.NINE / NUM.SEVEN) },
    { name: "4", x: centerX + columnOffset * (NUM.THIRTYTHREE / NUM.TWENTYTWO), y: top + rowStep * (NUM.THIRTYTHREE / NUM.TWENTYTWO) },
    { name: "5", x: centerX - columnOffset * (NUM.THIRTYTHREE / NUM.TWENTYTWO), y: top + rowStep * (NUM.THIRTYTHREE / NUM.TWENTYTWO) },
    { name: "6", x: centerX, y: top + rowStep * (NUM.TWENTYTWO / NUM.NINE) },
    { name: "7", x: centerX - columnOffset, y: top + rowStep * (NUM.NINE / NUM.THREE) },
    { name: "8", x: centerX + columnOffset, y: top + rowStep * (NUM.NINE / NUM.THREE) },
    { name: "9", x: centerX, y: bottom - rowStep * (NUM.NINE / NUM.TWENTYTWO) },
    { name: "10", x: centerX, y: bottom },
  ];

  const paths = [
    [0,1],[0,2],[1,3],[1,5],[2,4],[2,5],[3,5],[3,7],[4,5],[4,6],
    [5,6],[5,7],[5,8],[6,9],[7,9],[8,9],[9,10],[7,8],[1,4],[2,3],[3,6],[2,6]
  ]; // 22 connective paths echo the major arcana count.

  ctx.strokeStyle = pathStroke;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;

  paths.forEach(([start, end]) => {
    const a = nodes[start];
    const b = nodes[end];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  ctx.fillStyle = nodeFill;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 1;

  const nodeRadius = Math.max(NUM.ELEVEN, Math.min(width, height) / (NUM.ONEFORTYFOUR / NUM.THREE));
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = textColor;
  ctx.font = "14px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  nodes.forEach((node) => {
    ctx.fillText(node.name, node.x, node.y);
  });

  ctx.restore();
}

/**
 * Draws a Fibonacci (logarithmic) spiral polyline onto the provided canvas context.
 *
 * The spiral's center, base radius, opacity, and number of turns are derived from the supplied
 * width/height and the NUM constants; points are produced by createSpiralPoints and stroked
 * with the provided color.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw into.
 * @param {Object} options - Rendering options.
 * @param {number} options.width - Canvas width in pixels.
 * @param {number} options.height - Canvas height in pixels.
 * @param {string} options.stroke - Stroke color used to render the spiral.
 * @param {Object} options.NUM - Numeric-constants object that controls scaling and opacity.
 */
function drawFibonacciCurve(ctx, { width, height, stroke, NUM }) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.globalAlpha = NUM.NINETYNINE / (NUM.ONEFORTYFOUR + NUM.NINETYNINE);

  const phi = (1 + Math.sqrt(5)) / 2; // Fibonacci growth rate.
  const centerX = width * (NUM.ONEFORTYFOUR - NUM.THIRTYTHREE) / NUM.ONEFORTYFOUR;
  const centerY = height * (NUM.NINETYNINE / (NUM.ONEFORTYFOUR + NUM.THIRTYTHREE));
  const baseRadius = Math.min(width, height) / (NUM.ONEFORTYFOUR / NUM.SEVEN);
  const steps = Math.floor(NUM.NINETYNINE / NUM.ELEVEN); // Nine turns keep the spiral grounded.

  const points = createSpiralPoints({ steps, baseRadius, phi, centerX, centerY, NUM });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  ctx.restore();
}

/**
 * Generate points along a logarithmic (Fibonacci-style) spiral.
 *
 * Produces an array of {x, y} coordinates sampled at integer steps from 0..steps.
 * Each point's angle advances by (π * NUM.THIRTYTHREE / NUM.NINETYNINE) per step
 * and the radius grows multiplicatively by phi^(i / NUM.SEVEN).
 *
 * @param {object} options
 * @param {number} options.steps - Number of steps (samples) along the spiral.
 * @param {number} options.baseRadius - Radius at step 0.
 * @param {number} options.phi - Growth factor (e.g., golden ratio) applied per NUM.SEVEN fraction of a step.
 * @param {number} options.centerX - X coordinate of the spiral center.
 * @param {number} options.centerY - Y coordinate of the spiral center.
 * @param {object} options.NUM - Numeric constants object; used for fractional constants (e.g., NUM.THIRTYTHREE / NUM.NINETYNINE and NUM.SEVEN).
 * @return {Array<{x:number,y:number}>} Array of points describing the spiral polyline.
 */
function createSpiralPoints({ steps, baseRadius, phi, centerX, centerY, NUM }) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const theta = (Math.PI * NUM.THIRTYTHREE / NUM.NINETYNINE) * i; // 60° increments (33/99 reduces to 1/3).
    const radius = baseRadius * Math.pow(phi, i / NUM.SEVEN);
    points.push({
      x: centerX + Math.cos(theta) * radius,
      y: centerY + Math.sin(theta) * radius,
    });
  }
  return points;
}

/**
 * Render a double-helix lattice: two phase-shifted sinusoidal strands with regular crossbars.
 *
 * Draws two helical polylines spanning a vertical band derived from the canvas size and the
 * provided NUM proportions, strokes each strand with the specified colors, and draws evenly
 * spaced transverse lines between corresponding points on the strands to form a lattice.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw into.
 * @param {Object} options - Rendering options.
 * @param {number} options.width - Canvas width in pixels; used to compute horizontal layout and amplitude.
 * @param {number} options.height - Canvas height in pixels; used to compute vertical bounds.
 * @param {string} options.strokeA - CSS color for the first strand.
 * @param {string} options.strokeB - CSS color for the second strand.
 * @param {Object} options.NUM - Numeric constants object (scaling ratios) used to compute positions, counts, and opacities.
 */
function drawDoubleHelix(ctx, { width, height, strokeA, strokeB, NUM }) {
  ctx.save();
  const top = height * (NUM.SEVEN / NUM.ONEFORTYFOUR);
  const bottom = height * (NUM.ONEFORTYFOUR - NUM.SEVEN) / NUM.ONEFORTYFOUR;
  const centerX = width / (NUM.TWENTYTWO / NUM.SEVEN);
  const amplitude = width / (NUM.NINETYNINE / NUM.ELEVEN);
  const strands = NUM.THIRTYTHREE; // 33 to echo the spine.

  const strandA = createHelixPoints({ top, bottom, centerX, amplitude, strands, phase: 0, NUM });
  const strandB = createHelixPoints({ top, bottom, centerX, amplitude, strands, phase: Math.PI, NUM });

  ctx.lineWidth = 2.5;
  ctx.globalAlpha = (NUM.ONEFORTYFOUR - NUM.NINE) / NUM.ONEFORTYFOUR;
  drawPolyline(ctx, strandA, strokeA);
  drawPolyline(ctx, strandB, strokeB);

  const latticeLines = Math.floor(NUM.NINETYNINE / NUM.NINE);
  for (let i = 0; i <= latticeLines; i += 1) {
    const t = i / latticeLines;
    const nodeA = strandA[Math.floor(t * (strandA.length - 1))];
    const nodeB = strandB[Math.floor(t * (strandB.length - 1))];
    ctx.strokeStyle = blendColors(strokeA, strokeB, 0.5);
    ctx.globalAlpha = (NUM.TWENTYTWO / NUM.ONEFORTYFOUR) * NUM.THREE;
    ctx.beginPath();
    ctx.moveTo(nodeA.x, nodeA.y);
    ctx.lineTo(nodeB.x, nodeB.y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Generate a vertical sequence of (x,y) points forming a sinusoidal helix between two Y bounds.
 *
 * @param {Object} params
 * @param {number} params.top - Y coordinate of the helix top.
 * @param {number} params.bottom - Y coordinate of the helix bottom.
 * @param {number} params.centerX - Horizontal center around which the helix oscillates.
 * @param {number} params.amplitude - Horizontal amplitude of the sine wave.
 * @param {number} params.strands - Number of segments (intervals) to divide the vertical span into; the function returns strands+1 points including both endpoints.
 * @param {number} params.phase - Phase offset (radians) added to the sinusoidal angle.
 * @param {Object} params.NUM - Numeric constants object used for angle scaling (expects properties like NINETYNINE and THIRTYTHREE).
 * @return {Array<{x: number, y: number}>} Array of points {x,y} sampled evenly in Y from top to bottom producing a horizontally oscillating helix.
 */
function createHelixPoints({ top, bottom, centerX, amplitude, strands, phase, NUM }) {
  const points = [];
  for (let i = 0; i <= strands; i += 1) {
    const t = i / strands;
    const y = top + (bottom - top) * t;
    const angle = t * Math.PI * (NUM.NINETYNINE / NUM.THIRTYTHREE) + phase; // 3 full waves via 99/33.
    const x = centerX + Math.sin(angle) * amplitude;
    points.push({ x, y });
  }
  return points;
}

function drawPolyline(ctx, points, strokeStyle) {
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
}

function blendColors(colorA, colorB, ratio) {
  const parse = (hex) => {
    const value = hex.replace("#", "");
    const chunk = value.length === 3 ? value.split("").map((c) => c + c) : value.match(/.{1,2}/g);
    if (!chunk) return [255, 255, 255];
    return chunk.map((segment) => parseInt(segment, 16));
  };
  const [r1, g1, b1] = parse(colorA);
  const [r2, g2, b2] = parse(colorB);
  const mix = (a, b) => Math.round(a + (b - a) * ratio);
  return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;
}
