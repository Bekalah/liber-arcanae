/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 connective paths)
    3) Fibonacci curve (golden spiral polyline; static)
    4) Double-helix lattice (two phase-shifted static strands)

  ND-safe design notes:
    * Palette stays in calm low-saturation space to reduce sensory load.
    * All geometry is static to avoid motion triggers.
    * Layer order is explicit so forms can be parsed without visual noise.
*/

export function renderHelix(ctx, options = {}) {
  const { width = 1440, height = 900, palette = {}, NUM = defaultNumerology(), notice = "" } = options;
  const colors = normalisePalette(palette);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);

  fillBackground(ctx, width, height, colors.background);

  drawVesicaField(ctx, { width, height, color: colors.vesica, NUM });
  drawTreeOfLife(ctx, { width, height, pathColor: colors.treeLines, nodeColor: colors.treeNodes, labelColor: colors.ink, NUM });
  drawFibonacciCurve(ctx, { width, height, color: colors.fibonacci, NUM });
  drawHelixLattice(ctx, { width, height, primary: colors.helix, secondary: colors.helixAccent, NUM });

  if (notice) {
    drawNotice(ctx, { text: notice, color: colors.notice, width, height });
  }

  ctx.restore();
}

function defaultNumerology() {
  return { THREE: 3, SEVEN: 7, NINE: 9, ELEVEN: 11, TWENTYTWO: 22, THIRTYTHREE: 33, NINETYNINE: 99, ONEFORTYFOUR: 144 };
}

function normalisePalette(palette) {
  const layers = Array.isArray(palette.layers) && palette.layers.length >= 4
    ? palette.layers
    : ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"];
  return {
    background: palette.bg || "#0b0b12",
    ink: palette.ink || "#e8e8f0",
    vesica: layers[0] || "#b1c7ff",
    treeLines: layers[3] || "#ffd27f",
    treeNodes: layers[4] || "#f5a3ff",
    fibonacci: layers[1] || "#89f7fe",
    helix: layers[2] || "#a0ffa1",
    helixAccent: layers[5] || "#d0d0e6",
    notice: palette.notice || "#a6a6c1"
  };
}

function fillBackground(ctx, width, height, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawNotice(ctx, { text, color, width, height }) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "12px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(text, width * 0.02, height * 0.02);
  ctx.restore();
}

