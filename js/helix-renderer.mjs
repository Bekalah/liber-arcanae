/**
 * Render a static, multi-layer sacred-geometry composition onto a 2D canvas.
 *
 * Renders four stacked layers (vesica field, Tree of Life scaffold, Fibonacci curve,
 * and double-helix lattice) and an optional notice text. If either `ctx` or `options`
 * is missing/falsy the function returns without drawing.
 *
 * @param {Object} options - Rendering options.
 *   Supported properties:
 *     - width {number}?: canvas width in pixels (falls back to safe default).
 *     - height {number}?: canvas height in pixels (falls back to safe default).
 *     - palette {Object}?: color palette (partial palettes are completed by ensurePalette).
 *     - numerology {Object}?: numeric constants that influence layout and scale.
 *     - notice {string}?: optional single-line message to draw at the stage bottom-left.
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
 * Normalize and complete a color palette object, applying sensible defaults.
 *
 * If `palette` is omitted or missing properties, this returns a palette with
 * a background color (`bg`), ink color (`ink`), and exactly six layer colors
 * (`layers`). If `palette.layers` is provided it will be truncated to six
 * entries; if it contains fewer than six entries the remaining slots are
 * filled from built-in fallback colors.
 *
 * @param {Object|undefined|null} palette - Optional source palette. Expected shape: `{ bg?: string, ink?: string, layers?: string[] }`.
 * @return {{bg: string, ink: string, layers: string[]}} A palette object with `bg`, `ink`, and an array of six hex color strings.
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
 * Compute a drawing stage with safe dimensions, center, margin, and inner drawable area.
 *
 * Width and height default to 1440x900 when non-numeric. The margin is computed from the
 * provided `numerology` constants (ONEFORTYFOUR and NINE) when available, otherwise a
 * sensible default is used; innerWidth/innerHeight are the stage size minus twice the margin.
 *
 * @param {number} [width] - Desired stage width; non-numeric values fall back to 1440.
 * @param {number} [height] - Desired stage height; non-numeric values fall back to 900.
 * @param {object} [numerology] - Optional numerology object used to compute margin. If provided it should expose numeric properties `ONEFORTYFOUR` and `NINE`.
 * @return {{width: number, height: number, centerX: number, centerY: number, margin: number, innerWidth: number, innerHeight: number}} Stage descriptor with computed layout metrics.
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
 * Fill the entire stage area of the canvas with the specified color.
 *
 * Preserves and restores the canvas drawing state around the fill.
 *
 * @param {string} color - CSS color string to use for the fill (e.g., "#rrggbb", "#rgb", "rgba(...)").
 * @param {{width: number, height: number}} stage - Object with numeric `width` and `height` describing the stage size.
 */
function fillBackground(ctx, color, stage) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, stage.width, stage.height);
  ctx.restore();
}

