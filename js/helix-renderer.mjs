/*
  helix-renderer.mjs
  Offline, ND-safe renderer for layered sacred geometry.
  Layers are drawn in a fixed order to preserve depth without motion.
*/

const DEFAULT_PALETTE = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"]
};

const DEFAULT_NUM = {
  THREE: 3,
  SEVEN: 7,
  NINE: 9,
  ELEVEN: 11,
  TWENTYTWO: 22,
  THIRTYTHREE: 33,
  NINETYNINE: 99,
  ONEFORTYFOUR: 144
};

function clearCanvas(ctx, width, height){
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.restore();
}

function drawBackground(ctx, width, height, color){
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

function drawVesicaLayer(ctx, dims, palette, NUM){
  const columns = NUM.THREE;
  const rows = NUM.THREE;
  // Triadic vesica grid keeps sacred geometry layered (3x3 repetition).
  const radius = Math.min(dims.width, dims.height) / NUM.TWENTYTWO * NUM.SEVEN;
  const offsetX = dims.centerX - radius;
  const offsetY = dims.centerY - radius;
  ctx.strokeStyle = palette.layers[0];
  ctx.globalAlpha = 0.25; // Gentle transparency keeps ND-safe contrast.
  ctx.lineWidth = 2;

  for (let y = 0; y <= rows; y += 1){
    for (let x = 0; x <= columns; x += 1){
      const cx = offsetX + x * radius * 0.75;
      const cy = offsetY + y * radius * 0.75;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = palette.layers[1];
  ctx.beginPath();
  ctx.ellipse(dims.centerX, dims.centerY, radius * 1.1, radius * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function treeNodes(){
  // Sephirot coordinates arranged in Kircher-style proportions.
  return [
    { x: 0.5, y: 0.05 },
    { x: 0.7, y: 0.16 },
    { x: 0.3, y: 0.16 },
    { x: 0.75, y: 0.32 },
    { x: 0.25, y: 0.32 },
    { x: 0.5, y: 0.44 },
    { x: 0.68, y: 0.6 },
    { x: 0.32, y: 0.6 },
    { x: 0.5, y: 0.74 },
    { x: 0.5, y: 0.9 }
  ];
}

function treePaths(){
  // Twenty-two connective paths, mapped symmetrically for offline study.
  return [
    [0, 1], [0, 2],
    [1, 3], [1, 5],
    [2, 4], [2, 5],
    [3, 5], [4, 5],
    [3, 6], [4, 7],
    [5, 8], [6, 8], [7, 8],
    [6, 9], [7, 9],
    [1, 4], [2, 3],
    [3, 7], [4, 6],
    [1, 6], [2, 7],
    [0, 5], [5, 9]
  ];
}

function drawTreeOfLife(ctx, dims, palette, NUM){
  const nodes = treeNodes();
  const paths = treePaths();
  const nodeRadius = Math.min(dims.width, dims.height) / NUM.ONEFORTYFOUR * NUM.NINE;

  ctx.strokeStyle = palette.layers[2];
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8; // Slight translucency to reveal vesica beneath.

  paths.forEach(([a, b]) => {
    const start = nodes[a];
    const end = nodes[b];
    ctx.beginPath();
    ctx.moveTo(start.x * dims.width, start.y * dims.height);
    ctx.lineTo(end.x * dims.width, end.y * dims.height);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.layers[3];
  nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x * dims.width, node.y * dims.height, nodeRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function goldenSpiralPoints(dims, NUM){
  const phi = (1 + Math.sqrt(5)) / 2; // Fibonacci resonance, ND-safe static curve.
  const steps = NUM.THIRTYTHREE;
  const baseRadius = Math.min(dims.width, dims.height) / NUM.NINE;
  const points = [];
  for (let i = 0; i <= steps; i += 1){
    const angle = (Math.PI / NUM.ELEVEN) * i;
    const radius = baseRadius * Math.pow(phi, i / NUM.SEVEN);
    const x = dims.centerX + radius * Math.cos(angle);
    const y = dims.centerY - radius * Math.sin(angle);
    points.push({ x, y });
  }
  return points;
}

function drawFibonacci(ctx, dims, palette, NUM){
  const points = goldenSpiralPoints(dims, NUM);
  ctx.strokeStyle = palette.layers[4];
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.6;

  ctx.beginPath();
  points.forEach((point, index) => {
    const method = index === 0 ? "moveTo" : "lineTo";
    ctx[method](point.x, point.y);
  });
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawHelixLattice(ctx, dims, palette, NUM){
  const segments = NUM.NINETYNINE;
  // Double helix lattice stays static; numerology constants maintain proportion.
  const amplitude = dims.width / NUM.THIRTYTHREE * 0.9;
  const stepY = dims.height / segments;
  const frequency = Math.PI * 2 / NUM.ELEVEN;

  const drawStrand = (phase, color) => {
    ctx.beginPath();
    for (let i = 0; i <= segments; i += 1){
      const y = i * stepY;
      const x = dims.centerX + Math.sin(frequency * i + phase) * amplitude;
      if (i === 0){
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  drawStrand(0, palette.layers[5]);
  drawStrand(Math.PI, palette.layers[0]);

  ctx.globalAlpha = 0.3;
  const rungCount = NUM.TWENTYTWO;
  for (let r = 0; r <= rungCount; r += 1){
    const y = r * (dims.height / rungCount);
    const swing = Math.sin(frequency * r) * amplitude;
    ctx.beginPath();
    ctx.moveTo(dims.centerX - swing, y);
    ctx.lineTo(dims.centerX + swing, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function renderHelix(ctx, options = {}){
  if (!ctx) return;

  const width = options.width || ctx.canvas.width;
  const height = options.height || ctx.canvas.height;
  const palette = options.palette || DEFAULT_PALETTE;
  const NUM = options.NUM || DEFAULT_NUM;

  const dims = {
    width,
    height,
    centerX: width / 2,
    centerY: height / 2
  };

  clearCanvas(ctx, width, height);
  drawBackground(ctx, width, height, palette.bg || DEFAULT_PALETTE.bg);
  drawVesicaLayer(ctx, dims, palette, NUM);
  drawTreeOfLife(ctx, dims, palette, NUM);
  drawFibonacci(ctx, dims, palette, NUM);
  drawHelixLattice(ctx, dims, palette, NUM);
}
