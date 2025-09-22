/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)
    3) Fibonacci curve (golden spiral polyline; static)
    4) Double-helix lattice (two phase-shifted strands)

  Why: respects Cosmic Helix brief with calm palette, no motion, and offline-only dependencies.
*/

const FALLBACK_PALETTE = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"]
};

export function renderHelix(ctx, options) {
  const { width, height, NUM, fallbackNotice } = options;
  const palette = normalizePalette(options.palette);

  ctx.save();
  clearCanvas(ctx, width, height, palette.bg);

  drawVesicaField(ctx, { width, height }, palette, NUM);
  drawTreeOfLife(ctx, { width, height }, palette, NUM);
  drawFibonacciCurve(ctx, { width, height }, palette, NUM);
  drawHelixLattice(ctx, { width, height }, palette, NUM);

  if (fallbackNotice) {
    drawFallbackNotice(ctx, { width, height }, palette, fallbackNotice);
  }
  ctx.restore();
}

function normalizePalette(raw) {
  /* Why: guarantees ND-safe fallback even when palette data is missing or partial. */
  const candidate = raw || FALLBACK_PALETTE;
  const layers = Array.isArray(candidate.layers) && candidate.layers.length > 0
    ? candidate.layers
    : FALLBACK_PALETTE.layers;
  return {
    bg: candidate.bg || FALLBACK_PALETTE.bg,
    ink: candidate.ink || FALLBACK_PALETTE.ink,
    layers
  };
}

function pickLayerColor(palette, index) {
  /* Why: loops palette gracefully to keep harmonious layering. */
  return palette.layers[index % palette.layers.length];
}

