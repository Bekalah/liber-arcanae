/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)
    3) Fibonacci curve (log spiral polyline; static)
    4) Double-helix lattice (two phase-shifted strands tied by calm crossbars)

  The drawing routines keep to small pure helpers for clarity and to respect
  the ND-safe directive: no motion, gentle contrast, and predictable structure.
*/

export function renderHelix(ctx, options) {
  if (!ctx || !options) {
    return;
  }

  const config = normalizeOptions(options);
  const { width, height, palette, NUM } = config;
  const layers = palette.layers;

  ctx.save();
  drawBackground(ctx, palette.bg, width, height);

  drawVesicaField(ctx, width, height, pickLayer(layers, 0), NUM);
  drawTreeOfLife(ctx, width, height, palette.ink, pickLayer(layers, 1), NUM);
  drawFibonacciCurve(ctx, width, height, pickLayer(layers, 2), NUM);
  drawHelixLattice(ctx, width, height, pickLayer(layers, 3), pickLayer(layers, 4), NUM);

  ctx.restore();
}

function normalizeOptions(options) {
  const width = options.width || 1440;
  const height = options.height || 900;
  const palette = options.palette || { bg:"#0b0b12", ink:"#e8e8f0", layers:["#b1c7ff"] };
  const NUM = options.NUM || { THREE:3, SEVEN:7, NINE:9, ELEVEN:11, TWENTYTWO:22, THIRTYTHREE:33, NINETYNINE:99, ONEFORTYFOUR:144 };
  return { width, height, palette, NUM };
}

function pickLayer(layers, index) {
  if (!layers || layers.length === 0) {
    return "#ffffff";
  }
  return layers[index % layers.length];
}

function drawBackground(ctx, color, width, height) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/* Layer 1: Vesica field
   Uses a triadic-by-heptadic grid (3 rows, 7 columns) with alternating offsets
   so each circle intersects neighbors, evoking the Vesica Piscis without motion. */
function drawVesicaField(ctx, width, height, color, NUM) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(width, height) / NUM.NINETYNINE;
  ctx.globalAlpha = 0.45;

  const cols = NUM.SEVEN;
  const rows = NUM.THREE;
  const marginX = width / NUM.ELEVEN;
  const marginY = height / NUM.NINE;
  const usableWidth = width - marginX * 2;
  const usableHeight = height - marginY * 2;
  const stepX = usableWidth / (cols - 1);
  const stepY = usableHeight / (rows - 1);
  const radius = Math.min(stepX, stepY) * 0.75;

  for (let row = 0; row < rows; row += 1) {
    const offset = (row % 2 === 0) ? 0 : stepX / 2;
    for (let col = 0; col < cols; col += 1) {
      const cx = marginX + col * stepX + offset;
      const cy = marginY + row * stepY;
      drawCircle(ctx, cx, cy, radius);
    }
  }

  ctx.restore();
}

/* Layer 2: Tree-of-Life scaffold
   Ten nodes and twenty-two paths, scaled by numerology constants so the layout
   matches the Cathedral canon while staying calm. */
