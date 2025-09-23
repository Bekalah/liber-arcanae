/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)
    3) Fibonacci curve (log spiral polyline; static)
    4) Double-helix lattice (two phase-shifted braids + crossbars)

  All drawing routines are pure functions that accept explicit parameters, so the
  geometry stays predictable and offline friendly.
*/

/**
 * @typedef {Object} RenderOptions
 * @property {number} width
 * @property {number} height
 * @property {{ bg:string, ink:string, layers:string[] }} palette
 * @property {{ THREE:number, SEVEN:number, NINE:number, ELEVEN:number, TWENTYTWO:number, THIRTYTHREE:number, NINETYNINE:number, ONEFORTYFOUR:number }} NUM
 * @property {string|null} [notice]
 */

/**
 * Render the complete helix composition.
 * @param {CanvasRenderingContext2D} ctx
 * @param {RenderOptions} options
 */
export function renderHelix(ctx, options) {
  const { width, height, palette, NUM, notice = null } = options;
  const layerColors = normalizeLayers(palette.layers);

  clearCanvas(ctx, palette.bg, width, height);
  drawVesicaField(ctx, { width, height, stroke: layerColors[0], NUM });
  drawTreeOfLife(ctx, {
    width,
    height,
    nodeFill: layerColors[2],
    pathStroke: layerColors[1],
    textColor: palette.ink,
    NUM,
  });
  drawFibonacciCurve(ctx, { width, height, stroke: layerColors[3], NUM });
  drawDoubleHelix(ctx, { width, height, strokeA: layerColors[4], strokeB: layerColors[5], NUM });
  if (notice) {
    drawNotice(ctx, { width, palette, message: notice, NUM });
  }
}

function normalizeLayers(colors) {
  const fallback = ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"];
  const safe = Array.isArray(colors) ? colors.slice(0, 6) : [];
  while (safe.length < 6) {
    safe.push(fallback[safe.length]);
  }
  return safe;
}

function clearCanvas(ctx, color, width, height) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawVesicaField(ctx, { width, height, stroke, NUM }) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.globalAlpha = NUM.THIRTYTHREE / (NUM.SEVEN * NUM.ELEVEN); // Soft overlay derived from 33/(7*11) to stay gentle.
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) / NUM.THREE;
  const horizontalStep = (baseRadius / NUM.SEVEN) * NUM.THREE;
  const verticalStep = (baseRadius / NUM.NINE) * 2.2;

  const columns = [-1, 0, 1];
  const rows = [-3, -2, -1, 0, 1, 2, 3]; // Seven rows echo the seven levels.

  columns.forEach((col) => {
    rows.forEach((row) => {
      const cx = centerX + col * horizontalStep;
      const cy = centerY + row * verticalStep;
      drawCircle(ctx, cx, cy, baseRadius);
    });
  });

  ctx.restore();
}

function drawCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTreeOfLife(ctx, { width, height, nodeFill, pathStroke, textColor, NUM }) {
  ctx.save();
  const top = height * 0.18;
  const bottom = height * 0.82;
  const centerX = width * 0.5;
  const columnOffset = width / NUM.THREE / 2.4;
  const rowStep = (bottom - top) / 3.5;

  const nodes = [
    { name: "1", x: centerX, y: top },
    { name: "2", x: centerX + columnOffset, y: top + rowStep * 0.9 },
    { name: "3", x: centerX - columnOffset, y: top + rowStep * 0.9 },
    { name: "4", x: centerX + columnOffset * 1.4, y: top + rowStep * 2 },
    { name: "5", x: centerX - columnOffset * 1.4, y: top + rowStep * 2 },
    { name: "6", x: centerX, y: top + rowStep * 2.8 },
    { name: "7", x: centerX - columnOffset, y: top + rowStep * 3.6 },
    { name: "8", x: centerX + columnOffset, y: top + rowStep * 3.6 },
    { name: "9", x: centerX, y: bottom - rowStep * 0.6 },
    { name: "10", x: centerX, y: bottom },
  ];

  const paths = [
    [0, 1], [0, 2], [1, 3], [1, 5], [2, 4], [2, 5], [3, 5], [3, 7], [4, 5], [4, 6],
    [5, 6], [5, 7], [5, 8], [6, 9], [7, 9], [8, 9], [9, 10], [7, 8], [1, 4], [2, 3], [3, 6], [4, 6],
  ];

  ctx.strokeStyle = pathStroke;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;

  paths.forEach(([start, end]) => {
    const a = nodes[start];
    const b = nodes[end];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  ctx.fillStyle = nodeFill;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 1;

  const nodeRadius = Math.max(NUM.ELEVEN, Math.min(width, height) / NUM.TWENTYTWO);
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = textColor;
  const fontSize = Math.round(NUM.ONEFORTYFOUR / NUM.NINE); // 144/9 anchors the label scale at 16px.
  ctx.font = `${fontSize}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  nodes.forEach((node) => {
    ctx.fillText(node.name, node.x, node.y);
  });

  ctx.restore();
}

function drawFibonacciCurve(ctx, { width, height, stroke, NUM }) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.78;

  const phi = (1 + Math.sqrt(5)) / 2; // Fibonacci growth rate.
  const centerX = width * 0.72;
  const centerY = height * 0.58;
  const baseRadius = Math.min(width, height) / NUM.ELEVEN;
  const steps = Math.floor(NUM.NINETYNINE / NUM.ELEVEN); // 99/11 = 9 segments keep the spiral grounded.

  const points = createSpiralPoints({ steps, baseRadius, phi, centerX, centerY, NUM });

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

function createSpiralPoints({ steps, baseRadius, phi, centerX, centerY, NUM }) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const theta = (Math.PI / NUM.THREE) * i; // 60 degree increments keep the motion static and predictable.
    const radius = baseRadius * Math.pow(phi, i / NUM.SEVEN);
    points.push({
      x: centerX + Math.cos(theta) * radius,
      y: centerY + Math.sin(theta) * radius,
    });
  }
  return points;
}

function drawDoubleHelix(ctx, { width, height, strokeA, strokeB, NUM }) {
  ctx.save();
  const top = height * 0.12;
  const bottom = height * 0.88;
  const centerX = width * 0.32;
  const amplitude = width / NUM.THREE / 2.2;
  const strands = NUM.THIRTYTHREE; // 33 to echo the spine.

  const strandA = createHelixPoints({ top, bottom, centerX, amplitude, strands, phase: 0, NUM });
  const strandB = createHelixPoints({ top, bottom, centerX, amplitude, strands, phase: Math.PI, NUM });

  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.9;
  drawPolyline(ctx, strandA, strokeA);
  drawPolyline(ctx, strandB, strokeB);

  const latticeLines = NUM.ELEVEN;
  for (let i = 0; i <= latticeLines; i += 1) {
    const t = i / latticeLines;
    const nodeA = strandA[Math.floor(t * (strandA.length - 1))];
    const nodeB = strandB[Math.floor(t * (strandB.length - 1))];
    ctx.strokeStyle = blendColors(strokeA, strokeB, 0.5);
    ctx.globalAlpha = NUM.THIRTYTHREE / NUM.NINETYNINE; // Crossbars hold at one third opacity to keep depth gentle.
    ctx.beginPath();
    ctx.moveTo(nodeA.x, nodeA.y);
    ctx.lineTo(nodeB.x, nodeB.y);
    ctx.stroke();
  }

  ctx.restore();
}

function createHelixPoints({ top, bottom, centerX, amplitude, strands, phase, NUM }) {
  const points = [];
  for (let i = 0; i <= strands; i += 1) {
    const t = i / strands;
    const y = top + (bottom - top) * t;
    const angle = t * Math.PI * (NUM.NINE / NUM.THREE) + phase; // Three full waves stay static.
    const x = centerX + Math.sin(angle) * amplitude;
    points.push({ x, y });
  }
  return points;
}

function drawPolyline(ctx, points, strokeStyle) {
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
}

function blendColors(colorA, colorB, ratio) {
  const parse = (hex) => {
    const value = hex.replace("#", "");
    const chunk = value.length === 3 ? value.split("").map((c) => c + c) : value.match(/.{1,2}/g);
    if (!chunk) return [255, 255, 255];
    return chunk.map((segment) => parseInt(segment, 16));
  };
  const [r1, g1, b1] = parse(colorA);
  const [r2, g2, b2] = parse(colorB);
  const mix = (a, b) => Math.round(a + (b - a) * ratio);
  return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;
}

function drawNotice(ctx, { width, palette, message, NUM }) {
  ctx.save();
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = NUM.NINE / NUM.ONEFORTYFOUR; // 9/144 keeps the notice subtle.
  const fontSize = Math.round(NUM.ONEFORTYFOUR / NUM.NINE);
  ctx.font = `${fontSize}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(message, width / 2, fontSize);
  ctx.restore();
}