function clearCanvas(ctx, width, height, color) {
  /* Why: establishes calm background before layering sacred geometry. */
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

function drawVesicaField(ctx, dims, palette, NUM) {
  /* Why: Vesica Piscis grid builds foundational harmony for the remaining layers. */
  const { width, height } = dims;
  const columnCount = NUM.ELEVEN;
  const rowCount = NUM.SEVEN; // seven vesica bands reinforce layered harmony
  const spacingX = width / (columnCount - 1);
  const spacingY = height / (rowCount + 2);
  const radius = Math.min(spacingX, spacingY) * (NUM.ELEVEN / NUM.TWENTYTWO);
  const color = pickLayerColor(palette, 0);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = radius / NUM.ELEVEN;
  ctx.globalAlpha = 0.28;

  for (let row = 0; row < rowCount; row += 1) {
    const offset = (row % 2 === 0) ? 0 : spacingX / 2;
    const cy = spacingY * (row + 1.5);
    for (let col = 0; col < columnCount; col += 1) {
      const cx = col * spacingX + offset;
      if (cx < -radius || cx > width + radius) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTreeOfLife(ctx, dims, palette, NUM) {
  /* Why: Tree-of-Life anchors narrative structure with balanced vertical rhythm. */
  const { width, height } = dims;
  const marginTop = height / NUM.NINE;
  const columnOffset = width / NUM.THREE;
  const centerX = width / 2;

  const nodes = [
    { x: centerX, y: marginTop * 0.5 },
    { x: centerX + columnOffset / 2, y: marginTop * 1.6 },
    { x: centerX - columnOffset / 2, y: marginTop * 1.6 },
    { x: centerX + columnOffset / 2, y: marginTop * 3 },
    { x: centerX - columnOffset / 2, y: marginTop * 3 },
    { x: centerX, y: marginTop * 4.2 },
    { x: centerX + columnOffset / 2, y: marginTop * 5.6 },
    { x: centerX - columnOffset / 2, y: marginTop * 5.6 },
    { x: centerX, y: marginTop * 7 },
    { x: centerX, y: marginTop * 8.4 }
  ];

  const paths = [
    [0, 1], [0, 2], [1, 2],
    [1, 3], [2, 4], [3, 4],
    [3, 5], [4, 5], [3, 6],
    [4, 7], [5, 6], [5, 7],
    [6, 7], [6, 8], [7, 8],
    [5, 8], [8, 9], [0, 5],
    [1, 5], [2, 5], [3, 8],
    [4, 8]
  ];

  if (paths.length !== NUM.TWENTYTWO) {
    throw new Error("Tree-of-Life path count must match 22 letters");
  }

  const pathColor = pickLayerColor(palette, 1);
  const nodeColor = pickLayerColor(palette, 2);

  ctx.save();
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = width / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  for (const [fromIndex, toIndex] of paths) {
    const from = nodes[fromIndex];
    const to = nodes[toIndex];
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = nodeColor;
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = width / NUM.NINETYNINE;
  const radius = width / NUM.ONEFORTYFOUR * NUM.THREE / NUM.ELEVEN;
  for (const node of nodes) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawFibonacciCurve(ctx, dims, palette, NUM) {
  /* Why: Fibonacci spiral guides growth without animation, respecting ND-safe calm focus. */
  const { width, height } = dims;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const fibCount = NUM.NINE;
  const fib = fibonacciSequence(fibCount);
  const baseScale = Math.min(width, height) / NUM.ONEFORTYFOUR * NUM.THIRTYTHREE / fib[fib.length - 1];
  const center = {
    x: width / NUM.THREE,
    y: height - height / NUM.NINE
  };
  const steps = NUM.TWENTYTWO;
  const startTheta = Math.PI / NUM.THREE;
  const endTheta = startTheta + Math.PI * NUM.THREE;
  const growth = Math.log(goldenRatio) / (Math.PI / 2);
  const color = pickLayerColor(palette, 3);

  const points = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const theta = startTheta + (endTheta - startTheta) * t;
    const radius = baseScale * Math.exp(growth * theta);
    const x = center.x + Math.cos(theta) * radius;
    const y = center.y + Math.sin(theta) * radius;
    points.push({ x, y });
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width / NUM.NINETYNINE;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function fibonacciSequence(count) {
  const seq = [1, 1];
  while (seq.length < count) {
    const next = seq[seq.length - 1] + seq[seq.length - 2];
    seq.push(next);
  }
  return seq;
}

function drawHelixLattice(ctx, dims, palette, NUM) {
  /* Why: double helix gives layered depth using two static strands and gentle crossbars. */
  const { width, height } = dims;
  const margin = height / NUM.NINE;
  const strandHeight = height - margin * 2;
  const amplitude = width / NUM.SEVEN;
  const segments = NUM.TWENTYTWO;
  const strandColorA = pickLayerColor(palette, 4);
  const strandColorB = pickLayerColor(palette, 5);

  const leftPoints = [];
  const rightPoints = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const theta = Math.PI * NUM.THREE * t;
    const y = margin + strandHeight * (1 - t);
    const phase = Math.sin(theta);
    const xLeft = width / 2 - amplitude / 2 + phase * amplitude / NUM.THREE;
    const xRight = width / 2 + amplitude / 2 + Math.sin(theta + Math.PI) * amplitude / NUM.THREE;
    leftPoints.push({ x: xLeft, y });
    rightPoints.push({ x: xRight, y });
  }

  ctx.save();
  ctx.lineWidth = width / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = strandColorA;
  strokePolyline(ctx, leftPoints);
  ctx.strokeStyle = strandColorB;
  strokePolyline(ctx, rightPoints);

  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = palette.ink;
  const crossbarInterval = Math.max(1, Math.round(segments / NUM.ELEVEN));
  for (let i = 0; i <= segments; i += crossbarInterval) {
    const left = leftPoints[i];
    const right = rightPoints[i];
    if (!left || !right) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }
  ctx.restore();
}

function strokePolyline(ctx, points) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.stroke();
}

function drawFallbackNotice(ctx, dims, palette, message) {
  /* Why: inline notice affirms safe fallback without relying on DOM overlays. */
  const { width } = dims;
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = palette.ink;
  ctx.font = "14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(message, width - 24, 32);
  ctx.restore();
}
