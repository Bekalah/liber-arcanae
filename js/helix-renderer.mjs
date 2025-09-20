// Per Texturas Numerorum, Spira Loquitur.
/**
 * Render a static, layered sacred-geometry composition onto a 2D canvas.
 *
 * Draws four layers in order (vesica field, Tree-of-Life scaffold, Fibonacci curve,
 * and double-helix lattice) using colors from opts.palette and layout constants from opts.NUM.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context to draw into.
 * @param {Object} opts - Rendering options.
 * @param {number} opts.width - Canvas width in pixels.
 * @param {number} opts.height - Canvas height in pixels.
 * @param {Object} opts.palette - Color palette; must include `bg` and `layers` (array of four layer colors).
 * @param {Object} opts.NUM - Numerology/layout constants used by the layer helpers.
 */

export function renderHelix(ctx, opts) {
  const { width, height, palette, NUM } = opts;
  const [vesicaColor, treeColor, fibonacciColor, helixColor] = palette.layers;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  drawVesicaField(ctx, width, height, vesicaColor, NUM);
  drawTreeOfLife(ctx, width, height, treeColor, NUM);
  drawFibonacciCurve(ctx, width, height, fibonacciColor, NUM);
  drawHelixLattice(ctx, width, height, helixColor, NUM);
  ctx.restore();
}

/**
 * Draws a Vesica field: a 3×3 grid of paired, intersecting circles (vesicae).
 *
 * Each grid cell contains two circles whose centers are horizontally offset by half the computed radius.
 * The circle radius is computed as Math.min(w, h) / NUM.NINE. The function sets stroke style, line width,
 * and line cap for the strokes, and saves/restores the canvas state around the drawing.
 *
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string|CanvasGradient|CanvasPattern} color - Stroke color used for the circles.
 * @param {Object} NUM - Numeric constants object; must provide NUM.THREE and NUM.NINE.
 */
