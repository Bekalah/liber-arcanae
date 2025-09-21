/**
 * Render a static, non-animated layered sacred-geometry composition onto a canvas.
 *
 * Orchestrates the full render pipeline: validates inputs, builds normalized
 * settings from `config`, saves the canvas state, and draws the background,
 * vesica-field, Tree-of-Life scaffold, Fibonacci spiral, and double-helix
 * lattice in that order. If `settings.notice` is present, it is drawn last.
 * Restores the canvas state before returning.
 *
 * Note: The function performs an early return if `ctx` or `config` are falsy.
 *
 * @param {CanvasRenderingContext2D} ctx - 2D canvas rendering context to draw into.
 * @param {Object} config - Rendering configuration (see `createSettings` for expected keys:
 *                          width, height, palette, NUM constants, and optional `notice`).
 */

export function renderHelix(ctx, config) {
  if (!ctx || !config) {
    return;
  }

  const settings = createSettings(config);
  const bounds = { width:settings.width, height:settings.height };

  ctx.save();
  drawBackground(ctx, bounds, settings);
  drawVesicaField(ctx, bounds, settings);
  drawTreeOfLife(ctx, bounds, settings);
  drawFibonacciCurve(ctx, bounds, settings);
  drawDoubleHelix(ctx, bounds, settings);
  if (settings.notice) {
    drawNotice(ctx, bounds, settings);
  }
  ctx.restore();
}

/**
 * Normalize and fill default rendering configuration used by the renderer.
 *
 * Coerces width and height to Numbers (falling back to 1440x900), supplies a default
 * color palette and numeric constants set when not provided, and ensures a notice string.
 *
 * @param {Object} config - Partial configuration object; properties may be missing.
 * @param {number} [config.width] - Desired canvas width (coerced with Number()).
 * @param {number} [config.height] - Desired canvas height (coerced with Number()).
 * @param {Object} [config.palette] - Palette object with `bg`, `ink`, and `layers` array; a sensible default is used if omitted.
 * @param {Object} [config.NUM] - Named numeric constants (e.g., THREE, SEVEN, NINE, etc.); a default set is used if omitted.
 * @param {string} [config.notice] - Optional notice text to render; defaults to an empty string.
 * @return {{width: number, height: number, palette: {bg: string, ink: string, layers: string[]}, NUM: Object, notice: string}} Normalized settings object ready for rendering.
 */
function createSettings(config) {
  const width = Number(config.width) || 1440;
  const height = Number(config.height) || 900;
  const palette = config.palette || {
    bg:"#0a1419",
    ink:"#f2f7f7",
    layers:["#4ab6b6","#7bd389","#f2d184","#d1b3ff","#f8c0c8","#9fd0ff"]
  };
  const NUM = config.NUM || {
    THREE:3,
    SEVEN:7,
    NINE:9,
    ELEVEN:11,
    TWENTYTWO:22,
    THIRTYTHREE:33,
    NINETYNINE:99,
    ONEFORTYFOUR:144
  };
  return {
    width,
    height,
    palette,
    NUM,
    notice:config.notice || ""
  };
}

/**
 * Paints the canvas background and overlays a subtle, deterministic radial gradient.
 *
 * The function fills the full bounds with `settings.palette.bg` and then draws a
 * non-animated radial gradient (centered relative to the bounds) that fades from
 * `settings.palette.layers[0]` at low opacity to transparent. Designed to be
 * ND-safe and produce a stable backdrop for subsequent layered drawing operations.
 *
 * Expects `bounds` to provide numeric `width` and `height`, and `settings` to
 * include a `palette` with `bg` and `layers[0]`, plus numeric `NUM` constants
 * referenced by the renderer.
 */
