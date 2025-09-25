/*
  helix-renderer.mjs

  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)
    3) Fibonacci curve (log spiral polyline; static)
    4) Double-helix lattice (two phase-shifted strands tied by calm crossbars)

  The drawing routines keep to small pure helpers for clarity and to respect
  the ND-safe directive: no motion, gentle contrast, and predictable structure.
*/

export function renderHelix(ctx, options) {
  if (!ctx || !options) {
    return;
  }

  const config = normalizeOptions(options);
  const { width, height, palette, NUM } = config;
  const layers = palette.layers;

  ctx.save();
  drawBackground(ctx, palette.bg, width, height);

  drawVesicaField(ctx, width, height, pickLayer(layers, 0), NUM);
  drawTreeOfLife(ctx, width, height, palette.ink, pickLayer(layers, 1), NUM);
  drawFibonacciCurve(ctx, width, height, pickLayer(layers, 2), NUM);
  drawHelixLattice(ctx, width, height, pickLayer(layers, 3), pickLayer(layers, 4), NUM);
  ctx.restore();
}

function normalizeOptions(options) {
  const width = options.width || 1440;
  const height = options.height || 900;
  const palette = options.palette || { bg:"#0b0b12", ink:"#e8e8f0", layers:["#b1c7ff"] };
  const NUM = options.NUM || { THREE:3, SEVEN:7, NINE:9, ELEVEN:11, TWENTYTWO:22, THIRTYTHREE:33, NINETYNINE:99, ONEFORTYFOUR:144 };
  return { width, height, palette, NUM };
}

function pickLayer(layers, index) {
  if (!layers || layers.length === 0) {
    return "#ffffff";
  }
  return layers[index % layers.length];
}

function drawBackground(ctx, color, width, height) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/* Layer 1: Vesica field
   Uses a triadic-by-heptadic grid (3 rows, 7 columns) with alternating offsets
   so each circle intersects neighbors, evoking the Vesica Piscis without motion. */
function drawVesicaField(ctx, width, height, color, NUM) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(width, height) / NUM.NINETYNINE;
  ctx.globalAlpha = 0.45;

  const cols = NUM.SEVEN;
  const rows = NUM.THREE;
  const marginX = width / NUM.ELEVEN;
  const marginY = height / NUM.NINE;
  const usableWidth = width - marginX * 2;
  const usableHeight = height - marginY * 2;
  const stepX = usableWidth / (cols - 1);
  const stepY = usableHeight / (rows - 1);
  const radius = Math.min(stepX, stepY) * 0.75;

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

/* Layer 2: Tree-of-Life scaffold
   Ten nodes and twenty-two paths, scaled by numerology constants so the layout
   matches the Cathedral canon while staying calm. */
function drawTreeOfLife(ctx, width, height, nodeColor, lineColor, NUM) {
  ctx.save();
  const nodes = createTreeNodes(width, height, NUM);
  const paths = createTreePaths();

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = Math.max(width, height) / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.55;


  ND-safe static renderer for layered sacred geometry. No animation, calm palette, ordered layers.
  Pure functions honor numerology constants (3, 7, 9, 11, 22, 33, 99, 144) and preserve depth without motion.
*/

// Main orchestrator: prepares canvas, applies palette, and invokes each layer renderer.
export function renderHelix(ctx, options) {
  const { width, height, palette, NUM } = options;
  const colors = Array.isArray(palette.layers) && palette.layers.length > 0 ? palette.layers.slice() : [palette.ink];
  const colorAt = (index, fallback) => colors[index % colors.length] || fallback;

  ctx.save();
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  drawVesicaField(ctx, width, height, { stroke: colorAt(0, palette.ink) }, NUM);
  drawTreeOfLife(ctx, width, height, { stroke: colorAt(1, palette.ink), node: palette.ink }, NUM);
  drawFibonacciCurve(ctx, width, height, { stroke: colorAt(2, palette.ink) }, NUM);
  drawHelixLattice(ctx, width, height, { stroke: colorAt(3, palette.ink), highlight: colorAt(4, palette.ink) }, NUM);

  drawFrame(ctx, width, height, palette.ink);
}

// Layer 1: Vesica field of intersecting circles.
function drawVesicaField(ctx, width, height, palette, NUM) {
  /*
    ND-safe rationale: soft intersecting circles create depth without motion.
    Numerology: grid uses 3 rows and 7 columns; radius derived from 1/11th of width.
  */
  const rows = NUM.THREE;
  const cols = NUM.SEVEN;
  const marginX = width / NUM.TWENTYTWO;
  const marginY = height / NUM.ELEVEN;
  const radius = Math.min((width - 2 * marginX) / (cols * 2), (height - 2 * marginY) / (rows * 2)) * (NUM.NINE / NUM.SEVEN);

  ctx.save();
  ctx.strokeStyle = palette.stroke;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1.5;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const offset = (row % 2 === 0 ? 0 : radius);
      const x = marginX + radius + col * radius * 2 - (row % 2) * radius + offset;
      const y = marginY + radius + row * radius * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, false);

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


  ctx.restore();
}

