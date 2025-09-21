/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)
    3) Fibonacci curve (log spiral polyline; static)
    4) Double-helix lattice (two phase-shifted strands with gentle cross-braces)

  The routines in this module remain pure: they accept configuration
  objects, avoid global state, and produce immediate draw calls. This
  keeps the logic easy to audit when sensory safety is paramount.
*/

const TAU = Math.PI * 2;
const PHI = (1 + Math.sqrt(5)) / 2;

const FALLBACK = {
  width: 1440,
  height: 900,
  palette: {
    bg: "#0b0b12",
    ink: "#e8e8f0",
    layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"]
  },
  NUM: { THREE: 3, SEVEN: 7, NINE: 9, ELEVEN: 11, TWENTYTWO: 22, THIRTYTHREE: 33, NINETYNINE: 99, ONEFORTYFOUR: 144 }
};

export function renderHelix(ctx, options) {
  const cfg = normalizeOptions(options);
  const { width, height } = cfg;

  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.save();

  clearCanvas(ctx, cfg);
  drawVesicaLayer(ctx, cfg);
  drawTreeOfLifeLayer(ctx, cfg);
  drawFibonacciLayer(ctx, cfg);
  drawHelixLayer(ctx, cfg);

  ctx.restore();
}

function normalizeOptions(options = {}) {
  const merged = {
    width: typeof options.width === "number" ? options.width : FALLBACK.width,
    height: typeof options.height === "number" ? options.height : FALLBACK.height,
    palette: mergePalette(options.palette || {}),
    NUM: { ...FALLBACK.NUM, ...(options.NUM || {}) },
    notice: typeof options.notice === "string" ? options.notice : ""
  };
  return merged;
}

function mergePalette(palette) {
  const layers = Array.isArray(palette.layers) && palette.layers.length >= 4 ? palette.layers.slice() : FALLBACK.palette.layers.slice();
  return {
    bg: palette.bg || FALLBACK.palette.bg,
    ink: palette.ink || FALLBACK.palette.ink,
    layers
  };
}

function clearCanvas(ctx, cfg) {
  ctx.fillStyle = cfg.palette.bg;
  ctx.fillRect(0, 0, cfg.width, cfg.height);
  ctx.fillStyle = cfg.palette.ink;
  ctx.font = "16px/1.4 system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Layer order: Vesica, Tree, Fibonacci, Helix", 16, 16);
  if (cfg.notice) {
    ctx.fillStyle = cfg.palette.layers[5] || cfg.palette.ink;
    ctx.fillText(cfg.notice, 16, 40);
  }
  // ND-safe note: static text communicates orientation without flashing.
}

function drawVesicaLayer(ctx, cfg) {
  const { width, height, palette, NUM } = cfg;
  const cols = NUM.NINE;
  const rows = NUM.SEVEN;
  const maxRadius = Math.min(width / (cols + 2), height / (rows + 2));
  const radius = maxRadius * 0.9;
  const stepX = (width - radius * 2) / (cols - 1);
  const stepY = (height - radius * 2) / (rows - 1);
  const overlap = radius * 0.6;

  ctx.save();
  ctx.strokeStyle = palette.layers[0];
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = radius * 0.08;

  for (let row = 0; row < rows; row += 1) {
    const y = radius + row * stepY;
    const offset = (row % 2 === 0 ? 0 : overlap);
    for (let col = 0; col < cols; col += 1) {
      const x = radius + col * stepX + offset;
      drawCircle(ctx, x % width, y, radius);
    }
  }

  ctx.restore();
  // ND-safe: gentle opacity keeps background supportive without glare.
}

function drawCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.stroke();
}

function drawTreeOfLifeLayer(ctx, cfg) {
  const { width, height, palette, NUM } = cfg;
  const layerColor = palette.layers[1];

  const marginX = width / NUM.ELEVEN;
  const top = height / NUM.NINE;
  const bottom = height - top;
  const columnSpacing = (width - marginX * 2) / 3;
  const rowSpacing = (bottom - top) / (NUM.SEVEN - 1);

  const nodes = buildTreeNodes(top, rowSpacing, marginX, columnSpacing, NUM);
  const paths = buildTreePaths(nodes);

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = layerColor;
  ctx.globalAlpha = 0.7;

  paths.forEach(path => {
    ctx.beginPath();
    ctx.moveTo(path.from.x, path.from.y);
    ctx.lineTo(path.to.x, path.to.y);
    ctx.stroke();
  });

  ctx.fillStyle = layerColor;
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, TAU);
    ctx.fill();
  });

  ctx.restore();
  // ND-safe: single-tone scaffolding avoids flicker; radius uses 22 for symbolism.
}

