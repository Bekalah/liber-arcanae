/**
 * Render a static, multi-layer sacred-geometry composition onto a Canvas 2D context.
 *
 * Renders a deterministic, non-animated scene composed of: a Vesica field, a Tree of Life scaffold,
 * a Fibonacci curve, and a double-helix lattice, then optionally draws a notice. Performs input
 * validation and returns early if the canvas context or options are falsy. All drawing is applied
 * directly to the provided context.
 *
 * @param {Object} options - Rendering configuration. Recognized properties:
 *   - width {number}: canvas width in pixels (optional; defaults applied when missing).
 *   - height {number}: canvas height in pixels (optional; defaults applied when missing).
 *   - numerology {Object}: numeric scale constants that tune layout (optional).
 *   - palette {Object|string}: color palette or key to derive background, ink, and six layer colors (optional).
 *   - notice {string}: optional text to render in the lower-left area.
 */

export function renderHelix(ctx, options) {
  if (!ctx || !options) return;
  const stage = createStage(options.width, options.height, options.numerology);
  const palette = ensurePalette(options.palette);
  fillBackground(ctx, palette.bg, stage);

  // Layer 1: Vesica field as calm foundation for the cosmology.
  drawVesicaField(ctx, stage, {
    outline: palette.layers[0],
    glow: palette.layers[1],
    grid: palette.layers[5],
    ink: palette.ink
  }, options.numerology);

  // Layer 2: Tree-of-Life scaffold anchors paths without animation.
  drawTreeOfLife(ctx, stage, {
    paths: palette.layers[2],
    nodesFill: palette.layers[3],
    nodesStroke: palette.ink
  }, options.numerology);

  // Layer 3: Fibonacci curve traces growth with static polyline.
  drawFibonacciCurve(ctx, stage, palette.layers[4], options.numerology);

  // Layer 4: Double helix lattice interlocks both strands with steady rhythm.
  drawDoubleHelixLattice(ctx, stage, {
    primary: palette.layers[4],
    secondary: palette.layers[5],
    rungs: palette.ink
  }, options.numerology);

  if (options.notice) {
    drawNotice(ctx, stage, options.notice, palette.ink);
  }
}

/**
 * Normalize a color palette, supplying sensible defaults and ensuring six layer colors.
 *
 * If a partial palette is provided, missing entries are filled from built-in defaults.
 *
 * @param {Object} [palette] - Optional palette overrides.
 * @param {string} [palette.bg] - Background color hex string; defaults to "#0b0b12".
 * @param {string} [palette.ink] - Foreground/ink color hex string; defaults to "#e8e8f0".
 * @param {string[]} [palette.layers] - Array of layer color hex strings. Up to six entries are used;
 *   if fewer than six are provided the array is padded with defaults. If not an array, defaults are used.
 * @return {{bg: string, ink: string, layers: string[]}} Normalized palette containing `bg`, `ink`, and an array
 *   of exactly six layer color hex strings.
 */
function ensurePalette(palette) {
  const fallback = {
    bg: "#0b0b12",
    ink: "#e8e8f0",
    layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"]
  };
  const source = palette || fallback;
  const layers = Array.isArray(source.layers) ? source.layers.slice(0, 6) : fallback.layers;
  while (layers.length < 6) layers.push(fallback.layers[layers.length]);
  return { bg: source.bg || fallback.bg, ink: source.ink || fallback.ink, layers };
}

/**
 * Compute a safe drawing stage object (dimensions, center, margin, inner size).
 *
 * If width or height are not numbers, defaults to 1440x900. The margin is derived
 * as min(width, height) / (numerology.ONEFORTYFOUR / numerology.NINE) when a
 * numerology object is provided; otherwise a fixed base of 16 is used. The
 * returned innerWidth/innerHeight are the drawable area inside the margins.
 *
 * @param {number} width - Desired canvas width; non-number falls back to 1440.
 * @param {number} height - Desired canvas height; non-number falls back to 900.
 * @param {Object} [numerology] - Optional numerology constants object (expects ONEFORTYFOUR and NINE) used to scale the margin.
 * @return {{width: number, height: number, centerX: number, centerY: number, margin: number, innerWidth: number, innerHeight: number}} Stage metrics for rendering.
 */
function createStage(width, height, numerology) {
  const safeWidth = typeof width === "number" ? width : 1440;
  const safeHeight = typeof height === "number" ? height : 900;
  const marginBase = numerology ? numerology.ONEFORTYFOUR / numerology.NINE : 16;
  const margin = Math.min(safeWidth, safeHeight) / marginBase;
  const innerWidth = safeWidth - margin * 2;
  const innerHeight = safeHeight - margin * 2;
  return {
    width: safeWidth,
    height: safeHeight,
    centerX: safeWidth / 2,
    centerY: safeHeight / 2,
    margin,
    innerWidth,
    innerHeight
  };
}

