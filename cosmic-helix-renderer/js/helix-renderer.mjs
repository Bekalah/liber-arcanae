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
 * Fill the entire canvas with a solid background color while preserving the canvas state.
 *
 * Saves and restores the drawing context so existing context settings (transforms, styles, alpha, etc.)
 * are not affected.
 *
 * @param {string} color - CSS color string used to fill the canvas (e.g., '#000', 'rgba(0,0,0,1)').
 * @param {number} width - Canvas width in pixels.
 * @param {number} height - Canvas height in pixels.
 */
function clearCanvas(ctx, color, width, height) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Render a gentle vesica-field: a centered 3×7 grid of overlapping stroked circles.
 *
 * Circles are arranged around (width/2, height/2). Radius, horizontal/vertical spacing,
 * and drawing alpha are derived from the provided NUM constants so the composition
 * scales consistently across different canvas sizes and NUM configurations.
 * The function temporarily modifies canvas state (strokeStyle, globalAlpha, lineWidth)
 * and restores it before returning.
 *
 * @param {string} stroke - Stroke color for the circle outlines (any valid canvas color string).
 * @param {Object} NUM - Numeric constants used to compute geometry and alpha (e.g., tokens like THREE, SEVEN, NINE, ELEVEN, THIRTYTHREE, NINETYNINE, ONEFORTYFOUR).
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
 * Draws an outlined circle centered at (x, y) with the given radius on the provided canvas context.
 *
 * Uses the context's current strokeStyle and lineWidth; does not fill the circle.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw on.
 * @param {number} x - X coordinate of the circle center.
 * @param {number} y - Y coordinate of the circle center.
 * @param {number} radius - Radius of the circle in pixels.
 */
function drawCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Render a scaled "Tree of Life" scaffold: ten sephirot nodes connected by twenty-two paths with centered numeric labels.
 *
 * Positions, spacing, node radius, and transparency are derived from the provided NUM numeric tokens so the layout
 * scales consistently with the renderer's token-based proportions. The function draws connection paths first, then
 * filled circular nodes with stroked outlines and centered numeric labels.
 *
 * @param {Object} options - Rendering options.
 * @param {number} options.width - Canvas width in pixels.
 * @param {number} options.height - Canvas height in pixels.
 * @param {string} options.nodeFill - Fill color for the node discs (CSS color or hex).
 * @param {string} options.pathStroke - Stroke color used for connecting paths.
 * @param {string} options.textColor - Color used for node outlines and numeric labels.
 * @param {Object} options.NUM - Numeric constants object (e.g., THREE, SEVEN, NINE, ELEVEN, TWENTYTWO, THIRTYTHREE, NINETYNINE, ONEFORTYFOUR)
 *   used to compute layout, spacing, radii, and alpha values.
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
 * Draws a Fibonacci (logarithmic) spiral as a stroked polyline onto the provided canvas context.
 *
 * The spiral's size, position, number of turns, and alpha are derived from the supplied NUM constants
 * so the geometry scales consistently with the rest of the composition.
 *
 * @param {number} width - Canvas width used to position/scale the spiral.
 * @param {number} height - Canvas height used to position/scale the spiral.
 * @param {string} stroke - Stroke style (CSS color) used to draw the spiral line.
 * @param {Object} NUM - Numeric tokens object (e.g., NUM.SEVEN, NUM.NINETYNINE) controlling scale and steps.
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
 * Generate an array of (x,y) points tracing a logarithmic spiral (Fibonacci-style).
 *
 * The spiral starts at radius `baseRadius` and grows by factor `phi` every `NUM.SEVEN`
 * steps; angles advance by (π * NUM.THIRTYTHREE / NUM.NINETYNINE) per step. The loop
 * is inclusive, so the returned array contains `steps + 1` points.
 *
 * @param {Object} params
 * @param {number} params.steps - Number of discrete steps (segments) to generate.
 * @param {number} params.baseRadius - Initial radius at step 0.
 * @param {number} params.phi - Radial growth multiplier (typically the golden ratio).
 * @param {number} params.centerX - X coordinate of the spiral center.
 * @param {number} params.centerY - Y coordinate of the spiral center.
 * @param {Object} params.NUM - Numeric constants object used to compute angle increment and radial scaling.
 * @return {{x: number, y: number}[]} Array of point objects in canvas coordinates. */
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
 * Render a double-helix lattice onto the given canvas context.
 *
 * Draws two vertically oriented, phase-shifted sinusoidal strands and connects corresponding
 * sample points with evenly spaced crossbars to form a lattice. This function paints directly
 * to the provided CanvasRenderingContext2D and does not return a value.
 *
 * @param {object} NUM - Numeric-constant tokens used to scale geometry, spacing, amplitudes,
 *                       strand counts and alpha values for the helix and lattice.  The function
 *                       reads values such as SEVEN, NINE, TWENTYTWO, THIRTYTHREE, NINETYNINE
 *                       and ONEFORTYFOUR to compute positions and opacities.
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
 * Generate a vertical helix as a sequence of 2D points (sinusoidal X displacement) from top to bottom.
 *
 * Returns an array of (strands + 1) points evenly spaced in Y from `top` to `bottom`. Each point's
 * X coordinate is computed as `centerX + Math.sin(angle) * amplitude`, where `angle` advances with
 * normalized position and is scaled using the provided NUM tokens.
 *
 * @param {number} strands - Number of segments along the helix; the result contains `strands + 1` points (inclusive endpoints).
 * @param {number} phase - Phase offset in radians applied to the sine wave.
 * @param {Object} NUM - Numeric-constants object used to scale helix frequency (expects tokens such as `NINETYNINE` and `THIRTYTHREE`).
 * @return {Array<{x: number, y: number}>} Points ordered from top to bottom describing the helix strand.
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
