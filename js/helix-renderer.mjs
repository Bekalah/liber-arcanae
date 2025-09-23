
/**
 * Render a static, ND-safe layered sacred-geometry scene onto a Canvas 2D context.
 *
 * Draws four ordered layers (vesica field, Tree of Life scaffold, Fibonacci curve,
 * and double-helix lattice) into the provided canvas context using pure, deterministic
 * drawing routines. The function clears the canvas, fills the background from the
 * normalized palette, computes drawing dimensions, renders layers in a fixed order,
 * and restores the canvas state.
 *
 * @param {CanvasRenderingContext2D} ctx - Destination 2D rendering context.
 * @param {Object} options - Rendering options.
 * @param {number} options.width - Canvas width in pixels.
 * @param {number} options.height - Canvas height in pixels.
 * @param {Object|undefined} options.palette - Optional palette object; normalized defaults are used when missing.
 * @param {Object} options.NUM - Numeric constants/config used by the layer renderers.
 */

/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)

    3) Fibonacci curve (log spiral polyline; static)
    4) Double-helix lattice (two phase-shifted strands, fixed rungs)

  All drawing routines are pure functions that accept a context and
  explicit parameters. Comments document ND-safe rationale (no motion,
  calm palette, respectful layer ordering).
*/


export function renderHelix(ctx, options) {
  const { width, height, palette, NUM } = options;
  const safePalette = normalizePalette(palette);

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = safePalette.bg;
  ctx.fillRect(0, 0, width, height);

  const dims = { width, height, centerX: width / 2, centerY: height / 2 };

  drawVesicaField(ctx, dims, safePalette.layers[0], NUM);
  drawTreeOfLife(ctx, dims, safePalette.layers.slice(1, 3), NUM);
  drawFibonacciCurve(ctx, dims, safePalette.layers[3], NUM);
  drawHelixLattice(ctx, dims, safePalette.layers.slice(4), NUM);

  ctx.restore();
}

/**
 * Normalize a user-supplied color palette into a deterministic object with bg, ink, and layers.
 *
 * Uses the provided palette properties when present; falls back to sensible defaults:
 * - bg defaults to "#0b0b12"
 * - ink defaults to "#e8e8f0"
 * - layers defaults to ["#9fb8ff","#89f7fe","#a0ffa1","#ffd27f","#f5a3ff","#d0d0e6"] when missing or empty
 *
 * @param {Object} [palette] - Optional palette overrides.
 * @param {string} [palette.bg] - Background color (CSS string).
 * @param {string} [palette.ink] - Foreground/ink color (CSS string).
 * @param {string[]} [palette.layers] - Array of layer color strings; used only if non-empty.
 * @return {{bg: string, ink: string, layers: string[]}} Normalized palette suitable for rendering.
 */
function normalizePalette(palette) {
  const layers = Array.isArray(palette?.layers) && palette.layers.length > 0
    ? palette.layers
    : ["#9fb8ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"];
  return {
    bg: palette?.bg || "#0b0b12",
    ink: palette?.ink || "#e8e8f0",

    3) Fibonacci curve (golden spiral polyline; static)
    4) Double-helix lattice (two phase-shifted strands)

  Why: respects Cosmic Helix brief with calm palette, no motion, and offline-only dependencies.
*/

const FALLBACK_PALETTE = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"]
};

export function renderHelix(ctx, options) {
  const { width, height, NUM, fallbackNotice } = options;
  const palette = normalizePalette(options.palette);

  ctx.save();
  clearCanvas(ctx, width, height, palette.bg);

  drawVesicaField(ctx, { width, height }, palette, NUM);
  drawTreeOfLife(ctx, { width, height }, palette, NUM);
  drawFibonacciCurve(ctx, { width, height }, palette, NUM);
  drawHelixLattice(ctx, { width, height }, palette, NUM);

  if (fallbackNotice) {
    drawFallbackNotice(ctx, { width, height }, palette, fallbackNotice);
  }
  ctx.restore();
}

