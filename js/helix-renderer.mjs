/*
  helix-renderer.mjs
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

  ctx.fillStyle = palette.node;
  ctx.lineWidth = 3;
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, width / NUM.NINETYNINE * 2.4, 0, Math.PI * 2, false);
    ctx.fill();
  });

  ctx.restore();
}

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
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
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
    ctx.stroke();
  }

  ctx.restore();
}

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
