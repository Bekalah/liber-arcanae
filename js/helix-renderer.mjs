/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry. No animation, only calm lines.
  Each helper is pure and receives explicit values.
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

function fillBackground(ctx, color, stage) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, stage.width, stage.height);
  ctx.restore();
}

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

function drawNotice(ctx, stage, message, ink) {
  ctx.save();
  ctx.fillStyle = hexToRgba(ink, 0.7);
  ctx.font = "12px/18px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(message, stage.margin, stage.height - stage.margin / 2);
  ctx.restore();
}

function strokeCircle(ctx, center, radius) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function strokePolyline(ctx, points) {
  if (!points || points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

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