function drawVesicaField(ctx, w, h, color, NUM) {
  ctx.save();
  const cols = NUM.THREE;
  const rows = NUM.THREE;
  const radius = Math.min(w, h) / NUM.NINE; // ND-safe: gentle radius to avoid overwhelming density.

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = ((col + 0.5) * w) / cols;
      const cy = ((row + 0.5) * h) / rows;

      ctx.beginPath();
      ctx.arc(cx - radius / 2, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx + radius / 2, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Draws the Tree-of-Life scaffold: ten sephirot positioned on a triadic left/center/right column layout and up to 22 connecting paths.
 *
 * Renders 10 nodes spaced along a vertical lattice (spacing derived from NUM.TWENTYTWO) with columns at left/center/right (ratios derived from NUM.THREE and NUM.SEVEN). Draws lines for each connection from a fixed path list truncated to NUM.TWENTYTWO, then fills circular node markers sized relative to the canvas.
 * @param {string} color - Stroke and fill color used for links and nodes.
 * @param {Object} NUM - Numeric layout constants required by the function (e.g., THREE, SEVEN, TWENTYTWO, NINE).
 */
function drawTreeOfLife(ctx, w, h, color, NUM) {
  ctx.save();
  const verticalStep = h / NUM.TWENTYTWO;
  const leftRatio = NUM.THREE / (NUM.THREE + NUM.SEVEN); // 0.3 keeps left pillar in the triad.
  const rightRatio = NUM.SEVEN / (NUM.THREE + NUM.SEVEN); // 0.7 mirrors the mercy pillar.
  const centerX = w / 2;
  const leftX = w * leftRatio;
  const rightX = w * rightRatio;

  const nodes = [
    [centerX, verticalStep * 1],
    [leftX, verticalStep * 4],
    [rightX, verticalStep * 4],
    [leftX, verticalStep * 7],
    [rightX, verticalStep * 7],
    [centerX, verticalStep * 11],
    [leftX, verticalStep * 14],
    [rightX, verticalStep * 14],
    [centerX, verticalStep * 18],
    [centerX, verticalStep * 21]
  ];

  const rawPaths = [
    [0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[3,5],[4,5],[3,6],[4,7],
    [5,6],[5,7],[6,7],[6,8],[7,8],[6,9],[7,9],[8,9],[1,5],[2,5],
    [0,5],[5,9]
  ];
  const paths = rawPaths.slice(0, NUM.TWENTYTWO);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5; // ND-safe: thin strokes keep the scaffold calm.
  ctx.lineCap = "round";

  for (const [a, b] of paths) {
    const [ax, ay] = nodes[a];
    const [bx, by] = nodes[b];
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  const radiusDivisor = (NUM.TWENTYTWO * NUM.NINE) / NUM.THREE; // 66 via triadic scaling.
  const nodeRadius = Math.min(w, h) / radiusDivisor;
  for (const [x, y] of nodes) {
    ctx.beginPath();
    ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws a Fibonacci-inspired logarithmic curve as a stroked polyline.
 *
 * The curve is plotted from a center positioned at (w*0.75, h*0.3) and uses the golden-ratio
 * growth factor to space radial steps. This function iterates step = 0..NUM.THIRTYTHREE and
 * converts polar coordinates (radius, theta) to Cartesian points, connecting them with a single
 * stroked path.
 *
 * @param {CanvasRenderingContext2D} ctx - 2D rendering context to draw onto.
 * @param {number} w - Canvas width used for positioning and scaling.
 * @param {number} h - Canvas height used for positioning and scaling.
 * @param {string} color - Stroke color for the curve.
 * @param {object} NUM - Numeric constants object; this function reads NUM.THIRTYTHREE, NUM.SEVEN,
 *   NUM.NINE, and NUM.NINETYNINE to control sampling, angular step, exponential radius growth,
 *   and overall scale.
 */
function drawFibonacciCurve(ctx, w, h, color, NUM) {
  ctx.save();
  const phi = (1 + Math.sqrt(5)) / 2;
  const center = { x: w * 0.75, y: h * 0.3 };
  const scale = Math.min(w, h) / NUM.NINETYNINE;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";

  ctx.beginPath();
  for (let step = 0; step <= NUM.THIRTYTHREE; step++) {
    const theta = step * (Math.PI / NUM.SEVEN); // gentle sweep anchored to 7.
    const radius = scale * Math.pow(phi, step / NUM.NINE);
    const x = center.x + radius * Math.cos(theta);
    const y = center.y + radius * Math.sin(theta);
    if (step === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Render a static double-helix lattice onto a 2D canvas: two phase-shifted sinusoidal strands with evenly spaced vertical crossbars.
 *
 * Draws directly to the provided canvas context; does not return a value. Strand density, amplitude, and crossbar spacing are driven by constants in the `NUM` object:
 * - NUM.ONEFORTYFOUR: total horizontal sampling steps (used for strand resolution)
 * - NUM.TWENTYTWO: divisor for vertical amplitude
 * - NUM.ELEVEN: period divisor for the sine function (phase progression)
 * - NUM.NINE: divisor used to compute the crossbar interval
 *
 * @param {number} w - Canvas width in pixels.
 * @param {number} h - Canvas height in pixels.
 * @param {string|CanvasGradient|CanvasPattern} color - Stroke style used for strands and crossbars.
 * @param {object} NUM - Numeric constants object containing ONEFORTYFOUR, TWENTYTWO, ELEVEN, and NINE.
 */
function drawHelixLattice(ctx, w, h, color, NUM) {
  ctx.save();
  const steps = NUM.ONEFORTYFOUR; // 144 keeps the lattice crystalline.
  const amplitude = h / NUM.TWENTYTWO; // amplitude woven from the 22 sacred paths.
  const midY = h / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";

  ctx.beginPath();
  for (let step = 0; step <= steps; step++) {
    const x = (step / steps) * w;
    const y = midY + amplitude * Math.sin(step / NUM.ELEVEN);
    if (step === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  ctx.beginPath();
  for (let step = 0; step <= steps; step++) {
    const x = (step / steps) * w;
    const y = midY + amplitude * Math.sin(step / NUM.ELEVEN + Math.PI);
    if (step === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  const barStep = Math.max(1, Math.floor(steps / NUM.NINE)); // crossbars every ~16 steps.
  for (let step = 0; step <= steps; step += barStep) {
    const x = (step / steps) * w;
    const yA = midY + amplitude * Math.sin(step / NUM.ELEVEN);
    const yB = midY + amplitude * Math.sin(step / NUM.ELEVEN + Math.PI);
    ctx.beginPath();
    ctx.moveTo(x, yA);
    ctx.lineTo(x, yB);
    ctx.stroke();
  }
  ctx.restore();
}
