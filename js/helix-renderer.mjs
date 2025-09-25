/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.
  Layers:
    1) Vesica field (intersecting circles) to honor triadic emergence.
    2) Tree-of-Life scaffold (ten sephirot with twenty-two paths).
    3) Fibonacci curve (logarithmic spiral sampled across 144 steps).
    4) Double-helix lattice (two calm strands with gentle crossbars).
  All routines are pure and deterministic, avoiding motion and flashes.
*/

export function renderHelix(ctx, options) {
  const { width, height, palette, NUM } = options;
  const layers = Array.isArray(palette.layers) ? palette.layers : [];
  const colors = [
    layers[0] || palette.ink,
    layers[1] || palette.ink,
    layers[2] || palette.ink,
    layers[3] || palette.ink,
    layers[4] || palette.ink,
    layers[5] || palette.ink
  ];

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  drawVesicaField(ctx, width, height, colors[0], NUM);
  drawTreeOfLife(ctx, width, height, { path: colors[1], node: colors[2] }, NUM);
  drawFibonacciCurve(ctx, width, height, colors[3], NUM);
  drawHelixLattice(ctx, width, height, { strand: colors[4], cross: colors[5] }, NUM);

  ctx.restore();
}

function drawVesicaField(ctx, width, height, color, NUM) {
  /* Layer 1: calm vesica piscis grid referencing numbers 3, 7, and 9. */
  const radius = Math.min(width, height) / (NUM.THREE + NUM.SEVEN / NUM.NINE);
  const cx = width / 2;
  const cy = height / 2;
  const horizontalStep = radius / NUM.THREE;
  const verticalStep = radius / NUM.SEVEN * 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;

  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      const x = cx + col * horizontalStep * NUM.NINE;
      const y = cy + row * verticalStep;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Central vesica lens formed by two circles offset by sacred ratio 3:3.
  ctx.beginPath();
  ctx.arc(cx - radius / NUM.THREE, cy, radius * (NUM.NINE / NUM.SEVEN), 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + radius / NUM.THREE, cy, radius * (NUM.NINE / NUM.SEVEN), 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawTreeOfLife(ctx, width, height, colors, NUM) {
  /* Layer 2: Tree-of-Life nodes and paths, respecting 10 nodes and 22 links. */
  const marginY = height / NUM.NINE;
  const usableHeight = height - marginY * 2;
  const levelCount = 5; // Sephirot arranged in five vertical bands.
  const levelGap = usableHeight / (levelCount - 1);
  const midX = width / 2;
  const horizontalGap = width / NUM.ELEVEN;

  const nodes = [
    { id: 0, x: midX, y: marginY },
    { id: 1, x: midX + horizontalGap, y: marginY + levelGap },
    { id: 2, x: midX - horizontalGap, y: marginY + levelGap },
    { id: 3, x: midX + horizontalGap * 1.3, y: marginY + levelGap * 2 },
    { id: 4, x: midX - horizontalGap * 1.3, y: marginY + levelGap * 2 },
    { id: 5, x: midX, y: marginY + levelGap * 2.5 },
    { id: 6, x: midX + horizontalGap * 1.6, y: marginY + levelGap * 3.4 },
    { id: 7, x: midX - horizontalGap * 1.6, y: marginY + levelGap * 3.4 },
    { id: 8, x: midX, y: marginY + levelGap * 4 },
    { id: 9, x: midX, y: marginY + levelGap * 4.7 }
  ];

  const edges = [
    [0, 1], [0, 2], [0, 5], // Crown to wisdom, understanding, beauty.
    [1, 2], // Polar twin bridge.
    [1, 3], [1, 5], [1, 6],
    [2, 4], [2, 5], [2, 7],
    [3, 4], [3, 5], [3, 6],
    [4, 5], [4, 7], [4, 8],
    [5, 6], [5, 7], [5, 8],
    [6, 8], [7, 8],
    [8, 9]
  ];

  // Ensure we track 22 distinct paths for the Hebrew letters correspondence.
  const pathCount = edges.length;
  if (pathCount !== NUM.TWENTYTWO) {
    console.warn("Tree-of-Life path count is", pathCount, "expected", NUM.TWENTYTWO);
  }

  ctx.save();
  ctx.strokeStyle = colors.path;
  ctx.fillStyle = colors.node;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;

  edges.forEach(([a, b]) => {
    const na = nodes[a];
    const nb = nodes[b];
    ctx.beginPath();
    ctx.moveTo(na.x, na.y);
    ctx.lineTo(nb.x, nb.y);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
  const nodeRadius = width / NUM.NINETYNINE * NUM.THREE;
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawFibonacciCurve(ctx, width, height, color, NUM) {
  /* Layer 3: static logarithmic spiral sampled across 144 steps. */
  const centerX = width * (NUM.NINE / NUM.ELEVEN);
  const centerY = height * (NUM.SEVEN / NUM.TWENTYTWO + 0.1);
  const steps = NUM.ONEFORTYFOUR;
  const turns = NUM.NINE / NUM.THREE; // Three turns to echo triadic harmony.
  const angleStep = (Math.PI * 2 * turns) / steps;
  const growth = Math.pow(NUM.TWENTYTWO / NUM.SEVEN, 1 / steps);
  let radius = Math.min(width, height) / NUM.NINETYNINE * NUM.NINE;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();

  let angle = 0;
  for (let i = 0; i <= steps; i += 1) {
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    angle += angleStep;
    radius *= growth;
  }

  ctx.stroke();
  ctx.restore();
}

function drawHelixLattice(ctx, width, height, colors, NUM) {
  /* Layer 4: twin strands sampled at 144 points with 33 crossbars. */
  const marginY = height / NUM.SEVEN;
  const usableHeight = height - marginY * 2;
  const amplitude = width / NUM.ELEVEN;
  const steps = NUM.ONEFORTYFOUR;
  const turns = NUM.NINE / NUM.THREE;
  const angleStep = (Math.PI * 2 * turns) / steps;
  const centerX = width / 2;

  const strandA = [];
  const strandB = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const y = marginY + usableHeight * t;
    const angle = angleStep * i;
    const offset = Math.sin(angle) * amplitude;
    strandA.push({ x: centerX - offset, y });
    strandB.push({ x: centerX + offset, y });
  }

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors.strand;
  ctx.globalAlpha = 0.9;

  drawPolyline(ctx, strandA);
  drawPolyline(ctx, strandB);

  ctx.strokeStyle = colors.cross;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  const crossbars = NUM.THIRTYTHREE;
  for (let i = 0; i <= crossbars; i += 1) {
    const idx = Math.round((i / crossbars) * steps);
    const a = strandA[idx];
    const b = strandB[idx];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPolyline(ctx, points) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    const pt = points[i];
    ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
}
