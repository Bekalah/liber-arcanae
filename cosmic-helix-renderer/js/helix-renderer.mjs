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
 */

/**
 * Render the complete helix composition.
 * @param {CanvasRenderingContext2D} ctx
 * @param {RenderOptions} options
 */
export function renderHelix(ctx, options) {
  const { width, height, palette, NUM } = options;
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
  ctx.globalAlpha = NUM.THIRTYTHREE / NUM.NINETYNINE; // 33/99 keeps the vesica field gentle.
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) / (NUM.ONEFORTYFOUR / NUM.NINE);
  const horizontalStep = baseRadius * (NUM.ELEVEN / NUM.SEVEN);
  const verticalStep = baseRadius * (NUM.NINE / NUM.ELEVEN);

  const columns = [-1, 0, 1];
  const rows = [-3, -2, -1, 0, 1, 2, 3]; // Seven rows echoing the 7 heavens.

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
  const top = height * (NUM.ELEVEN / NUM.ONEFORTYFOUR);
  const bottom = height * (NUM.ONEFORTYFOUR - NUM.ELEVEN) / NUM.ONEFORTYFOUR;
  const centerX = width * 0.5;
  const columnOffset = width / (NUM.ONEFORTYFOUR / NUM.THIRTYTHREE);
  const rowStep = (bottom - top) / (NUM.NINE - NUM.THREE);

  const nodes = [
    { name: "1", x: centerX, y: top },
    { name: "2", x: centerX + columnOffset, y: top + rowStep * (NUM.NINE / NUM.SEVEN) },
    { name: "3", x: centerX - columnOffset, y: top + rowStep * (NUM.NINE / NUM.SEVEN) },
    { name: "4", x: centerX + columnOffset * (NUM.THIRTYTHREE / NUM.TWENTYTWO), y: top + rowStep * (NUM.THIRTYTHREE / NUM.TWENTYTWO) },
    { name: "5", x: centerX - columnOffset * (NUM.THIRTYTHREE / NUM.TWENTYTWO), y: top + rowStep * (NUM.THIRTYTHREE / NUM.TWENTYTWO) },
    { name: "6", x: centerX, y: top + rowStep * (NUM.TWENTYTWO / NUM.NINE) },
    { name: "7", x: centerX - columnOffset, y: top + rowStep * (NUM.NINE / NUM.THREE) },
    { name: "8", x: centerX + columnOffset, y: top + rowStep * (NUM.NINE / NUM.THREE) },
    { name: "9", x: centerX, y: bottom - rowStep * (NUM.NINE / NUM.TWENTYTWO) },
    { name: "10", x: centerX, y: bottom },
  ];

  const paths = [
    [0,1],[0,2],[1,3],[1,5],[2,4],[2,5],[3,5],[3,7],[4,5],[4,6],
    [5,6],[5,7],[5,8],[6,9],[7,9],[8,9],[9,10],[7,8],[1,4],[2,3],[3,6],[2,6]
  ]; // 22 connective paths echo the major arcana count.

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

  const nodeRadius = Math.max(NUM.ELEVEN, Math.min(width, height) / (NUM.ONEFORTYFOUR / NUM.THREE));
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.fillStyle = textColor;
  ctx.font = "14px system-ui";
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
  ctx.globalAlpha = NUM.NINETYNINE / (NUM.ONEFORTYFOUR + NUM.NINETYNINE);

  const phi = (1 + Math.sqrt(5)) / 2; // Fibonacci growth rate.
  const centerX = width * (NUM.ONEFORTYFOUR - NUM.THIRTYTHREE) / NUM.ONEFORTYFOUR;
  const centerY = height * (NUM.NINETYNINE / (NUM.ONEFORTYFOUR + NUM.THIRTYTHREE));
  const baseRadius = Math.min(width, height) / (NUM.ONEFORTYFOUR / NUM.SEVEN);
  const steps = Math.floor(NUM.NINETYNINE / NUM.ELEVEN); // Nine turns keep the spiral grounded.

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
    const theta = (Math.PI * NUM.THIRTYTHREE / NUM.NINETYNINE) * i; // 60° increments (33/99 reduces to 1/3).
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
  const top = height * (NUM.SEVEN / NUM.ONEFORTYFOUR);
  const bottom = height * (NUM.ONEFORTYFOUR - NUM.SEVEN) / NUM.ONEFORTYFOUR;
  const centerX = width / (NUM.TWENTYTWO / NUM.SEVEN);
  const amplitude = width / (NUM.NINETYNINE / NUM.ELEVEN);
  const strands = NUM.THIRTYTHREE; // 33 to echo the spine.

  const strandA = createHelixPoints({ top, bottom, centerX, amplitude, strands, phase: 0, NUM });
  const strandB = createHelixPoints({ top, bottom, centerX, amplitude, strands, phase: Math.PI, NUM });

  ctx.lineWidth = 2.5;
  ctx.globalAlpha = (NUM.ONEFORTYFOUR - NUM.NINE) / NUM.ONEFORTYFOUR;
  drawPolyline(ctx, strandA, strokeA);
  drawPolyline(ctx, strandB, strokeB);

  const latticeLines = Math.floor(NUM.NINETYNINE / NUM.NINE);
  for (let i = 0; i <= latticeLines; i += 1) {
    const t = i / latticeLines;
    const nodeA = strandA[Math.floor(t * (strandA.length - 1))];
    const nodeB = strandB[Math.floor(t * (strandB.length - 1))];
    ctx.strokeStyle = blendColors(strokeA, strokeB, 0.5);
    ctx.globalAlpha = (NUM.TWENTYTWO / NUM.ONEFORTYFOUR) * NUM.THREE;
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
    const angle = t * Math.PI * (NUM.NINETYNINE / NUM.THIRTYTHREE) + phase; // 3 full waves via 99/33.
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
