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

function normalizePalette(palette) {
  const layers = Array.isArray(palette?.layers) && palette.layers.length > 0
    ? palette.layers
    : ["#9fb8ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"];
  return {
    bg: palette?.bg || "#0b0b12",
    ink: palette?.ink || "#e8e8f0",
    layers
  };
}

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
  }
  ctx.stroke();
  ctx.restore();
}

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

function drawCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPolyline(ctx, points) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}