function buildTreeNodes(top, rowSpacing, marginX, columnSpacing, NUM) {
  const radius = rowSpacing / (NUM.TWENTYTWO / NUM.SEVEN);
  const rows = [
    [{ col: 1, level: 0 }],
    [{ col: 0, level: 1 }, { col: 2, level: 1 }],
    [{ col: 0, level: 2 }, { col: 1, level: 2 }, { col: 2, level: 2 }],
    [{ col: 0, level: 3 }, { col: 1, level: 3 }, { col: 2, level: 3 }],
    [{ col: 1, level: 4 }]
  ];

  const nodes = [];
  rows.forEach(group => {
    group.forEach(item => {
      const x = marginX + columnSpacing * item.col;
      const y = top + rowSpacing * item.level;
      nodes.push({ x, y, radius: radius / 2 });
    });
  });

  return nodes;
}

function buildTreePaths(nodes) {
  const connections = [
    [0, 1], [0, 2], [0, 4],
    [1, 2], [1, 3], [1, 4], [1, 6],
    [2, 4], [2, 5], [2, 8],
    [3, 4], [3, 5], [3, 6],
    [4, 5], [4, 6], [4, 7], [4, 8],
    [5, 8],
    [6, 7], [6, 8],
    [7, 8], [7, 9]
  ];
  return connections.map(([a, b]) => ({ from: nodes[a], to: nodes[b] }));
}

function drawFibonacciLayer(ctx, cfg) {
  const { width, height, palette, NUM } = cfg;
  const color = palette.layers[2];
  const center = { x: width * 0.7, y: height * 0.55 };
  const baseRadius = Math.min(width, height) / NUM.ELEVEN;
  const points = generateSpiralPoints(center, baseRadius, NUM);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6;

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
  // ND-safe: spiral drawn once, no animation; line width moderate for clarity.
}

function generateSpiralPoints(center, baseRadius, NUM) {
  const turns = NUM.THREE + (NUM.SEVEN / NUM.TWENTYTWO);
  const segments = NUM.ONEFORTYFOUR;
  const angleStep = (turns * TAU) / segments;
  const growth = Math.pow(PHI, 1 / NUM.ELEVEN);

  const points = [];
  let radius = baseRadius;
  let angle = -Math.PI / NUM.THREE;

  for (let i = 0; i <= segments; i += 1) {
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    points.push({ x, y });
    radius *= growth;
    angle += angleStep;
  }

  return points;
}

function drawHelixLayer(ctx, cfg) {
  const { width, height, palette, NUM } = cfg;
  const colorA = palette.layers[3];
  const colorB = palette.layers[4] || palette.layers[3];
  const latticeColor = palette.layers[5] || palette.layers[0];

  const amplitude = height / NUM.TWENTYTWO;
  const period = width / NUM.THIRTYTHREE;
  const segments = NUM.ONEFORTYFOUR;

  const strandA = buildHelixPoints(width, height, amplitude, period, 0, segments);
  const strandB = buildHelixPoints(width, height, amplitude, period, Math.PI, segments);

  ctx.save();
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.85;

  ctx.strokeStyle = latticeColor;
  drawLattice(ctx, strandA, strandB, NUM.THREE);

  ctx.strokeStyle = colorA;
  drawPolyline(ctx, strandA);

  ctx.strokeStyle = colorB;
  drawPolyline(ctx, strandB);

  ctx.restore();
  // ND-safe: helix is static, cross-braces evenly spaced to avoid clutter.
}

function buildHelixPoints(width, height, amplitude, period, phase, segments) {
  const points = [];
  const baseline = height / 2;
  const step = width / segments;

  for (let i = 0; i <= segments; i += 1) {
    const x = i * step;
    const y = baseline + Math.sin((x / period) + phase) * amplitude;
    points.push({ x, y });
  }

  return points;
}

function drawPolyline(ctx, points) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawLattice(ctx, strandA, strandB, skip) {
  const length = Math.min(strandA.length, strandB.length);
  for (let i = 0; i < length; i += skip) {
    ctx.beginPath();
    ctx.moveTo(strandA[i].x, strandA[i].y);
    ctx.lineTo(strandB[i].x, strandB[i].y);
    ctx.stroke();
  }
}
