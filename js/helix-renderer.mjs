/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers (rendered back-to-front):
    1) Vesica field (intersecting circles grid)
    2) Tree-of-Life scaffold (10 sephirot + 22 connecting paths)
    3) Fibonacci curve (logarithmic spiral approximation)
    4) Double-helix lattice (static braided lattice)

  Design notes:
    - No animation or timers; the canvas is redrawn once per load.
    - Calm palette with soft contrast; values may be overridden by palette.json.
    - Geometry uses numerology constants passed through NUM to maintain lore links.
*/

export function renderHelix(ctx, config) {
  const { width, height, palette, NUM } = config;
  const layers = Array.isArray(palette?.layers) ? palette.layers : [];

  clearCanvas(ctx, width, height, palette?.bg || "#0b0b12");

  drawVesicaField(ctx, { width, height, color: layers[0] || "#6f93ff", NUM });
  drawTreeOfLife(ctx, {
    width,
    height,
    nodeColor: layers[1] || "#89f7fe",
    pathColor: layers[5] || "#d0d0e6",
    NUM
  });
  drawFibonacciCurve(ctx, {
    width,
    height,
    color: layers[2] || "#a0ffa1",
    NUM
  });
  drawHelixLattice(ctx, {
    width,
    height,
    primary: layers[3] || "#ffd27f",
    secondary: layers[4] || "#f5a3ff",
    NUM
  });

  drawFrame(ctx, width, height, palette?.ink || "#e8e8f0");
}

function clearCanvas(ctx, width, height, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawVesicaField(ctx, { width, height, color, NUM }) {
  /* Vesica field: layered intersecting circles evoking layered geometry.
     ND-safe choice: gentle opacity to avoid harsh contrast and visual strain. */
  const radius = Math.min(width, height) / NUM.THREE;
  const centerY = height / 2;
  const columns = NUM.SEVEN; // numerology anchor
  const spacing = width / (columns + 1);

  ctx.save();
  ctx.strokeStyle = withAlpha(color, 0.35);
  ctx.lineWidth = 2;

  for (let i = 1; i <= columns; i += 1) {
    const cx = spacing * i;
    // Draw two overlapping circles to imply vesica piscis structure.
    ctx.beginPath();
    ctx.arc(cx - radius / 2, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + radius / 2, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTreeOfLife(ctx, { width, height, nodeColor, pathColor, NUM }) {
  /* Tree-of-Life scaffold: simplified 10-node + 22-path representation.
     ND-safe choice: rounded nodes, soft glow via semi-transparent fill. */
  const paddingY = height / NUM.NINE;
  const nodeRadius = Math.min(width, height) / NUM.ONEFORTYFOUR * 5;
  const levels = 4; // traditional levels within Tree-of-Life
  const verticalSpacing = (height - paddingY * 2) / (levels - 1);

  const columns = [0.5, 0.25, 0.75, 0.5];
  const nodes = [];
  for (let level = 0; level < levels; level += 1) {
    const y = paddingY + level * verticalSpacing;
    const density = level === 1 || level === 2 ? 3 : 1;
    for (let i = 0; i < density; i += 1) {
      const colIndex = density === 1 ? 0 : i + 1;
      const ratio = columns[colIndex];
      const x = width * ratio;
      nodes.push({ x, y });
    }
  }

  const paths = buildTreePaths(nodes);

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = withAlpha(pathColor, 0.4);
  ctx.lineJoin = "round";
  paths.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(nodes[a].x, nodes[a].y);
    ctx.lineTo(nodes[b].x, nodes[b].y);
    ctx.stroke();
  });

  nodes.forEach((node, index) => {
    ctx.beginPath();
    const glow = index === 0 ? 0.55 : 0.4;
    ctx.fillStyle = withAlpha(nodeColor, glow);
    ctx.arc(node.x, node.y, nodeRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = withAlpha(nodeColor, 0.9);
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function buildTreePaths(nodes) {
  /* Build 22 simplified connections. Indices correspond to order of node creation. */
  const links = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5],
    [3, 6], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8],
    [8, 9], [3, 4], [4, 5], [6, 7],
    [1, 5], [2, 3], [0, 4], [0, 5], [1, 2], [7, 9]
  ];
  return links;
}

function drawFibonacciCurve(ctx, { width, height, color, NUM }) {
  /* Fibonacci curve: logarithmic spiral approximated with short line segments.
     ND-safe choice: smooth bezier-style polyline; no motion. */
  const center = { x: width * 0.5, y: height * 0.6 };
  const segments = NUM.TWENTYTWO;
  const baseRadius = Math.min(width, height) / NUM.THREE;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (Math.PI / NUM.NINE) * i;
    const radius = baseRadius * Math.pow(goldenRatio, i / segments);
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y - Math.sin(angle) * radius;
    points.push({ x, y });
  }

  ctx.save();
  ctx.strokeStyle = withAlpha(color, 0.85);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((pt, idx) => {
    if (idx === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  });
  ctx.stroke();
  ctx.restore();
}

function drawHelixLattice(ctx, { width, height, primary, secondary, NUM }) {
  /* Double-helix lattice: two interwoven strands connected by rungs.
     ND-safe choice: static, evenly spaced structure with soft opacity. */
  const strandCount = 2;
  const rungCount = NUM.THIRTYTHREE;
  const marginX = width * 0.2;
  const top = height * 0.2;
  const bottom = height * 0.85;

  const strandRadius = (width - marginX * 2) / 6;

  const strands = [];
  for (let s = 0; s < strandCount; s += 1) {
    const phase = (Math.PI * s) / strandCount;
    const points = [];
    for (let i = 0; i <= rungCount; i += 1) {
      const t = i / rungCount;
      const y = top + (bottom - top) * t;
      const angle = NUM.NINETYNINE / NUM.ONEFORTYFOUR * Math.PI * t + phase;
      const x = width / 2 + Math.sin(angle) * strandRadius;
      points.push({ x, y });
    }
    strands.push(points);
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 2.5;

  strands.forEach((points, index) => {
    ctx.beginPath();
    ctx.strokeStyle = withAlpha(index === 0 ? primary : secondary, 0.9);
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
  });

  ctx.strokeStyle = withAlpha(secondary, 0.35);
  for (let i = 0; i <= rungCount; i += 1) {
    const a = strands[0][i];
    const b = strands[1][i];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFrame(ctx, width, height, color) {
  /* Frame keeps composition grounded; subtle border to reduce edge glare. */
  ctx.save();
  ctx.strokeStyle = withAlpha(color, 0.4);
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, width - 24, height - 24);
  ctx.restore();
}

function withAlpha(hex, alpha) {
  const ctxColor = parseHex(hex);
  return `rgba(${ctxColor.r}, ${ctxColor.g}, ${ctxColor.b}, ${clamp(alpha, 0, 1)})`;
}

function parseHex(hex) {
  const value = hex?.replace(/[^0-9a-f]/gi, "");
  if (!value || (value.length !== 3 && value.length !== 6)) {
    return { r: 255, g: 255, b: 255 };
  }
  const chunk = value.length === 3
    ? value.split("").map((ch) => ch + ch)
    : value.match(/.{2}/g);
  const [r, g, b] = chunk.map((part) => parseInt(part, 16));
  return { r, g, b };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