function normalizePalette(raw) {
  /* Why: guarantees ND-safe fallback even when palette data is missing or partial. */
  const candidate = raw || FALLBACK_PALETTE;
  const layers = Array.isArray(candidate.layers) && candidate.layers.length > 0
    ? candidate.layers
    : FALLBACK_PALETTE.layers;
  return {
    bg: candidate.bg || FALLBACK_PALETTE.bg,
    ink: candidate.ink || FALLBACK_PALETTE.ink,

    layers
  };
}


/**
 * Draws a vesica piscis (two intersecting circles) with concentric rings.
 *
 * Renders a horizontally offset pair of circles centered on dims.centerX/centerY,
 * then draws additional scaled rings around each circle to form a layered vesica field.
 * Uses translucent strokes and a fixed line width to produce a soft, ND-safe appearance.
 *
 * @param {{centerX:number,centerY:number,width:number,height:number}} dims - Canvas dimensions and center coordinates.
 * @param {string|CanvasGradient|CanvasPattern} color - Stroke color (CSS color string, gradient, or pattern).
 * @param {object} NUM - Numeric constants object; this function reads NUM.THREE, NUM.SEVEN, and NUM.ELEVEN to compute sizes and ring counts.
 */

function drawVesicaField(ctx, dims, color, NUM) {
  // ND-safe: translucent layers avoid harsh contrast while keeping geometry legible.
  const { centerX, centerY, width, height } = dims;
  const baseRadius = Math.min(width, height) / NUM.THREE;
  const offset = baseRadius / 2.2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;

  drawCircle(ctx, centerX - offset, centerY, baseRadius);
  drawCircle(ctx, centerX + offset, centerY, baseRadius);

  // Layer additional vesica rings using sacred numerology counts (7 + 11 offsets).
  const ringCount = NUM.SEVEN;
  for (let i = 1; i <= ringCount; i++) {
    const scale = 1 + i / NUM.ELEVEN;
    drawCircle(ctx, centerX - offset, centerY, baseRadius * scale);
    drawCircle(ctx, centerX + offset, centerY, baseRadius * scale);
  }

  ctx.restore();
}

/**
 * Draws a simplified Tree of Life scaffold: 10 softly glowing nodes connected by 22 translucent paths.
 *
 * Positions nodes using dims.width and dims.height with spacing derived from NUM constants. Paths are stroked
 * with colors[0] (or a default) at reduced alpha; nodes are filled circles with colors[1] (or a default) at higher alpha.
 *
 * @param {Object} dims - Layout measurements; the function requires dims.width and dims.height to compute node positions.
 * @param {string[]} colors - Palette for the layer. colors[0] is used for paths, colors[1] for node fills; defaults are used if entries are missing.
 * @param {Object} NUM - Numeric constants object used to scale padding, rows/columns, and node radius.
 */