// Layer 2: Tree-of-Life scaffold with 10 sephirot and 22 connecting paths.
function drawTreeOfLife(ctx, width, height, palette, NUM) {
  /*
    ND-safe rationale: clear scaffold gives structure without overwhelming contrast.
    Numerology: 10 sephirot and 22 paths; vertical spacing anchored to 1/33 of height.
  */
  const baseX = width / 2;
  const verticalStep = height / NUM.THIRTYTHREE * 3; // keeps triadic rhythm.
  const horizontalStep = width / NUM.NINE;

  const nodes = [
    { id: "kether", x: baseX, y: verticalStep * 1 },
    { id: "chokmah", x: baseX + horizontalStep, y: verticalStep * 3 },
    { id: "binah", x: baseX - horizontalStep, y: verticalStep * 3 },
    { id: "chesed", x: baseX + horizontalStep * 1.1, y: verticalStep * 6 },
    { id: "gevurah", x: baseX - horizontalStep * 1.1, y: verticalStep * 6 },
    { id: "tiphareth", x: baseX, y: verticalStep * 8.5 },
    { id: "netzach", x: baseX + horizontalStep * 1.2, y: verticalStep * 11 },
    { id: "hod", x: baseX - horizontalStep * 1.2, y: verticalStep * 11 },
    { id: "yesod", x: baseX, y: verticalStep * 13.5 },
    { id: "malkuth", x: baseX, y: verticalStep * 16 }
  ];

  const paths = [
    [0, 1], [0, 2],
    [1, 3], [1, 5],
    [2, 4], [2, 5],
    [3, 4], [3, 5],
    [4, 5],
    [3, 6], [4, 7],
    [5, 6], [5, 7],
    [6, 8], [7, 8],
    [6, 9], [7, 9],
    [8, 9],
    [1, 6], [2, 7],
    [3, 8], [4, 8],
    [0, 5]
  ];

  ctx.save();
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.75;


  paths.forEach(([a, b]) => {
    const start = nodes[a];
    const end = nodes[b];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });

  ctx.fillStyle = nodeColor;
  ctx.globalAlpha = 0.9;
  const nodeRadius = Math.max(width, height) / NUM.NINETYNINE;
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);

  ctx.fillStyle = palette.node;
  ctx.lineWidth = 3;
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, width / NUM.NINETYNINE * 2.4, 0, Math.PI * 2, false);

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


function createTreeNodes(width, height, NUM) {
  const centerX = width / 2;
  const verticalStep = height / (NUM.NINE + 2);
  const horizontalSpread = width / NUM.THREE;
  const sideOffset = horizontalSpread / NUM.SEVEN;

  const levels = [
    [{ x: centerX, y: verticalStep }],
    [
      { x: centerX - horizontalSpread / 2, y: verticalStep * 2.5 },
      { x: centerX + horizontalSpread / 2, y: verticalStep * 2.5 }
    ],
    [
      { x: centerX - horizontalSpread / 2 - sideOffset, y: verticalStep * 4 },
      { x: centerX + horizontalSpread / 2 + sideOffset, y: verticalStep * 4 }
    ],
    [
      { x: centerX - horizontalSpread / 2, y: verticalStep * 5.5 },
      { x: centerX, y: verticalStep * 6.5 },
      { x: centerX + horizontalSpread / 2, y: verticalStep * 5.5 }
    ],
    [
      { x: centerX - horizontalSpread / 3, y: verticalStep * 8 },
      { x: centerX + horizontalSpread / 3, y: verticalStep * 8 }
    ],
    [{ x: centerX, y: verticalStep * 9.5 }]
  ];

  return levels.flat();
}

function createTreePaths() {
  return [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 4],
    [3, 5], [4, 5], [3, 6], [4, 7], [5, 6],
    [5, 7], [5, 8], [6, 8], [7, 8], [8, 9],
    [1, 2], [1, 5], [2, 5], [1, 6], [2, 7],
    [0, 5], [6, 9]
  ];
}

/* Layer 3: Fibonacci curve
   Approximates a logarithmic spiral using 99 samples. Phi and numerology constants
   control radius growth and step counts so the spiral feels organic yet calm. */
function drawFibonacciCurve(ctx, width, height, color, NUM) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(width, height) / NUM.ONEFORTYFOUR;
  ctx.globalAlpha = 0.7;

  const center = { x: width * 0.62, y: height * 0.58 };
  const baseRadius = Math.min(width, height) / NUM.ELEVEN;
  const points = createFibonacciPoints(center, baseRadius, NUM);

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