/**
 * Render a translucent vesica (overlapping circles) field with concentric rings and vertical grid lines.
 *
 * Draws two stroked circles offset horizontally around the stage center, fills their overlapping vesica region
 * with a translucent glow, renders concentric rings centered on the stage, and draws evenly spaced vertical
 * guide lines across the vesica area. Opacity, line widths, and repetition counts are scaled by the optional
 * numerology values when provided.
 *
 * @param {Object} stage - Computed stage metrics (expects centerX, centerY, innerWidth, innerHeight).
 * @param {Object} colors - Color roles used by this layer. Required keys: `outline`, `glow`, `grid`, `ink`.
 * @param {Object} [numerology] - Optional numerology constants to scale geometry. Expected numeric properties:
 *   `THREE` (used for base divisor), `SEVEN` (used to compute horizontal offset), `NINE` (ring count),
 *   and `ELEVEN` (vertical line count). If omitted, small integer defaults are used.
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
 * Draw the Tree of Life layer: render connection paths between sephirot then draw the sephirot discs.
 *
 * Computes node positions via computeTreeNodes(stage, numerology) and connection pairs via computeTreeConnections().
 * Connection lines are stroked first (so discs remain on top) using `colors.paths` with reduced opacity.
 * Then each node is drawn as a filled circle using `colors.nodesFill` and outlined with `colors.nodesStroke`.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context to draw onto.
 * @param {Object} stage - Layout metrics (width, height, center, margin, innerWidth, innerHeight) used for node placement.
 * @param {Object} colors - Color configuration object. Required properties: `paths`, `nodesFill`, `nodesStroke`.
 * @param {Object} [numerology] - Optional numerology values that influence node placement and sizing; passed to computeTreeNodes.
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
 * Compute positions and radii for the 10 nodes used by the Tree-of-Life layout.
 *
 * Produces a deterministic 10-element array of node descriptors ({x, y, radius})
 * arranged across seven vertical levels centered in the provided stage. When a
 * numerology object is supplied, its numeric constants (SEVEN, THREE, ELEVEN,
 * NINETYNINE) are used to scale columns, offsets, and radii; otherwise sensible
 * default integers are used.
 *
 * @param {object} stage - Stage geometry containing at minimum: centerX, centerY, innerWidth, innerHeight.
 * @param {object} [numerology] - Optional numerology constants to override layout divisors (e.g., SEVEN, THREE, ELEVEN, NINETYNINE).
 * @return {Array<{x:number,y:number,radius:number}>} Ten node objects with canvas coordinates (x,y) and computed radius.
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
 * Return the fixed set of edges (pairs of node indices) that define the Tree-of-Life connections.
 *
 * The returned array contains 2-element arrays [a, b], where each number is an index into the
 * node list produced by computeTreeNodes(). Intended for use by drawTreeOfLife() to render
 * the connection paths between the computed nodes.
 *
 * @return {number[][]} Array of index pairs representing edges between nodes (nodes are indexed 0–9).
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
 * Draws a Fibonacci-inspired spiral polyline centered on the stage.
 *
 * Generates a sequence of points whose radii grow roughly by powers of the golden ratio (phi)
 * and strokes them as a connected polyline. The base step and number of turns can be
 * overridden via the numerology object; otherwise safe defaults are used.
 *
 * @param {Object} stage - Stage metrics produced by createStage (must include centerX, centerY, innerWidth, innerHeight).
 * @param {string} color - Stroke color (any CSS color string).
 * @param {Object} [numerology] - Optional numeric overrides (e.g., THREE, THIRTYTHREE, ELEVEN) to scale radius and turns.
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
 * Draws a double‑helix lattice composed of two interleaving strands and horizontal rungs.
 *
 * Generates two sinusoidal paths (pathA and pathB) running vertically across the stage,
 * strokes them with the provided primary and secondary colors, and then draws connecting
 * "rungs" between corresponding points along the strands using the rungs color. Geometry
 * (coil count, segment resolution, amplitudes) can be tweaked via the optional numerology
 * object; reasonable defaults are used when numerology is not provided.
 *
 * @param {Object} stage - Stage metrics as produced by createStage. Used properties: centerX, centerY, innerWidth, innerHeight.
 * @param {Object} colors - Color configuration with keys: primary (strand A), secondary (strand B), rungs (cross links).
 * @param {Object} [numerology] - Optional numeric constants to control geometry. Recognized keys: THREE (coils), NINETYNINE (segments), TWENTYTWO (amplitude/rung density).
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
 * Draw a small footer notice on the canvas near the bottom-left of the stage.
 *
 * Renders `message` using `ink` (hex string converted to RGBA with 0.7 alpha) at a compact system font,
 * positioned inside the stage margins above the bottom edge.
 *
 * @param {Object} stage - Stage metadata (expects at least `margin` and `height` numeric properties).
 * @param {string} message - Text to render.
 * @param {string} ink - Hex color string used for the text (supports 3- or 6-digit hex); converted to rgba with 0.7 alpha.
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
 * Stroke a full circular path at the given center and radius.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context used to draw the circle.
 * @param {{x: number, y: number}} center - Center point of the circle.
 * @param {number} radius - Radius of the circle in canvas units.
 */
function strokeCircle(ctx, center, radius) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Stroke a polyline through a sequence of points on the provided 2D canvas context.
 *
 * Does nothing if fewer than two points are provided. The polyline is drawn using
 * the context's current stroke style and line settings; the path is not closed.
 *
 * @param {Array<{x:number,y:number}>} points - Ordered array of points to connect.
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
 * Convert a hex color string to an `rgba(...)` CSS string.
 *
 * Supports 3-digit (e.g. `#abc`) and 6-digit (e.g. `#aabbcc`) hex formats. If `hex` is falsy,
 * returns a default light gray `rgba(232, 232, 240, alpha)`. The `alpha` parameter is clamped
 * to the [0, 1] range; if omitted, alpha defaults to 1.
 *
 * @param {string|null|undefined} hex - Hex color string, with or without a leading `#`.
 * @param {number} [alpha=1] - Opacity value; will be clamped to the range 0–1.
 * @return {string} A CSS `rgba(r, g, b, a)` string.
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