function drawTreeOfLife(ctx, dims, colors, NUM) {
  // ND-safe: soft glow nodes, clean paths, referencing 10 spheres + 22 paths.
  const { width, height } = dims;
  const padding = height / NUM.NINETYNINE * NUM.ELEVEN;
  const column = width / NUM.ELEVEN;
  const row = (height - padding * 2) / NUM.NINE;
  const cx = width / 2;

  const nodes = [
    { id: 1, x: cx, y: padding },
    { id: 2, x: cx + column * 1.5, y: padding + row },
    { id: 3, x: cx - column * 1.5, y: padding + row },
    { id: 4, x: cx + column, y: padding + row * 2.5 },
    { id: 5, x: cx, y: padding + row * 3.5 },
    { id: 6, x: cx - column, y: padding + row * 2.5 },
    { id: 7, x: cx + column, y: padding + row * 5 },
    { id: 8, x: cx - column, y: padding + row * 5 },
    { id: 9, x: cx, y: padding + row * 6.2 },
    { id: 10, x: cx, y: padding + row * 8.1 }
  ];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const paths = [
    [1, 2], [1, 3], [2, 4], [3, 6], [4, 5], [6, 5], [4, 7], [6, 8],
    [7, 9], [8, 9], [9, 10], [2, 3], [2, 5], [3, 5], [4, 6], [7, 8],
    [5, 7], [5, 8], [2, 7], [3, 8], [4, 9], [6, 9]
  ];

  ctx.save();
  ctx.strokeStyle = colors[0] || "#89f7fe";
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.4;
  for (const [a, b] of paths) {
    const pa = nodeMap.get(a);
    const pb = nodeMap.get(b);
    if (!pa || !pb) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = colors[1] || "#a0ffa1";
  for (const node of nodes) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, height / NUM.ONEFORTYFOUR * NUM.THREE, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws a static Fibonacci/logarithmic-style curve as a single stroked polyline.
 *
 * Generates a sequence of points radiating from the canvas center using the golden
 * ratio (φ) to scale radii and a fixed angular step, then strokes them once with
 * a semi-transparent line to produce a calm, ND-safe spiral-like curve.
 *
 * @param {Object} dims - Drawing dimensions; must include numeric `centerX` and `height`.
 * @param {string|CanvasPattern|CanvasGradient} color - Stroke color used for the curve.
 * @param {Object} NUM - Numeric constants object. This function reads NUM.NINETYNINE, NUM.SEVEN, NUM.TWENTYTWO and NUM.ELEVEN to compute spacing, step count, and radial scaling.
 */
function drawFibonacciCurve(ctx, dims, color, NUM) {
  // ND-safe: single stroke polyline; no animated arcs.
  const { centerX, height } = dims;
  const phi = (1 + Math.sqrt(5)) / 2;
  const base = height / NUM.NINETYNINE * NUM.SEVEN;
  const steps = NUM.TWENTYTWO;

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (Math.PI / NUM.SEVEN) * i;
    const radius = base * Math.pow(phi, i / NUM.ELEVEN);
    const x = centerX + Math.cos(angle) * radius;
    const y = height * 0.65 - Math.sin(angle) * radius;

function pickLayerColor(palette, index) {
  /* Why: loops palette gracefully to keep harmonious layering. */
  return palette.layers[index % palette.layers.length];
}

function clearCanvas(ctx, width, height, color) {
  /* Why: establishes calm background before layering sacred geometry. */
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

function drawVesicaField(ctx, dims, palette, NUM) {
  /* Why: Vesica Piscis grid builds foundational harmony for the remaining layers. */
  const { width, height } = dims;
  const columnCount = NUM.ELEVEN;
  const rowCount = NUM.SEVEN; // seven vesica bands reinforce layered harmony
  const spacingX = width / (columnCount - 1);
  const spacingY = height / (rowCount + 2);
  const radius = Math.min(spacingX, spacingY) * (NUM.ELEVEN / NUM.TWENTYTWO);
  const color = pickLayerColor(palette, 0);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = radius / NUM.ELEVEN;
  ctx.globalAlpha = 0.28;

  for (let row = 0; row < rowCount; row += 1) {
    const offset = (row % 2 === 0) ? 0 : spacingX / 2;
    const cy = spacingY * (row + 1.5);
    for (let col = 0; col < columnCount; col += 1) {
      const cx = col * spacingX + offset;
      if (cx < -radius || cx > width + radius) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTreeOfLife(ctx, dims, palette, NUM) {
  /* Why: Tree-of-Life anchors narrative structure with balanced vertical rhythm. */
  const { width, height } = dims;
  const marginTop = height / NUM.NINE;
  const columnOffset = width / NUM.THREE;
  const centerX = width / 2;

  const nodes = [
    { x: centerX, y: marginTop * 0.5 },
    { x: centerX + columnOffset / 2, y: marginTop * 1.6 },
    { x: centerX - columnOffset / 2, y: marginTop * 1.6 },
    { x: centerX + columnOffset / 2, y: marginTop * 3 },
    { x: centerX - columnOffset / 2, y: marginTop * 3 },
    { x: centerX, y: marginTop * 4.2 },
    { x: centerX + columnOffset / 2, y: marginTop * 5.6 },
    { x: centerX - columnOffset / 2, y: marginTop * 5.6 },
    { x: centerX, y: marginTop * 7 },
    { x: centerX, y: marginTop * 8.4 }
  ];

  const paths = [
    [0, 1], [0, 2], [1, 2],
    [1, 3], [2, 4], [3, 4],
    [3, 5], [4, 5], [3, 6],
    [4, 7], [5, 6], [5, 7],
    [6, 7], [6, 8], [7, 8],
    [5, 8], [8, 9], [0, 5],
    [1, 5], [2, 5], [3, 8],
    [4, 8]
  ];

  if (paths.length !== NUM.TWENTYTWO) {
    throw new Error("Tree-of-Life path count must match 22 letters");
  }

  const pathColor = pickLayerColor(palette, 1);
  const nodeColor = pickLayerColor(palette, 2);

  ctx.save();
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = width / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (const [fromIndex, toIndex] of paths) {
    const from = nodes[fromIndex];
    const to = nodes[toIndex];
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = nodeColor;
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = width / NUM.NINETYNINE;
  const radius = width / NUM.ONEFORTYFOUR * NUM.THREE / NUM.ELEVEN;
  for (const node of nodes) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawFibonacciCurve(ctx, dims, palette, NUM) {
  /* Why: Fibonacci spiral guides growth without animation, respecting ND-safe calm focus. */
  const { width, height } = dims;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const fibCount = NUM.NINE;
  const fib = fibonacciSequence(fibCount);
  const baseScale = Math.min(width, height) / NUM.ONEFORTYFOUR * NUM.THIRTYTHREE / fib[fib.length - 1];
  const center = {
    x: width / NUM.THREE,
    y: height - height / NUM.NINE
  };
  const steps = NUM.TWENTYTWO;
  const startTheta = Math.PI / NUM.THREE;
  const endTheta = startTheta + Math.PI * NUM.THREE;
  const growth = Math.log(goldenRatio) / (Math.PI / 2);
  const color = pickLayerColor(palette, 3);

  const points = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const theta = startTheta + (endTheta - startTheta) * t;
    const radius = baseScale * Math.exp(growth * theta);
    const x = center.x + Math.cos(theta) * radius;
    const y = center.y + Math.sin(theta) * radius;

    points.push({ x, y });
  }

  ctx.save();
  ctx.strokeStyle = color;

  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);

  ctx.lineWidth = width / NUM.NINETYNINE;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }

  }
  ctx.stroke();
  ctx.restore();
}


/**
 * Draws a static double-helix lattice (two strands with cross rungs) onto the provided canvas context.
 *
 * Renders two phase-shifted sine-wave strands across the canvas width and connects sampled corresponding points
 * with short "rungs" to suggest a double-helix lattice. Uses semi-transparent strokes and sensible defaults
 * when strand colors are missing.
 *
 * @param {Object} dims - Layout metrics: { width: number, height: number, centerX?: number, centerY?: number }.
 * @param {string[]} colors - Array supplying strand colors: [strandAColor, strandBColor]. Defaults used if entries are falsy.
 * @param {Object} NUM - Numeric constants object used for proportions and segment counts (expects properties such as NINE, ONEFORTYFOUR, THIRTYTHREE, TWENTYTWO).
 */

function drawHelixLattice(ctx, dims, colors, NUM) {
  // ND-safe: static lattice referencing double helix archetype without motion.
  const { width, height } = dims;
  const strandColorA = colors[0] || "#f5a3ff";
  const strandColorB = colors[1] || "#d0d0e6";
  const amplitude = height / NUM.NINE;
  const baseline = height * 0.75;
  const segments = NUM.ONEFORTYFOUR;
  const spacing = width / segments;

  const strandA = collectHelixPoints(0);
  const strandB = collectHelixPoints(Math.PI);
  const rungs = buildHelixRungs(strandA, strandB, NUM);

  ctx.save();
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = strandColorA;
  drawPolyline(ctx, strandA);
  ctx.strokeStyle = strandColorB;
  drawPolyline(ctx, strandB);

  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = strandColorB;
  for (const [a, b] of rungs) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();

  function collectHelixPoints(phase) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * NUM.TWENTYTWO + phase;
      const x = spacing * i;
      const y = baseline - Math.sin(angle) * amplitude;
      points.push({ x, y });
    }
    return points;
  }

  function buildHelixRungs(aPoints, bPoints, NUM_CONST) {
    const pairs = [];
    const step = Math.floor(segments / NUM_CONST.THIRTYTHREE) || 1;
    for (let i = 0; i < aPoints.length && i < bPoints.length; i += step) {
      pairs.push([aPoints[i], bPoints[i]]);
    }
    return pairs;
  }
}

/**
 * Stroke a circular outline at the given canvas coordinates.
 *
 * Uses the canvas context's current path and stroke style to render a circle.
 *
 * @param {number} x - Center x position in canvas pixels.
 * @param {number} y - Center y position in canvas pixels.
 * @param {number} radius - Circle radius in pixels.
 */
function drawCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Stroke a polyline through an ordered list of points on the given canvas context.
 *
 * @param {Array<{x:number,y:number}>} points - Ordered array of point objects defining the polyline vertices; the first point is the moveTo origin and subsequent points are connected with lines.
 */
function drawPolyline(ctx, points) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

function fibonacciSequence(count) {
  const seq = [1, 1];
  while (seq.length < count) {
    const next = seq[seq.length - 1] + seq[seq.length - 2];
    seq.push(next);
  }
  return seq;
}

function drawHelixLattice(ctx, dims, palette, NUM) {
  /* Why: double helix gives layered depth using two static strands and gentle crossbars. */
  const { width, height } = dims;
  const margin = height / NUM.NINE;
  const strandHeight = height - margin * 2;
  const amplitude = width / NUM.SEVEN;
  const segments = NUM.TWENTYTWO;
  const strandColorA = pickLayerColor(palette, 4);
  const strandColorB = pickLayerColor(palette, 5);

  const leftPoints = [];
  const rightPoints = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const theta = Math.PI * NUM.THREE * t;
    const y = margin + strandHeight * (1 - t);
    const phase = Math.sin(theta);
    const xLeft = width / 2 - amplitude / 2 + phase * amplitude / NUM.THREE;
    const xRight = width / 2 + amplitude / 2 + Math.sin(theta + Math.PI) * amplitude / NUM.THREE;
    leftPoints.push({ x: xLeft, y });
    rightPoints.push({ x: xRight, y });
  }

  ctx.save();
  ctx.lineWidth = width / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = strandColorA;
  strokePolyline(ctx, leftPoints);
  ctx.strokeStyle = strandColorB;
  strokePolyline(ctx, rightPoints);

  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = palette.ink;
  const crossbarInterval = Math.max(1, Math.round(segments / NUM.ELEVEN));
  for (let i = 0; i <= segments; i += crossbarInterval) {
    const left = leftPoints[i];
    const right = rightPoints[i];
    if (!left || !right) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }
  ctx.restore();
}

function strokePolyline(ctx, points) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.stroke();
}

function drawFallbackNotice(ctx, dims, palette, message) {
  /* Why: inline notice affirms safe fallback without relying on DOM overlays. */
  const { width } = dims;
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = palette.ink;
  ctx.font = "14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(message, width - 24, 32);
  ctx.restore();

}