/**
 * Fill the entire drawing stage with a solid color.
 *
 * Paints a rectangular background covering the full stage dimensions.
 *
 * @param {string} color - CSS color string used to fill the background (e.g., '#ffffff' or 'rgba(0,0,0,0.5)').
 * @param {{width: number, height: number}} stage - Stage geometry; only `width` and `height` are used to size the fill.
 */
function fillBackground(ctx, color, stage) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, stage.width, stage.height);
  ctx.restore();
}

/**
 * Render a translucent Vesica field centered on the stage: two overlapping circles with a soft glow,
 * concentric grid rings, and vertical guide lines.
 *
 * Draws directly to the provided canvas context (no return value). The visual elements are rendered
 * semi-transparently to maintain a calm, layered appearance.
 *
 * @param {Object} stage - Layout geometry for the drawing. Must include numeric centerX, centerY,
 *   innerWidth, and innerHeight (used to size and position the Vesica and its grid).
 * @param {Object} colors - Color roles used for the field:
 *   - outline: stroke color for the two circle outlines
 *   - glow: fill color for the overlapping Vesica glow
 *   - grid: stroke color for the concentric rings
 *   - ink: stroke color for the vertical guide lines
 * @param {Object} [numerology] - Optional numeric scale overrides (e.g., THREE, SEVEN, NINE, ELEVEN).
 *   When provided, these values scale radii, offsets, and counts; otherwise sensible defaults are used.
 */