function createFibonacciPoints(center, baseRadius, NUM) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const turns = NUM.THREE;
  const stepsPerTurn = NUM.ELEVEN;
  const totalSteps = turns * stepsPerTurn * NUM.THREE;
  const angleStep = (Math.PI * 2) / NUM.TWENTYTWO;
  const radiusStep = 1 / NUM.THIRTYTHREE;

  const points = [];
  for (let i = 0; i <= totalSteps; i += 1) {
    const angle = i * angleStep;
    const radius = baseRadius * Math.pow(phi, i * radiusStep);
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    points.push({ x, y });
  }
  return points;
}

/* Layer 4: Double-helix lattice
   Two sine-like strands phase-shifted by pi, sampled 144 times. Calm crossbars
   every seventh sample hold the lattice together without motion. */
function drawHelixLattice(ctx, width, height, primaryColor, secondaryColor, NUM) {
  ctx.save();
  const amplitude = width / NUM.THIRTYTHREE;
  const verticalMargin = height / NUM.ELEVEN;
  const usableHeight = height - verticalMargin * 2;
  const steps = NUM.ONEFORTYFOUR;
  const angleSpan = Math.PI * NUM.THREE;

// Layer 3: Fibonacci curve approximated with a logarithmic spiral polyline.
function drawFibonacciCurve(ctx, width, height, palette, NUM) {
  /*
    ND-safe rationale: spiral is drawn as a gentle polyline with capped opacity, no motion.
    Numerology: 9 rotations sampled over 99 segments; scale anchors to 1/144 of diagonal.
  */
  const phi = (1 + Math.sqrt(5)) / 2;
  const centerX = width * 0.62;
  const centerY = height * 0.56;
  const samples = NUM.NINETYNINE;
  const rotations = NUM.NINE; // gentle curve with sacred nine.
  const maxTheta = rotations * Math.PI / NUM.THREE;
  const baseRadius = Math.min(width, height) / NUM.ONEFORTYFOUR * 22;

  ctx.save();
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const theta = t * maxTheta;
    const radius = baseRadius * Math.pow(phi, t * NUM.TWENTYTWO / NUM.ELEVEN);
    const x = centerX + radius * Math.cos(theta);
    const y = centerY + radius * Math.sin(theta);

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


// Layer 4: Static double-helix lattice with crossbars.
function drawHelixLattice(ctx, width, height, palette, NUM) {
  /*
    ND-safe rationale: twin strands imply motion but remain static; crossbars steady the form.
    Numerology: 33 segments per strand, 22 crossbars; amplitude and spacing keyed to sacred counts.
  */
  const strandSegments = NUM.THIRTYTHREE;
  const crossbars = NUM.TWENTYTWO;
  const top = height / NUM.NINE;
  const usableHeight = height * 0.72;
  const centerX = width / 2;
  const span = width / NUM.THREE;
  const amplitude = span / NUM.ELEVEN;

  const leftPoints = [];
  const rightPoints = [];

  for (let i = 0; i <= strandSegments; i += 1) {
    const t = i / strandSegments;
    const y = top + usableHeight * t;
    const phase = t * Math.PI * NUM.THREE;
    const offset = Math.sin(phase) * amplitude;
    leftPoints.push({ x: centerX - span / 2 + offset, y });
    rightPoints.push({ x: centerX + span / 2 - offset, y });
  }

  ctx.save();
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;

  drawPolyline(ctx, leftPoints);
  drawPolyline(ctx, rightPoints);

  ctx.strokeStyle = palette.highlight;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.55;

  for (let i = 0; i < crossbars; i += 1) {
    const idx = Math.floor(i / crossbars * strandSegments);
    const start = leftPoints[idx];
    const end = rightPoints[strandSegments - idx];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

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

    const angle = angleSpan * t;
    const y = verticalMargin + usableHeight * t;
    const xA = width / 2 + Math.sin(angle) * amplitude;
    const xB = width / 2 + Math.sin(angle + Math.PI) * amplitude;
    strandA.push({ x: xA, y });
    strandB.push({ x: xB, y });
  }

  drawStrand(ctx, strandA, primaryColor);
  drawStrand(ctx, strandB, secondaryColor);
  drawCrossbars(ctx, strandA, strandB, secondaryColor, NUM);

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


function drawStrand(ctx, points, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;

// Helper: draws a polyline from an array of points.
function drawPolyline(ctx, points) {
  if (!points.length) {
    return;
  }

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

function drawCrossbars(ctx, strandA, strandB, color, NUM) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;

  const step = NUM.SEVEN;
  const limit = Math.min(strandA.length, strandB.length);
  for (let i = 0; i < limit; i += step) {
    const a = strandA[i];
    const b = strandB[i];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCircle(ctx, cx, cy, radius) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

}

// Helper: subtle frame to delineate canvas edge for contrast.
function drawFrame(ctx, width, height, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, width - 8, height - 8);
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