function drawVesicaField(ctx, { width, height, color, NUM }) {
  const unit = Math.min(width, height) / NUM.ONEFORTYFOUR;
  const radius = unit * NUM.THIRTYTHREE;
  const center = { x: width / 2, y: height / 2 };
  const lensOffset = radius * (NUM.SEVEN / NUM.TWENTYTWO);
  const ringCount = NUM.NINE - NUM.THREE; // sixfold symmetry derived from numerology constants
  const centers = [center];

  // Core vesica pair to anchor breathing lens form
  centers.push({ x: center.x - lensOffset, y: center.y });
  centers.push({ x: center.x + lensOffset, y: center.y });

  // Vertical trinity for depth
  const verticalStep = radius * (NUM.ELEVEN / NUM.TWENTYTWO);
  centers.push({ x: center.x, y: center.y - verticalStep });
  centers.push({ x: center.x, y: center.y + verticalStep });
  centers.push({ x: center.x, y: center.y - verticalStep * 2 });
  centers.push({ x: center.x, y: center.y + verticalStep * 2 });

  // Circular ring using sixfold arrangement (NUM.NINE - NUM.THREE)
  for (let i = 0; i < ringCount; i += 1) {
    const angle = (Math.PI * 2 * i) / ringCount;
    const radial = lensOffset * (NUM.THIRTYTHREE / NUM.TWENTYTWO);
    centers.push({
      x: center.x + Math.cos(angle) * radial,
      y: center.y + Math.sin(angle) * radial
    });
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = unit * (NUM.THREE / NUM.THIRTYTHREE);
  centers.forEach((pt) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

function drawTreeOfLife(ctx, { width, height, pathColor, nodeColor, labelColor, NUM }) {
  const margin = Math.min(width, height) / NUM.ELEVEN;
  const steps = NUM.NINE - NUM.THREE; // six steps between seven levels
  const levelStep = (height - margin * 2) / steps;
  const columnSpan = width / NUM.TWENTYTWO * NUM.SEVEN;
  const columns = [
    width / 2 - columnSpan,
    width / 2,
    width / 2 + columnSpan
  ];

  const nodes = [
    { name: "Keter", column: 1, level: 0 },
    { name: "Chokmah", column: 2, level: 1 },
    { name: "Binah", column: 0, level: 1 },
    { name: "Chesed", column: 2, level: 2 },
    { name: "Gevurah", column: 0, level: 2 },
    { name: "Tiferet", column: 1, level: 3 },
    { name: "Netzach", column: 2, level: 4 },
    { name: "Hod", column: 0, level: 4 },
    { name: "Yesod", column: 1, level: 5 },
    { name: "Malkuth", column: 1, level: 6 }
  ].map((node) => {
    return {
      name: node.name,
      x: columns[node.column],
      y: margin + node.level * levelStep
    };
  });

  const paths = buildTreePaths();

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = Math.min(width, height) / NUM.NINETYNINE * (NUM.THREE / NUM.SEVEN);
  paths.forEach(([a, b]) => {
    const start = nodes[a];
    const end = nodes[b];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  // Nodes with gentle halos to maintain depth cues
  const nodeRadius = Math.min(width, height) / NUM.TWENTYTWO;
  nodes.forEach((node) => {
    ctx.fillStyle = nodeColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius * (NUM.THREE / NUM.SEVEN), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = pathColor;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius * (NUM.ELEVEN / NUM.TWENTYTWO), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // Label centers softly for reference
  ctx.fillStyle = labelColor;
  ctx.font = "11px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  nodes.forEach((node) => {
    ctx.fillText(node.name, node.x, node.y + nodeRadius * (NUM.ELEVEN / NUM.TWENTYTWO));
  });

  ctx.restore();
}

function buildTreePaths() {
  return [
    [0, 1], [0, 2],
    [1, 2],
    [1, 3], [1, 5],
    [2, 4], [2, 5],
    [3, 4],
    [3, 5], [4, 5],
    [3, 6], [5, 6],
    [4, 7], [5, 7],
    [6, 7],
    [6, 8], [7, 8],
    [8, 9],
    [6, 9], [7, 9],
    [3, 8], [4, 8]
  ];
}

function drawFibonacciCurve(ctx, { width, height, color, NUM }) {
  const center = { x: width / 2, y: height / 2 };
  const golden = (1 + Math.sqrt(5)) / 2;
  const turns = NUM.ELEVEN / NUM.NINE; // uses numerology to define gentle 1.22 rotations
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + turns * Math.PI * 2;
  const exponent = (endAngle - startAngle) / (Math.PI / 2);
  const outerRadius = Math.min(width, height) / NUM.THREE;
  const base = outerRadius / Math.pow(golden, exponent);
  const segments = NUM.THIRTYTHREE;
  const points = sampleSpiral(center, base, golden, startAngle, endAngle, segments);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.min(width, height) / NUM.NINETYNINE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawPolyline(ctx, points);
  ctx.restore();
}

function sampleSpiral(center, base, golden, startAngle, endAngle, segments) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = startAngle + (endAngle - startAngle) * t;
    const growth = Math.pow(golden, angle / (Math.PI / 2));
    const radius = base * growth;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return points;
}

function drawPolyline(ctx, points) {
  if (!points.length) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function drawHelixLattice(ctx, { width, height, primary, secondary, NUM }) {
  const samples = NUM.NINETYNINE;
  const amplitude = width / NUM.TWENTYTWO;
  const verticalStep = height / NUM.TWENTYTWO;
  const phaseStep = (Math.PI * NUM.TWENTYTWO) / height;
  const leftPoints = [];
  const rightPoints = [];

  for (let i = 0; i <= samples; i += 1) {
    const y = (height / samples) * i;
    const phase = y * phaseStep;
    const xOffset = Math.sin(phase) * amplitude;
    leftPoints.push({ x: width / 2 - xOffset, y });
    rightPoints.push({ x: width / 2 + xOffset, y });
  }

  ctx.save();
  ctx.strokeStyle = primary;
  ctx.lineWidth = Math.min(width, height) / NUM.NINETYNINE * (NUM.THREE / NUM.ELEVEN);
  ctx.lineCap = "round";
  drawPolyline(ctx, leftPoints);
  drawPolyline(ctx, rightPoints);

  ctx.strokeStyle = secondary;
  const rungCount = NUM.ELEVEN + NUM.THREE; // 14 static lattice cross ties
  for (let i = 0; i <= rungCount; i += 1) {
    const y = verticalStep * (i + NUM.THREE / NUM.ELEVEN);
    const phase = y * phaseStep;
    const xOffset = Math.sin(phase) * amplitude;
    ctx.beginPath();
    ctx.moveTo(width / 2 - xOffset, y);
    ctx.lineTo(width / 2 + xOffset, y);
    ctx.stroke();
  }
  ctx.restore();
}
