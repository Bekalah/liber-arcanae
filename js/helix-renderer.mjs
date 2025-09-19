// Per Texturas Numerorum, Spira Loquitur.
/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers (drawn in order):
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (sephirot and 22 paths)
    3) Fibonacci curve (logarithmic spiral polyline)
    4) Double-helix lattice (phase-shifted strands)

  Rationale:
    - No motion or autoplay; everything renders once on load.
    - Soft contrast palette keeps focus gentle and ND-safe.
    - Pure helper functions and numerology constants keep geometry explainable.
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

// Layer 1: Vesica field using a 3×3 grid to honor the triad.
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
 * Draws the Tree-of-Life scaffold: ten sephirot nodes and up to twenty-two connecting paths.
 * Nodes land on a vertical lattice keyed to NUM.TWENTYTWO to keep spacing calm.
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

// Layer 3: Fibonacci curve uses thirty-three points to honor the mystic ladder.
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
 * Draws a static double-helix lattice: two phase-shifted sinusoidal strands with calm crossbars.
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
