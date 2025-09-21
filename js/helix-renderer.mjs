/**
 * Render a layered, ND-safe sacred-geometry composition onto a canvas.
 *
 * Draws four static visual layers in order (vesica field, Tree of Life scaffold,
 * Fibonacci spiral, and a double-helix lattice) and an optional notice string.
 * Uses a normalized palette and numerology constants to scale and color elements;
 * sensible defaults are used when options are omitted.
 *
 * @param {CanvasRenderingContext2D} ctx - 2D canvas rendering context to draw onto.
 * @param {Object} [options] - Rendering options.
 * @param {number} [options.width=1440] - Canvas width in pixels.
 * @param {number} [options.height=900] - Canvas height in pixels.
 * @param {Object} [options.palette] - Partial or full color palette; missing fields are filled by the internal normalisation.
 * @param {Object} [options.NUM] - Numerology constants object (use defaultNumerology() if omitted) that controls sizing/scales.
 * @param {string} [options.notice=""] - Optional short informational text drawn on the canvas when provided.
 */

export function renderHelix(ctx, options = {}) {
  const { width = 1440, height = 900, palette = {}, NUM = defaultNumerology(), notice = "" } = options;
  const colors = normalisePalette(palette);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);

  fillBackground(ctx, width, height, colors.background);

  drawVesicaField(ctx, { width, height, color: colors.vesica, NUM });
  drawTreeOfLife(ctx, { width, height, pathColor: colors.treeLines, nodeColor: colors.treeNodes, labelColor: colors.ink, NUM });
  drawFibonacciCurve(ctx, { width, height, color: colors.fibonacci, NUM });
  drawHelixLattice(ctx, { width, height, primary: colors.helix, secondary: colors.helixAccent, NUM });

  if (notice) {
    drawNotice(ctx, { text: notice, color: colors.notice, width, height });
  }

  ctx.restore();
}

/**
 * Return a small set of fixed numeric constants (numerology values) used for sizing and layout.
 *
 * These named constants are used across rendering routines to scale geometry and stroke widths.
 * @returns {{THREE:number, SEVEN:number, NINE:number, ELEVEN:number, TWENTYTWO:number, THIRTYTHREE:number, NINETYNINE:number, ONEFORTYFOUR:number}} An object mapping constant names to their numeric values.
 */
function defaultNumerology() {
  return { THREE: 3, SEVEN: 7, NINE: 9, ELEVEN: 11, TWENTYTWO: 22, THIRTYTHREE: 33, NINETYNINE: 99, ONEFORTYFOUR: 144 };
}

/**
 * Normalize an input color palette into the renderer's expected named color map.
 *
 * Accepts a palette object with optional keys and returns a complete set of colors
 * (background, ink, vesica, treeLines, treeNodes, fibonacci, helix, helixAccent, notice)
 * filling any missing entries with sensible defaults. If `palette.layers` is a
 * sufficiently long array it supplies layer-based colors in the order used by the
 * renderer; otherwise a built-in six-color default is used.
 *
 * @param {Object} palette - Input palette; may include:
 *   - {string[]} [layers] Array of layer colors (expects at least 4 entries; indexes used: 0..5).
 *   - {string} [bg] Background color.
 *   - {string} [ink] Primary ink color.
 *   - {string} [notice] Color for optional notice text.
 * @return {{background:string,ink:string,vesica:string,treeLines:string,treeNodes:string,fibonacci:string,helix:string,helixAccent:string,notice:string}} Normalized color map with all required keys populated.
 */
function normalisePalette(palette) {
  const layers = Array.isArray(palette.layers) && palette.layers.length >= 4
    ? palette.layers
    : ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"];
  return {
    background: palette.bg || "#0b0b12",
    ink: palette.ink || "#e8e8f0",
    vesica: layers[0] || "#b1c7ff",
    treeLines: layers[3] || "#ffd27f",
    treeNodes: layers[4] || "#f5a3ff",
    fibonacci: layers[1] || "#89f7fe",
    helix: layers[2] || "#a0ffa1",
    helixAccent: layers[5] || "#d0d0e6",
    notice: palette.notice || "#a6a6c1"
  };
}