function drawBackground(ctx, bounds, settings) {
  // ND-safe: background set first so all layers rest on stable field.
  ctx.fillStyle = settings.palette.bg;
  ctx.fillRect(0, 0, bounds.width, bounds.height);

  // Subtle radial breath to echo the provided imagery without motion.
  const two = settings.NUM.NINE - settings.NUM.SEVEN;
  const gradient = ctx.createRadialGradient(
    bounds.width / settings.NUM.THREE,
    bounds.height / settings.NUM.THREE,
    Math.max(bounds.width, bounds.height) / settings.NUM.NINETYNINE,
    bounds.width / two,
    bounds.height / two,
    Math.max(bounds.width, bounds.height) / settings.NUM.THREE
  );
  gradient.addColorStop(0, addAlpha(settings.palette.layers[0], 0.16));
  gradient.addColorStop(1, addAlpha(settings.palette.bg, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, bounds.width, bounds.height);
}

/**
 * Draws a grid of overlapping circles (a vesica-style field) across the provided bounds.
 *
 * Renders `rows x columns` circles using radii and spacing derived from `settings.NUM`
 * and fills stroke color from `settings.palette.layers[1]` with a computed alpha.
 * The function is deterministic and performs all painting on the supplied canvas context.
 *
 * @param {{width:number,height:number}} bounds - Drawing bounds used to compute circle radius and grid spacing.
 * @param {{NUM:Object,palette:{layers:string[]}}} settings - Normalized renderer settings; uses `NUM` numeric constants and `palette.layers[1]` for stroke color.
 */
function drawVesicaField(ctx, bounds, settings) {
  const { NUM, palette } = settings;
  const base = Math.min(bounds.width, bounds.height);
  const radius = base / NUM.SEVEN;
  const columns = NUM.THREE;
  const rows = NUM.SEVEN;
  const marginX = bounds.width / NUM.NINE;
  const marginY = bounds.height / NUM.NINE;
  const gapX = (bounds.width - marginX * 2) / (columns - 1);
  const gapY = (bounds.height - marginY * 2) / (rows - 1);
  const color = addAlpha(palette.layers[1], NUM.THREE / (NUM.ELEVEN + NUM.THREE));
  const twoPI = Math.PI * (NUM.NINE - NUM.SEVEN);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = radius / NUM.ELEVEN;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const cx = marginX + col * gapX;
      const cy = marginY + row * gapY;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, twoPI);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Render a simplified Tree of Life scaffold (10 sephirot and 22 connecting paths).
 *
 * Draws ten circular nodes and their connecting paths inside the given bounds using colors and numeric constants from settings. Nodes are filled with a layer color and stroked with a subtle ink outline; connecting paths are drawn with a translucent layer color. The function mutates the provided canvas context but saves and restores its state.
 *
 * @param {{width: number, height: number}} bounds - Area used to compute node positions, spacing, and radii.
 * @param {Object} settings - Rendering settings containing `palette` (colors) and `NUM` (numeric constants) used for sizes, spacing, and alpha calculations.
 */
function drawTreeOfLife(ctx, bounds, settings) {
  const { palette, NUM } = settings;
  const centerX = bounds.width / (settings.NUM.NINE - settings.NUM.SEVEN);
  const marginY = bounds.height / NUM.NINE;
  const levelCount = NUM.SEVEN;
  const verticalGap = (bounds.height - marginY * 2) / (levelCount - 1);
  const horizontalGap = bounds.width / NUM.SEVEN;
  const nodeRadius = Math.min(bounds.width, bounds.height) / NUM.THIRTYTHREE;
  const nodeColor = palette.layers[0];
  const pathColor = addAlpha(palette.layers[5], NUM.SEVEN / NUM.ONEFORTYFOUR * (NUM.THREE / NUM.ELEVEN));

  const nodes = createTreeNodes(centerX, marginY, verticalGap, horizontalGap, nodeRadius);
  const paths = createTreePaths();

  ctx.save();
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = nodeRadius / NUM.THREE;
  ctx.lineCap = "round";
  paths.forEach((pair) => {
    const from = nodes[pair[0]];
    const to = nodes[pair[1]];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  });

  ctx.fillStyle = nodeColor;
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * (NUM.NINE - NUM.SEVEN));
    ctx.fill();
    ctx.strokeStyle = addAlpha(palette.ink, 0.24);
    ctx.lineWidth = node.radius / NUM.ELEVEN;
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Produce the 10 sephirot node positions for a Kircher-style Tree of Life layout.
 *
 * Returns an array of node objects (name, x, y, radius) positioned around a central
 * column: one top node, symmetric left/right pairs on subsequent rows, and a
 * descending central column culminating in Malkuth.
 *
 * @param {number} centerX - X coordinate of the central column.
 * @param {number} marginY - Y coordinate of the top node (Keter).
 * @param {number} verticalGap - Vertical spacing between successive rows of nodes.
 * @param {number} horizontalGap - Horizontal offset from center for left/right nodes.
 * @param {number} radius - Radius assigned to every node.
 * @return {Array<{name: string, x: number, y: number, radius: number}>} Ten node objects in canonical order.
 */
function createTreeNodes(centerX, marginY, verticalGap, horizontalGap, radius) {
  // 10 sephirot positions in Kircher arrangement.
  const leftX = centerX - horizontalGap;
  const rightX = centerX + horizontalGap;
  return [
    { name:"Keter", x:centerX, y:marginY, radius },
    { name:"Chokmah", x:rightX, y:marginY + verticalGap, radius },
    { name:"Binah", x:leftX, y:marginY + verticalGap, radius },
    { name:"Chesed", x:rightX, y:marginY + verticalGap * 2, radius },
    { name:"Geburah", x:leftX, y:marginY + verticalGap * 2, radius },
    { name:"Tipheret", x:centerX, y:marginY + verticalGap * 3, radius },
    { name:"Netzach", x:rightX, y:marginY + verticalGap * 4, radius },
    { name:"Hod", x:leftX, y:marginY + verticalGap * 4, radius },
    { name:"Yesod", x:centerX, y:marginY + verticalGap * 5, radius },
    { name:"Malkuth", x:centerX, y:marginY + verticalGap * 6, radius }
  ];
}

/**
 * Return the predefined list of 22 index pairs representing connections (paths) between Tree-of-Life nodes.
 *
 * Each pair [fromIndex, toIndex] refers to positions in the node array produced by `createTreeNodes()` (there are 10 nodes, indices 0–9).
 *
 * @return {number[][]} Array of 22 two-element arrays describing undirected/sequential connections between node indices.
 */
function createTreePaths() {
  // 22 connections reflecting Hebrew-letter paths in simplified order.
  return [
    [0, 1], [0, 2], [0, 5],
    [1, 2], [1, 5], [1, 3],
    [2, 5], [2, 4], [3, 4],
    [3, 5], [3, 6], [4, 5],
    [4, 7], [5, 6], [5, 7],
    [5, 8], [6, 7], [6, 8],
    [6, 9], [7, 8], [7, 9],
    [8, 9]
  ];
}

/**
 * Draws a static Fibonacci (logarithmic) spiral as a stroked polyline onto the provided canvas context.
 *
 * The spiral is constructed using the golden ratio (phi) and a fixed number of segments derived from
 * settings.NUM. Stroke color is taken from settings.palette.layers[3] with an alpha computed from NUM
 * constants; line width is scaled to the smaller canvas dimension. This function saves and restores
 * the canvas state and performs no animations or asynchronous work.
 *
 * @param {Object} bounds - Rendering bounds; must include numeric `width` and `height`.
 * @param {Object} settings - Normalized renderer settings. Used properties:
 *   - NUM: numeric constants (e.g., THREE, SEVEN, NINE, TWENTYTWO, NINETYNINE, ONEFORTYFOUR).
 *   - palette: color palette where `palette.layers[3]` provides the base color for the spiral stroke.
 */
function drawFibonacciCurve(ctx, bounds, settings) {
  const { NUM, palette } = settings;
  const center = { x:bounds.width / NUM.THREE, y:bounds.height / NUM.SEVEN * NUM.THREE };
  const phi = (1 + Math.sqrt(5)) / 2;
  const segmentCount = NUM.TWENTYTWO;
  const spiralPoints = [];
  const maxRadius = Math.min(bounds.width, bounds.height) / NUM.THREE;
  const angleStep = (Math.PI * NUM.NINE) / NUM.ONEFORTYFOUR; // gentle growth
  const twoPI = Math.PI * (NUM.NINE - NUM.SEVEN);

  for (let i = 0; i < segmentCount; i += 1) {
    const radius = maxRadius / Math.pow(phi, segmentCount - i);
    const angle = i * angleStep + twoPI / NUM.TWENTYTWO;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    spiralPoints.push({ x, y });
  }

  ctx.save();
  ctx.strokeStyle = addAlpha(palette.layers[3], NUM.TWENTYTWO / (NUM.ONEFORTYFOUR * (NUM.NINE - NUM.SEVEN)));
  ctx.lineWidth = maxRadius / NUM.NINETYNINE * NUM.THREE;
  ctx.lineCap = "round";
  ctx.beginPath();
  spiralPoints.forEach((pt, index) => {
    if (index === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  });
  ctx.stroke();
  ctx.restore();
}

/**
 * Render a static double-helix (two intertwined sine strands) with connecting rungs onto a canvas.
 *
 * Draws two phase-shifted sine strands down the provided bounds and renders horizontal rungs between them.
 * Strand positions, amplitudes, colors, frequency, and rung density are derived from values in `settings.NUM`
 * and `settings.palette`, producing a deterministic, non-animated decorative helix.
 *
 * Side effects:
 * - Strokes directly to the supplied canvas 2D context.
 *
 * @param {Object} bounds - Layout bounds; must include numeric `width` and `height`.
 * @param {Object} settings - Rendering settings object containing `NUM` (numeric constants) and `palette` (colors).
 */
function drawDoubleHelix(ctx, bounds, settings) {
  const { NUM, palette } = settings;
  const centerX = bounds.width * (NUM.TWENTYTWO / (NUM.THIRTYTHREE + NUM.ELEVEN));
  const amplitude = bounds.width / NUM.ELEVEN;
  const strandLength = bounds.height;
  const strandSteps = NUM.ONEFORTYFOUR;
  const strandColorA = addAlpha(palette.layers[2], NUM.TWENTYTWO / NUM.ONEFORTYFOUR);
  const strandColorB = addAlpha(palette.layers[4], NUM.TWENTYTWO / NUM.ONEFORTYFOUR);
  const rungCount = NUM.THIRTYTHREE;
  const frequency = NUM.THREE; // three full twists down the canvas
  const twoPI = Math.PI * (NUM.NINE - NUM.SEVEN);

  const strandA = [];
  const strandB = [];
  for (let i = 0; i <= strandSteps; i += 1) {
    const t = i / strandSteps;
    const y = t * strandLength;
    const theta = t * frequency * twoPI;
    const xA = centerX + Math.sin(theta) * amplitude;
    const xB = centerX + Math.sin(theta + Math.PI) * amplitude;
    strandA.push({ x:xA, y });
    strandB.push({ x:xB, y });
  }

  ctx.save();
  ctx.lineWidth = amplitude / NUM.NINETYNINE * NUM.SEVEN;
  ctx.lineCap = "round";
  drawPolyline(ctx, strandA, strandColorA);
  drawPolyline(ctx, strandB, strandColorB);

  const rungInterval = Math.max(1, Math.floor(strandA.length / rungCount));
  ctx.strokeStyle = addAlpha(palette.ink, NUM.THREE / NUM.THIRTYTHREE);
  ctx.lineWidth = amplitude / NUM.ELEVEN;
  for (let i = 0; i < strandA.length; i += rungInterval) {
    const a = strandA[i];
    const b = strandB[i];
    if (!a || !b) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Stroke a polyline through an ordered list of points on the provided canvas context.
 *
 * If `points` is empty the function is a no-op. The path is begun, moved to the first
 * point, then connected with straight segments to each subsequent point and stroked
 * using the provided CSS color string.
 *
 * @param {Array<{x:number,y:number}>} points - Ordered array of point objects with numeric `x` and `y`.
 * @param {string} color - CSS color string used for `ctx.strokeStyle`.
 */
function drawPolyline(ctx, points, color) {
  if (points.length === 0) {
    return;
  }
  ctx.beginPath();
  points.forEach((pt, index) => {
    if (index === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  });
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a small informational notice in the lower-right corner of the canvas.
 *
 * The notice text is rendered using the ink color from the palette with an applied
 * alpha and positioned inset from the bottom-right by a fraction derived from
 * settings.NUM.ELEVEN. Applies a readable default font and right text alignment.
 *
 * @param {Object} bounds - Canvas bounds object; must provide numeric `width` and `height`.
 * @param {Object} settings - Rendering settings; uses `settings.notice` (string),
 *   `settings.palette.ink` (hex color string) and `settings.NUM.ELEVEN` (number) to compute placement and color.
 */
function drawNotice(ctx, bounds, settings) {
  ctx.save();
  ctx.fillStyle = addAlpha(settings.palette.ink, 0.72);
  ctx.font = "14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    settings.notice,
    bounds.width - bounds.width / settings.NUM.ELEVEN,
    bounds.height - bounds.height / settings.NUM.ELEVEN
  );
  ctx.restore();
}

/**
 * Return an RGBA CSS color string by applying an alpha value to a hex color.
 * @param {string} hexColor - 3- or 6-digit hex color (with or without leading '#').
 * @param {number} alpha - Opacity in the range [0, 1].
 * @return {string} CSS `rgba(r, g, b, a)` string.
 */
function addAlpha(hexColor, alpha) {
  return hexToRgba(hexColor, alpha);
}

/**
 * Convert a 3- or 6-digit hex color (with or without a leading `#`) into a CSS `rgba(r, g, b, a)` string using the provided alpha.
 * @param {string} hex - Hex color in `#rrggbb`, `rrggbb`, `#rgb`, or `rgb` form.
 * @param {number} alpha - Opacity between 0 and 1.
 * @return {string} CSS `rgba(...)` color string.
 */
function hexToRgba(hex, alpha) {
  let raw = hex.replace("#", "");
  if (raw.length === 3) {
    raw = raw.split("").map((c) => c + c).join("");
  }
  const bigint = parseInt(raw, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