function drawVesicaField(ctx, stage, colors, numerology) {
  const radius = Math.min(stage.innerWidth, stage.innerHeight) / (numerology ? numerology.THREE : 3);
  const offset = radius / (numerology ? numerology.SEVEN : 7);
  const left = { x: stage.centerX - offset * (numerology ? numerology.THREE : 3), y: stage.centerY };
  const right = { x: stage.centerX + offset * (numerology ? numerology.THREE : 3), y: stage.centerY };

  // Vesica lines stay translucent to avoid visual overload.
  ctx.save();
  ctx.lineWidth = (numerology ? numerology.THREE : 3) / 2;
  ctx.strokeStyle = colors.outline;
  strokeCircle(ctx, left, radius);
  strokeCircle(ctx, right, radius);

  ctx.globalAlpha = 0.25;
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(left.x, left.y, radius, -Math.PI / 2, Math.PI / 2, false);
  ctx.arc(right.x, right.y, radius, Math.PI / 2, -Math.PI / 2, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.grid;
  ctx.globalAlpha = 0.2;
  const rings = numerology ? numerology.NINE : 9;
  for (let i = 1; i <= rings; i++) {
    const r = (radius / rings) * i;
    ctx.beginPath();
    ctx.arc(stage.centerX, stage.centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  const lines = numerology ? numerology.ELEVEN : 11;
  for (let i = -lines; i <= lines; i++) {
    const ratio = i / lines;
    const x = stage.centerX + ratio * radius;
    ctx.beginPath();
    ctx.moveTo(x, stage.centerY - radius);
    ctx.lineTo(x, stage.centerY + radius);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Render the Tree of Life: draw connecting paths between sephirot and render filled node discs.
 *
 * Connections (paths) are drawn first with a semi-transparent stroke, then nodes are drawn as
 * filled circles with stroked outlines so the sephirot remain visually prominent.
 *
 * @param {Object} stage - Layout metrics for drawing (expects properties like width, height, centerX, centerY, margin, innerWidth, innerHeight).
 * @param {Object} colors - Color roles for rendering. Required keys:
 *                          `paths` (stroke color for connections),
 *                          `nodesFill` (fill color for node discs),
 *                          `nodesStroke` (stroke color for node outlines).
 * @param {Object} [numerology] - Optional scaling constants that influence node positions and radii; defaults are used when omitted.
 */
function drawTreeOfLife(ctx, stage, colors, numerology) {
  const nodes = computeTreeNodes(stage, numerology);
  const connections = computeTreeConnections();

  // Paths first, so the sephirot discs stay legible.
  ctx.save();
  ctx.strokeStyle = colors.paths;
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.65;
  connections.forEach(([a, b]) => {
    const start = nodes[a];
    const end = nodes[b];
    if (!start || !end) return;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = colors.nodesFill;
  ctx.strokeStyle = colors.nodesStroke;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.9;
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Compute positions and radii for the ten nodes of a Tree of Life layout within a drawing stage.
 *
 * Uses the stage geometry to place nodes across vertical levels and five horizontal columns
 * (center, left, right, extreme left, extreme right). If a numerology object is provided,
 * its numeric constants are used to scale spacing and radii; otherwise sensible defaults are used.
 *
 * @param {{centerX:number, centerY:number, innerWidth:number, innerHeight:number}} stage - Layout metrics of the drawing area.
 * @param {Object} [numerology] - Optional numeric constants (e.g., SEVEN, THREE, ELEVEN, NINETYNINE) to modify spacing and sizing.
 * @return {Array<{x:number,y:number,radius:number}>} Array of 10 node descriptors in drawing order; each object contains x, y, and radius.
 */
function computeTreeNodes(stage, numerology) {
  const steps = numerology ? numerology.SEVEN : 7;
  const startY = stage.centerY - stage.innerHeight / 2;
  const stepY = stage.innerHeight / steps;
  const column = stage.innerWidth / (numerology ? numerology.THREE : 3);
  const farOffset = column * (numerology ? numerology.THREE : 3) / (numerology ? numerology.ELEVEN : 11);
  const left = stage.centerX - column / 2;
  const right = stage.centerX + column / 2;
  const extremeLeft = stage.centerX - column - farOffset;
  const extremeRight = stage.centerX + column + farOffset;
  const radius = Math.min(stage.innerWidth, stage.innerHeight) / (numerology ? numerology.NINETYNINE : 99) * (numerology ? numerology.THREE : 3);
  const levelY = (level) => startY + stepY * level + stepY / 2;
  return [
    { x: stage.centerX, y: levelY(0), radius },
    { x: extremeRight, y: levelY(1), radius },
    { x: extremeLeft, y: levelY(1), radius },
    { x: right, y: levelY(2), radius },
    { x: left, y: levelY(2), radius },
    { x: stage.centerX, y: levelY(3), radius },
    { x: right, y: levelY(4), radius },
    { x: left, y: levelY(4), radius },
    { x: stage.centerX, y: levelY(5), radius },
    { x: stage.centerX, y: levelY(6), radius }
  ];
}

/**
 * Return the fixed list of node index pairs that define the Tree of Life connections.
 *
 * The function supplies a deterministic array of ordered index pairs referencing
 * nodes (typically the 10 nodes produced by `computeTreeNodes`). Each pair [a, b]
 * represents an edge between node a and node b in the Tree of Life graph.
 *
 * @return {number[][]} Array of two-element number arrays where each sub-array is a node index pair [from, to].
 */
function computeTreeConnections() {
  return [
    [0, 1], [0, 2], [1, 2],
    [1, 3], [2, 4], [1, 5], [2, 5],
    [3, 4], [3, 5], [4, 5],
    [3, 6], [4, 7], [5, 6], [5, 7],
    [6, 7], [6, 8], [7, 8], [5, 8],
    [8, 9], [6, 9], [7, 9], [5, 9]
  ];
}

/**
 * Draws a static Fibonacci-based spiral polyline centered in the given stage.
 *
 * The function computes a sequence of points radiating from the stage center using
 * the golden ratio (phi) to scale successive radii, then strokes a single polyline
 * connecting those points. Rendering uses a fixed line width and partial alpha.
 *
 * @param {Object} stage - Layout object providing drawing geometry. Expected fields: centerX, centerY, innerWidth, innerHeight.
 * @param {string} color - Stroke color used for the curve (any canvas-accepted color string).
 * @param {Object} [numerology] - Optional numeric overrides that alter scaling and counts. Recognized keys: THIRTYTHREE (base divisor), THREE (exponent divisor), ELEVEN (number of turns).
 */
function drawFibonacciCurve(ctx, stage, color, numerology) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const base = Math.min(stage.innerWidth, stage.innerHeight) / (numerology ? numerology.THIRTYTHREE : 33);
  const points = [];
  const turns = numerology ? numerology.ELEVEN : 11;
  for (let i = 0; i <= turns; i++) {
    const angle = (Math.PI / 2) * i;
    const radius = base * Math.pow(phi, i / (numerology ? numerology.THREE : 3));
    const x = stage.centerX + radius * Math.cos(angle);
    const y = stage.centerY + radius * Math.sin(angle);
    points.push({ x, y });
  }
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  strokePolyline(ctx, points);
  ctx.restore();
}

/**
 * Render a static double-helix lattice: two interleaving sinusoidal strands with horizontal rungs.
 *
 * Draws two sampled strand paths centered in the stage and then strokes horizontal rung lines
 * connecting corresponding samples. Visual parameters (coil count, segment density, amplitude,
 * and rung count) are derived from the optional `numerology` object with sensible defaults.
 *
 * Side effects: paints directly to the provided canvas 2D context.
 *
 * @param {object} stage - Layout geometry for drawing. Expected to include numeric properties: `centerX`, `centerY`, `innerWidth`, and `innerHeight`.
 * @param {object} colors - Color set used for rendering. Expected keys: `primary` (strand A), `secondary` (strand B), and `rungs` (connecting lines).
 * @param {object} [numerology] - Optional numeric overrides: `THREE` (coils), `NINETYNINE` (segments), and `TWENTYTWO` (amplitude/rung count). If omitted, defaults are used.
 */
function drawDoubleHelixLattice(ctx, stage, colors, numerology) {
  const coils = numerology ? numerology.THREE : 3;
  const segments = numerology ? numerology.NINETYNINE : 99;
  const height = stage.innerHeight * 0.8;
  const top = stage.centerY - height / 2;
  const amplitude = stage.innerWidth / (numerology ? numerology.TWENTYTWO : 22);
  const freq = coils * Math.PI * 2;
  const pathA = [];
  const pathB = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = top + height * t;
    const angle = freq * t;
    const offset = Math.sin(angle) * amplitude;
    pathA.push({ x: stage.centerX - offset, y });
    pathB.push({ x: stage.centerX + offset, y });
  }

  ctx.save();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = colors.primary;
  ctx.globalAlpha = 0.6;
  strokePolyline(ctx, pathA);
  ctx.strokeStyle = colors.secondary;
  strokePolyline(ctx, pathB);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = colors.rungs;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  const rungCount = numerology ? numerology.TWENTYTWO : 22;
  for (let i = 0; i <= rungCount; i++) {
    const t = i / rungCount;
    const index = Math.round(t * segments);
    const a = pathA[index];
    const b = pathB[index];
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw a small informational notice inside the stage using the given ink color.
 *
 * Renders `message` near the bottom-left inside the stage margins with a semi-transparent
 * version of `ink`. Does not modify canvas state outside the usual save/restore.
 *
 * @param {Object} stage - Layout object containing at least `margin` and `height` used to position the text.
 * @param {string} message - Text to render.
 * @param {string} ink - Hex color string used as the base color for the text (converted to RGBA with 0.7 alpha).
 */
function drawNotice(ctx, stage, message, ink) {
  ctx.save();
  ctx.fillStyle = hexToRgba(ink, 0.7);
  ctx.font = "12px/18px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(message, stage.margin, stage.height - stage.margin / 2);
  ctx.restore();
}

/**
 * Stroke a circular outline on the provided canvas context.
 *
 * Draws an arc covering the full 360° at the specified center and radius, using the context's current stroke style and line width.
 *
 * @param {{x: number, y: number}} center - Center coordinates of the circle.
 * @param {number} radius - Radius of the circle in pixels.
 */
function strokeCircle(ctx, center, radius) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Stroke a polyline through an ordered array of points on the given canvas context.
 *
 * Draws straight line segments connecting each consecutive point in `points`.
 * No action is taken if `points` is falsy or contains fewer than two points.
 *
 * @param {Array<{x:number,y:number}>} points - Ordered list of coordinates to connect; each item must have numeric `x` and `y` properties.
 */
function strokePolyline(ctx, points) {
  if (!points || points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

/**
 * Convert a 3- or 6-digit hex color string to an `rgba(r, g, b, a)` string, with alpha clamped to [0, 1].
 *
 * If `hex` is falsy or cannot be parsed, returns a default gray `rgba(232, 232, 240, a)` where `a` is the resolved alpha.
 *
 * @param {string} hex - Hex color (with or without leading `#`), supports `RGB` or `RRGGBB` formats.
 * @param {number} [alpha=1] - Opacity; non-numeric or omitted defaults to 1. Numeric values are clamped to the [0, 1] range.
 * @return {string} An `rgba(r, g, b, a)` string suitable for canvas or CSS. 
 */
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(232, 232, 240, ${alpha || 1})`;
  const value = hex.replace("#", "");
  const parts = value.length === 3
    ? value.split("").map((c) => parseInt(c + c, 16))
    : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((c) => parseInt(c, 16));
  const [r, g, b] = parts.length === 3 ? parts : [232, 232, 240];
  const a = typeof alpha === "number" ? Math.max(0, Math.min(1, alpha)) : 1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