/**
 * Fill the entire canvas area with a solid color, preserving the drawing state.
 *
 * Saves and restores the canvas context state so the caller's transform, styles,
 * and other settings are unchanged after this operation.
 *
 * @param {number} width - Width of the area to fill in pixels.
 * @param {number} height - Height of the area to fill in pixels.
 * @param {string|CanvasGradient|CanvasPattern} color - Fill style; any valid CSS color string, CanvasGradient, or CanvasPattern.
 */
function fillBackground(ctx, width, height, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Draw a small informational notice near the top-left of the canvas.
 *
 * @param {string} text - The notice text to render.
 * @param {string} color - CSS color used for the text fill.
 * @param {number} width - Canvas width in pixels; used to compute horizontal offset (2%).
 * @param {number} height - Canvas height in pixels; used to compute vertical offset (2%).
 */
function drawNotice(ctx, { text, color, width, height }) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "12px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(text, width * 0.02, height * 0.02);
  ctx.restore();
}

/**
 * Render a vesica-field of overlapping circles centered in the canvas.
 *
 * Draws a cluster of stroked circles (central, paired "vesica" lenses, a vertical
 * trinity, and a sixfold ring) using sizes and offsets derived from the supplied
 * numerology constants. Rendering uses a semi-transparent stroke and a line
 * width scaled to the canvas unit.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context.
 * @param {Object} options
 * @param {number} options.width - Canvas width in pixels.
 * @param {number} options.height - Canvas height in pixels.
 * @param {string|CanvasGradient|CanvasPattern} options.color - Stroke color for the circles.
 * @param {Object} options.NUM - Numerology constants object (provides keys like ONEFORTYFOUR, THIRTYTHREE, TWENTYTWO, NINE, THREE, ELEVEN, SEVEN) used to scale radii, offsets, counts, and line width.
 */
