/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers rendered (in order):
    1) Vesica field — calm intersecting circles grounding the scene.
    2) Tree-of-Life scaffold — ten nodes with twenty-two paths.
    3) Fibonacci curve — static logarithmic spiral honoring natural growth.
    4) Double-helix lattice — two braided strands with gentle crossbars.

  All helpers are pure and deterministic; no animation or external libs.
*/

export function renderHelix(ctx, options) {
  if (!ctx) return;

  const { width, height, palette, NUM } = normalizeOptions(options);
  const layers = Array.isArray(palette.layers) && palette.layers.length > 0
    ? palette.layers.slice()
    : [palette.ink, palette.ink, palette.ink, palette.ink, palette.ink, palette.ink];

  ctx.save();
  drawBackground(ctx, palette.bg, width, height);
  drawVesicaField(ctx, width, height, layers[0] || palette.ink, NUM);
  drawTreeOfLife(ctx, width, height, { path: layers[1] || palette.ink, node: palette.ink }, NUM);
  drawFibonacciCurve(ctx, width, height, layers[2] || palette.ink, NUM);
  drawHelixLattice(ctx, width, height, { strand: layers[3] || palette.ink, cross: layers[4] || palette.ink }, NUM);
  drawFrame(ctx, width, height, layers[5] || palette.ink);
  ctx.restore();
}

function normalizeOptions(options) {
  const fallbackNUM = { THREE:3, SEVEN:7, NINE:9, ELEVEN:11, TWENTYTWO:22, THIRTYTHREE:33, NINETYNINE:99, ONEFORTYFOUR:144 };
  const opts = options || {};
  return {
    width: typeof opts.width === "number" ? opts.width : 1440,
    height: typeof opts.height === "number" ? opts.height : 900,
    palette: coercePalette(opts.palette),
    NUM: Object.assign({}, fallbackNUM, opts.NUM || {})
  };
}

function coercePalette(palette) {
  if (!palette) {
    return { bg:"#0b0b12", ink:"#e8e8f0", layers:["#b1c7ff","#89f7fe","#a0ffa1","#ffd27f","#f5a3ff","#d0d0e6"] };
  }
  return {
    bg: palette.bg || "#0b0b12",
    ink: palette.ink || "#e8e8f0",
    layers: Array.isArray(palette.layers) ? palette.layers : []
  };
}