function drawTreeOfLife(ctx, width, height, nodeColor, lineColor, NUM) {
  ctx.save();
  const nodes = createTreeNodes(width, height, NUM);
  const paths = createTreePaths();

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = Math.max(width, height) / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.55;

  paths.forEach(([a, b]) => {
    const start = nodes[a];
    const end = nodes[b];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  ctx.fillStyle = nodeColor;
  ctx.globalAlpha = 0.9;
  const nodeRadius = Math.max(width, height) / NUM.NINETYNINE;
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function createTreeNodes(width, height, NUM) {
  const centerX = width / 2;
  const verticalStep = height / (NUM.NINE + 2);
  const horizontalSpread = width / NUM.THREE;
  const sideOffset = horizontalSpread / NUM.SEVEN;

  const levels = [
    [{ x: centerX, y: verticalStep }],
    [
      { x: centerX - horizontalSpread / 2, y: verticalStep * 2.5 },
      { x: centerX + horizontalSpread / 2, y: verticalStep * 2.5 }
    ],
    [
      { x: centerX - horizontalSpread / 2 - sideOffset, y: verticalStep * 4 },
      { x: centerX + horizontalSpread / 2 + sideOffset, y: verticalStep * 4 }
    ],
    [
      { x: centerX - horizontalSpread / 2, y: verticalStep * 5.5 },
      { x: centerX, y: verticalStep * 6.5 },
      { x: centerX + horizontalSpread / 2, y: verticalStep * 5.5 }
    ],
    [
      { x: centerX - horizontalSpread / 3, y: verticalStep * 8 },
      { x: centerX + horizontalSpread / 3, y: verticalStep * 8 }
    ],
    [{ x: centerX, y: verticalStep * 9.5 }]
  ];

  return levels.flat();
}

function createTreePaths() {
  return [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 4],
    [3, 5], [4, 5], [3, 6], [4, 7], [5, 6],
    [5, 7], [5, 8], [6, 8], [7, 8], [8, 9],
    [1, 2], [1, 5], [2, 5], [1, 6], [2, 7],
    [0, 5], [6, 9]
  ];
}

/* Layer 3: Fibonacci curve
   Approximates a logarithmic spiral using 99 samples. Phi and numerology constants
   control radius growth and step counts so the spiral feels organic yet calm. */
function drawFibonacciCurve(ctx, width, height, color, NUM) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(width, height) / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.7;

  const center = { x: width * 0.62, y: height * 0.58 };
  const baseRadius = Math.min(width, height) / NUM.ELEVEN;
  const points = createFibonacciPoints(center, baseRadius, NUM);

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

function createFibonacciPoints(center, baseRadius, NUM) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const turns = NUM.THREE;
  const stepsPerTurn = NUM.ELEVEN;
  const totalSteps = turns * stepsPerTurn * NUM.THREE;
  const angleStep = (Math.PI * 2) / NUM.TWENTYTWO;
  const radiusStep = 1 / NUM.THIRTYTHREE;

  const points = [];
  for (let i = 0; i <= totalSteps; i += 1) {
    const angle = i * angleStep;
    const radius = baseRadius * Math.pow(phi, i * radiusStep);
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    points.push({ x, y });
  }
  return points;
}

/* Layer 4: Double-helix lattice
   Two sine-like strands phase-shifted by pi, sampled 144 times. Calm crossbars
   every seventh sample hold the lattice together without motion. */
function drawHelixLattice(ctx, width, height, primaryColor, secondaryColor, NUM) {
  ctx.save();
  const amplitude = width / NUM.THIRTYTHREE;
  const verticalMargin = height / NUM.ELEVEN;
  const usableHeight = height - verticalMargin * 2;
  const steps = NUM.ONEFORTYFOUR;
  const angleSpan = Math.PI * NUM.THREE;

  const strandA = [];
  const strandB = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = angleSpan * t;
    const y = verticalMargin + usableHeight * t;
    const xA = width / 2 + Math.sin(angle) * amplitude;
    const xB = width / 2 + Math.sin(angle + Math.PI) * amplitude;
    strandA.push({ x: xA, y });
    strandB.push({ x: xB, y });
  }

  drawStrand(ctx, strandA, primaryColor);
  drawStrand(ctx, strandB, secondaryColor);
  drawCrossbars(ctx, strandA, strandB, secondaryColor, NUM);

  ctx.restore();
}

function drawStrand(ctx, points, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;
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

function drawCrossbars(ctx, strandA, strandB, color, NUM) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;

  const step = NUM.SEVEN;
  const limit = Math.min(strandA.length, strandB.length);
  for (let i = 0; i < limit; i += step) {
    const a = strandA[i];
    const b = strandB[i];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCircle(ctx, cx, cy, radius) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}