function drawVesicaField(ctx, { width, height, color, NUM }) {
  const unit = Math.min(width, height) / NUM.ONEFORTYFOUR;
  const radius = unit * NUM.THIRTYTHREE;
  const center = { x: width / 2, y: height / 2 };
  const lensOffset = radius * (NUM.SEVEN / NUM.TWENTYTWO);
  const ringCount = NUM.NINE - NUM.THREE; // sixfold symmetry derived from numerology constants
  const centers = [center];

  // Core vesica pair to anchor breathing lens form
  centers.push({ x: center.x - lensOffset, y: center.y });
  centers.push({ x: center.x + lensOffset, y: center.y });

  // Vertical trinity for depth
  const verticalStep = radius * (NUM.ELEVEN / NUM.TWENTYTWO);
  centers.push({ x: center.x, y: center.y - verticalStep });
  centers.push({ x: center.x, y: center.y + verticalStep });
  centers.push({ x: center.x, y: center.y - verticalStep * 2 });
  centers.push({ x: center.x, y: center.y + verticalStep * 2 });

  // Circular ring using sixfold arrangement (NUM.NINE - NUM.THREE)
  for (let i = 0; i < ringCount; i += 1) {
    const angle = (Math.PI * 2 * i) / ringCount;
    const radial = lensOffset * (NUM.THIRTYTHREE / NUM.TWENTYTWO);
    centers.push({
      x: center.x + Math.cos(angle) * radial,
      y: center.y + Math.sin(angle) * radial
    });
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = unit * (NUM.THREE / NUM.THIRTYTHREE);
  centers.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Render a stylized Tree of Life (ten named sephirot) onto a 2D canvas.
 *
 * Positions nodes across three columns and seven vertical levels, draws connecting paths
 * from a fixed edge list, renders each node as a filled disc with a translucent halo,
 * and draws centered labels beneath nodes. All sizes, spacings, and stroke widths are
 * scaled from the provided width/height using the numerology constants in `NUM`.
 *
 * @param {Object} options - Rendering options.
 * @param {number} options.width - Canvas drawing width in pixels.
 * @param {number} options.height - Canvas drawing height in pixels.
 * @param {string} options.pathColor - Color used for connection lines and node halos.
 * @param {string} options.nodeColor - Fill color for node discs.
 * @param {string} options.labelColor - Color for node labels.
 * @param {Object} options.NUM - Numerology constants (e.g., THREE, SEVEN, NINE, ELEVEN, TWENTYTWO, NINETYNINE) used to scale layout and stroke widths.
 */
function drawTreeOfLife(ctx, { width, height, pathColor, nodeColor, labelColor, NUM }) {
  const margin = Math.min(width, height) / NUM.ELEVEN;
  const steps = NUM.NINE - NUM.THREE; // six steps between seven levels
  const levelStep = (height - margin * 2) / steps;
  const columnSpan = width / NUM.TWENTYTWO * NUM.SEVEN;
  const columns = [
    width / 2 - columnSpan,
    width / 2,
    width / 2 + columnSpan
  ];

  const nodes = [
    { name: "Keter", column: 1, level: 0 },
    { name: "Chokmah", column: 2, level: 1 },
    { name: "Binah", column: 0, level: 1 },
    { name: "Chesed", column: 2, level: 2 },
    { name: "Gevurah", column: 0, level: 2 },
    { name: "Tiferet", column: 1, level: 3 },
    { name: "Netzach", column: 2, level: 4 },
    { name: "Hod", column: 0, level: 4 },
    { name: "Yesod", column: 1, level: 5 },
    { name: "Malkuth", column: 1, level: 6 }
  ].map((node) => {
    return {
      name: node.name,
      x: columns[node.column],
      y: margin + node.level * levelStep
    };
  });

  const paths = buildTreePaths();

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = Math.min(width, height) / NUM.NINETYNINE * (NUM.THREE / NUM.SEVEN);
  paths.forEach(([a, b]) => {
    const start = nodes[a];
    const end = nodes[b];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  // Nodes with gentle halos to maintain depth cues
  const nodeRadius = Math.min(width, height) / NUM.TWENTYTWO;
  nodes.forEach((node) => {
    ctx.fillStyle = nodeColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius * (NUM.THREE / NUM.SEVEN), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = pathColor;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius * (NUM.ELEVEN / NUM.TWENTYTWO), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // Label centers softly for reference
  ctx.fillStyle = labelColor;
  ctx.font = "11px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  nodes.forEach((node) => {
    ctx.fillText(node.name, node.x, node.y + nodeRadius * (NUM.ELEVEN / NUM.TWENTYTWO));
  });

  ctx.restore();
}

/**
 * Return the fixed set of index-pair edges that define the Tree of Life connectivity.
 *
 * Each element is a two-item array [fromIndex, toIndex] referencing node positions
 * produced by the Tree of Life node layout; used by drawTreeOfLife to render connecting paths.
 *
 * @return {number[][]} Array of 2-tuples where each tuple is an edge between node indices.
 */
function buildTreePaths() {
  return [
    [0, 1], [0, 2],
    [1, 2],
    [1, 3], [1, 5],
    [2, 4], [2, 5],
    [3, 4],
    [3, 5], [4, 5],
    [3, 6], [5, 6],
    [4, 7], [5, 7],
    [6, 7],
    [6, 8], [7, 8],
    [8, 9],
    [6, 9], [7, 9],
    [3, 8], [4, 8]
  ];
}

/**
 * Draws a centered Fibonacci (logarithmic) spiral on the canvas.
 *
 * Generates a sampled logarithmic spiral using the golden ratio, then strokes
 * a smooth polyline through the sample points. The spiral's overall size and
 * thickness are scaled to the provided width/height and numerology constants.
 *
 * @param {number} width - Canvas drawing width used to center and scale the spiral.
 * @param {number} height - Canvas drawing height used to center and scale the spiral.
 * @param {string|CanvasGradient|CanvasPattern} color - Stroke style applied to the spiral.
 * @param {Object} NUM - Numerology constants object (e.g., contains THREE, NINE, ELEVEN, THIRTYTHREE, NINETYNINE) used to compute sampling, scale, and line width.
 */
function drawFibonacciCurve(ctx, { width, height, color, NUM }) {
  const center = { x: width / 2, y: height / 2 };
  const golden = (1 + Math.sqrt(5)) / 2;
  const turns = NUM.ELEVEN / NUM.NINE; // uses numerology to define gentle 1.22 rotations
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + turns * Math.PI * 2;
  const exponent = (endAngle - startAngle) / (Math.PI / 2);
  const outerRadius = Math.min(width, height) / NUM.THREE;
  const base = outerRadius / Math.pow(golden, exponent);
  const segments = NUM.THIRTYTHREE;
  const points = sampleSpiral(center, base, golden, startAngle, endAngle, segments);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.min(width, height) / NUM.NINETYNINE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawPolyline(ctx, points);
  ctx.restore();
}

/**
 * Sample points along a logarithmic-style spiral between two angles.
 *
 * Generates `segments + 1` evenly spaced sample points along a spiral defined
 * by a polar radius r(θ) = base * golden^(θ / (π/2)). Angles are interpolated
 * linearly from `startAngle` to `endAngle` and converted to Cartesian points
 * offset from `center`.
 *
 * @param {{x:number,y:number}} center - Cartesian origin for the spiral samples.
 * @param {number} base - Base radius multiplier applied at angle 0.
 * @param {number} golden - Exponential growth factor; values >1 produce outward growth.
 * @param {number} startAngle - Starting angle in radians.
 * @param {number} endAngle - Ending angle in radians.
 * @param {number} segments - Number of segments; the function returns segments + 1 points (inclusive endpoints).
 * @returns {Array<{x:number,y:number}>} Array of sampled points in Cartesian coordinates.
 */
function sampleSpiral(center, base, golden, startAngle, endAngle, segments) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = startAngle + (endAngle - startAngle) * t;
    const growth = Math.pow(golden, angle / (Math.PI / 2));
    const radius = base * growth;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return points;
}

/**
 * Stroke a continuous polyline through an ordered array of points on the provided 2D canvas context.
 *
 * If `points` is empty the function returns without modifying the context.
 * @param {{x: number, y: number}[]} points - Ordered array of vertices to connect; the first element is used as the starting point and subsequent elements are joined with straight segments.
 */
function drawPolyline(ctx, points) {
  if (!points.length) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

/**
 * Draws a double-helix lattice onto the provided canvas context.
 *
 * Generates two mirrored sine-based strands down the canvas center and renders horizontal cross-ties
 * between them to form a lattice. Sizing (sample count, amplitude, vertical spacing, phase) and line
 * widths are derived from the supplied numerology constants so the composition scales consistently
 * with the canvas dimensions.
 *
 * The function mutates the canvas by stroking the two strands with the `primary` color and drawing
 * a fixed number of cross-ties with the `secondary` color. No value is returned.
 *
 * @param {number} width - Canvas width in pixels.
 * @param {number} height - Canvas height in pixels.
 * @param {string} primary - CSS color used to draw the two helix strands.
 * @param {string} secondary - CSS color used to draw the horizontal cross-ties (rungs).
 * @param {Object} NUM - Numerology constants object (expects numeric fields like NINETYNINE, TWENTYTWO, THREE, ELEVEN) used to compute sampling, amplitudes, spacing, and line widths.
 */
function drawHelixLattice(ctx, { width, height, primary, secondary, NUM }) {
  const samples = NUM.NINETYNINE;
  const amplitude = width / NUM.TWENTYTWO;
  const verticalStep = height / NUM.TWENTYTWO;
  const phaseStep = (Math.PI * NUM.TWENTYTWO) / height;
  const leftPoints = [];
  const rightPoints = [];

  for (let i = 0; i <= samples; i += 1) {
    const y = (height / samples) * i;
    const phase = y * phaseStep;
    const xOffset = Math.sin(phase) * amplitude;
    leftPoints.push({ x: width / 2 - xOffset, y });
    rightPoints.push({ x: width / 2 + xOffset, y });
  }

  ctx.save();
  ctx.strokeStyle = primary;
  ctx.lineWidth = Math.min(width, height) / NUM.NINETYNINE * (NUM.THREE / NUM.ELEVEN);
  ctx.lineCap = "round";
  drawPolyline(ctx, leftPoints);
  drawPolyline(ctx, rightPoints);

  ctx.strokeStyle = secondary;
  const rungCount = NUM.ELEVEN + NUM.THREE; // 14 static lattice cross ties
  for (let i = 0; i <= rungCount; i += 1) {
    const y = verticalStep * (i + NUM.THREE / NUM.ELEVEN);
    const phase = y * phaseStep;
    const xOffset = Math.sin(phase) * amplitude;
    ctx.beginPath();
    ctx.moveTo(width / 2 - xOffset, y);
    ctx.lineTo(width / 2 + xOffset, y);
    ctx.stroke();
  }
  ctx.restore();
}