function drawBackground(ctx, color, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

// Layer 1 — Vesica field honoring triadic and heptadic rhythm.
function drawVesicaField(ctx, width, height, color, NUM) {
  const rows = NUM.THREE;
  const cols = NUM.SEVEN;
  const marginX = width / NUM.ELEVEN;
  const marginY = height / NUM.NINE;
  const usableWidth = width - marginX * 2;
  const usableHeight = height - marginY * 2;
  const stepX = usableWidth / (cols - 1);
  const stepY = usableHeight / (rows - 1);
  const radius = Math.min(stepX, stepY) * (NUM.NINE / NUM.ELEVEN);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.34;
  ctx.lineWidth = Math.max(width, height) / NUM.NINETYNINE;

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

// Layer 2 — Tree-of-Life scaffold with explicit numerology in spacing.
function drawTreeOfLife(ctx, width, height, palette, NUM) {
  const nodes = createTreeNodes(width, height, NUM);
  const paths = createTreePaths();
  const radius = Math.min(width, height) / NUM.NINETYNINE;

  ctx.save();
  ctx.strokeStyle = palette.path;
  ctx.lineWidth = Math.max(width, height) / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.52;

  paths.forEach(([a, b]) => {
    const start = nodes[a];
    const end = nodes[b];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  ctx.fillStyle = palette.node;
  ctx.globalAlpha = 0.9;
  nodes.forEach(node => {
    drawFilledCircle(ctx, node.x, node.y, radius * 1.5);
  });

  ctx.restore();
}

function createTreeNodes(width, height, NUM) {
  const topMargin = height / NUM.NINE;
  const verticalSpacing = (height - topMargin * 2) / NUM.TWENTYTWO * NUM.THREE;
  const centerX = width / 2;
  const horizontalShift = width / NUM.ELEVEN;

  return [
    { x: centerX, y: topMargin },
    { x: centerX + horizontalShift, y: topMargin + verticalSpacing },
    { x: centerX - horizontalShift, y: topMargin + verticalSpacing },
    { x: centerX + horizontalShift * 1.2, y: topMargin + verticalSpacing * 3 },
    { x: centerX - horizontalShift * 1.2, y: topMargin + verticalSpacing * 3 },
    { x: centerX, y: topMargin + verticalSpacing * 4.5 },
    { x: centerX + horizontalShift * 1.4, y: topMargin + verticalSpacing * 6 },
    { x: centerX - horizontalShift * 1.4, y: topMargin + verticalSpacing * 6 },
    { x: centerX, y: topMargin + verticalSpacing * 7.5 },
    { x: centerX, y: topMargin + verticalSpacing * 9 }
  ];
}

function createTreePaths() {
  return [
    [0,1],[0,2],[1,2],
    [1,3],[2,4],[3,4],
    [3,5],[4,5],[3,6],[4,7],
    [5,6],[5,7],[6,8],[7,8],
    [8,9],[6,9],[7,9],
    [1,5],[2,5],[1,6],[2,7],[5,8]
  ];
}

// Layer 3 — Fibonacci logarithmic spiral, sampled across 144 steps for calm detail.
function drawFibonacciCurve(ctx, width, height, color, NUM) {
  const points = createSpiralPoints(width, height, NUM);
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = Math.max(width, height) / NUM.ONEFORTYFOUR * 1.5;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function createSpiralPoints(width, height, NUM) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const steps = NUM.ONEFORTYFOUR;
  const center = { x: width / NUM.THREE, y: height - height / NUM.ELEVEN };
  const baseRadius = Math.min(width, height) / NUM.ELEVEN;
  const angleStep = (Math.PI * 2 * NUM.NINE) / steps;

  const points = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = i * angleStep;
    const radius = baseRadius * Math.pow(phi, i / NUM.TWENTYTWO);
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y - Math.sin(angle) * radius;
    if (x > 0 && x < width && y > 0 && y < height) {
      points.push({ x, y });
    }
  }
  return points;
}

// Layer 4 — Static double helix with crossbars to suggest lattice without motion.
function drawHelixLattice(ctx, width, height, palette, NUM) {
  const segments = NUM.THIRTYTHREE;
  const amplitude = width / NUM.ELEVEN;
  const centerX = width * 0.65;
  const topY = height / NUM.NINE;
  const bottomY = height - height / NUM.NINE;
  const stepY = (bottomY - topY) / segments;
  const phaseShift = Math.PI / NUM.THREE;

  const strandA = [];
  const strandB = [];

  for (let i = 0; i <= segments; i += 1) {
    const y = topY + i * stepY;
    const angle = (Math.PI * 2 * i) / NUM.NINE;
    strandA.push({ x: centerX + Math.sin(angle) * amplitude, y });
    strandB.push({ x: centerX + Math.sin(angle + phaseShift) * amplitude, y });
  }

  ctx.save();
  ctx.strokeStyle = palette.strand;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(width, height) / NUM.ONEFORTYFOUR;
  drawPolyline(ctx, strandA);
  drawPolyline(ctx, strandB);

  ctx.strokeStyle = palette.cross;
  ctx.globalAlpha = 0.35;
  const crossCount = NUM.TWENTYTWO;
  for (let i = 0; i < crossCount; i += 1) {
    const index = Math.floor((i / (crossCount - 1)) * segments);
    const a = strandA[index];
    const b = strandB[index];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFrame(ctx, width, height, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, width - 24, height - 24);
  ctx.restore();
}

function drawCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFilledCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPolyline(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}
