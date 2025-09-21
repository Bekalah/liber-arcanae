/*
  helix-renderer.mjs
  ND-safe static renderer for layered sacred geometry.

  Layers:
    1) Vesica field (intersecting circles)
    2) Tree-of-Life scaffold (10 sephirot + 22 paths; simplified layout)
    3) Fibonacci curve (log spiral polyline; static)
    4) Double-helix lattice (two phase-shifted strands with crossbars)

  Design notes:
    - Calm color palette is supplied externally so accessibility can be tuned without changing code.
    - No animation, timers, or motion to remain ND-safe and meditative.
    - Pure functions consume a drawing context and settings; easy to reuse offline.
*/

export function renderHelix(ctx, config) {
  if (!ctx || !config) {
    return;
  }

  const settings = createSettings(config);
  const bounds = { width:settings.width, height:settings.height };

  ctx.save();
  drawBackground(ctx, bounds, settings);
  drawVesicaField(ctx, bounds, settings);
  drawTreeOfLife(ctx, bounds, settings);
  drawFibonacciCurve(ctx, bounds, settings);
  drawDoubleHelix(ctx, bounds, settings);
  if (settings.notice) {
    drawNotice(ctx, bounds, settings);
  }
  ctx.restore();
}

function createSettings(config) {
  const width = Number(config.width) || 1440;
  const height = Number(config.height) || 900;
  const palette = config.palette || {
    bg:"#0a1419",
    ink:"#f2f7f7",
    layers:["#4ab6b6","#7bd389","#f2d184","#d1b3ff","#f8c0c8","#9fd0ff"]
  };
  const NUM = config.NUM || {
    THREE:3,
    SEVEN:7,
    NINE:9,
    ELEVEN:11,
    TWENTYTWO:22,
    THIRTYTHREE:33,
    NINETYNINE:99,
    ONEFORTYFOUR:144
  };
  return {
    width,
    height,
    palette,
    NUM,
    notice:config.notice || ""
  };
}

function drawBackground(ctx, bounds, settings) {
  // ND-safe: background set first so all layers rest on stable field.
  ctx.fillStyle = settings.palette.bg;
  ctx.fillRect(0, 0, bounds.width, bounds.height);

  // Subtle radial breath to echo the provided imagery without motion.
  const two = settings.NUM.NINE - settings.NUM.SEVEN;
  const gradient = ctx.createRadialGradient(
    bounds.width / settings.NUM.THREE,
    bounds.height / settings.NUM.THREE,
    Math.max(bounds.width, bounds.height) / settings.NUM.NINETYNINE,
    bounds.width / two,
    bounds.height / two,
    Math.max(bounds.width, bounds.height) / settings.NUM.THREE
  );
  gradient.addColorStop(0, addAlpha(settings.palette.layers[0], 0.16));
  gradient.addColorStop(1, addAlpha(settings.palette.bg, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, bounds.width, bounds.height);
}

function drawVesicaField(ctx, bounds, settings) {
  const { NUM, palette } = settings;
  const base = Math.min(bounds.width, bounds.height);
  const radius = base / NUM.SEVEN;
  const columns = NUM.THREE;
  const rows = NUM.SEVEN;
  const marginX = bounds.width / NUM.NINE;
  const marginY = bounds.height / NUM.NINE;
  const gapX = (bounds.width - marginX * 2) / (columns - 1);
  const gapY = (bounds.height - marginY * 2) / (rows - 1);
  const color = addAlpha(palette.layers[1], NUM.THREE / (NUM.ELEVEN + NUM.THREE));
  const twoPI = Math.PI * (NUM.NINE - NUM.SEVEN);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = radius / NUM.ELEVEN;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const cx = marginX + col * gapX;
      const cy = marginY + row * gapY;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, twoPI);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTreeOfLife(ctx, bounds, settings) {
  const { palette, NUM } = settings;
  const centerX = bounds.width / (settings.NUM.NINE - settings.NUM.SEVEN);
  const marginY = bounds.height / NUM.NINE;
  const levelCount = NUM.SEVEN;
  const verticalGap = (bounds.height - marginY * 2) / (levelCount - 1);
  const horizontalGap = bounds.width / NUM.SEVEN;
  const nodeRadius = Math.min(bounds.width, bounds.height) / NUM.THIRTYTHREE;
  const nodeColor = palette.layers[0];
  const pathColor = addAlpha(palette.layers[5], NUM.SEVEN / NUM.ONEFORTYFOUR * (NUM.THREE / NUM.ELEVEN));

  const nodes = createTreeNodes(centerX, marginY, verticalGap, horizontalGap, nodeRadius);
  const paths = createTreePaths();

  ctx.save();
  ctx.strokeStyle = pathColor;
  ctx.lineWidth = nodeRadius / NUM.THREE;
  ctx.lineCap = "round";
  paths.forEach((pair) => {
    const from = nodes[pair[0]];
    const to = nodes[pair[1]];
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  });

  ctx.fillStyle = nodeColor;
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * (NUM.NINE - NUM.SEVEN));
    ctx.fill();
    ctx.strokeStyle = addAlpha(palette.ink, 0.24);
    ctx.lineWidth = node.radius / NUM.ELEVEN;
    ctx.stroke();
  });
  ctx.restore();
}

function createTreeNodes(centerX, marginY, verticalGap, horizontalGap, radius) {
  // 10 sephirot positions in Kircher arrangement.
  const leftX = centerX - horizontalGap;
  const rightX = centerX + horizontalGap;
  return [
    { name:"Keter", x:centerX, y:marginY, radius },
    { name:"Chokmah", x:rightX, y:marginY + verticalGap, radius },
    { name:"Binah", x:leftX, y:marginY + verticalGap, radius },
    { name:"Chesed", x:rightX, y:marginY + verticalGap * 2, radius },
    { name:"Geburah", x:leftX, y:marginY + verticalGap * 2, radius },
    { name:"Tipheret", x:centerX, y:marginY + verticalGap * 3, radius },
    { name:"Netzach", x:rightX, y:marginY + verticalGap * 4, radius },
    { name:"Hod", x:leftX, y:marginY + verticalGap * 4, radius },
    { name:"Yesod", x:centerX, y:marginY + verticalGap * 5, radius },
    { name:"Malkuth", x:centerX, y:marginY + verticalGap * 6, radius }
  ];
}

function createTreePaths() {
  // 22 connections reflecting Hebrew-letter paths in simplified order.
  return [
    [0, 1], [0, 2], [0, 5],
    [1, 2], [1, 5], [1, 3],
    [2, 5], [2, 4], [3, 4],
    [3, 5], [3, 6], [4, 5],
    [4, 7], [5, 6], [5, 7],
    [5, 8], [6, 7], [6, 8],
    [6, 9], [7, 8], [7, 9],
    [8, 9]
  ];
}

function drawFibonacciCurve(ctx, bounds, settings) {
  const { NUM, palette } = settings;
  const center = { x:bounds.width / NUM.THREE, y:bounds.height / NUM.SEVEN * NUM.THREE };
  const phi = (1 + Math.sqrt(5)) / 2;
  const segmentCount = NUM.TWENTYTWO;
  const spiralPoints = [];
  const maxRadius = Math.min(bounds.width, bounds.height) / NUM.THREE;
  const angleStep = (Math.PI * NUM.NINE) / NUM.ONEFORTYFOUR; // gentle growth
  const twoPI = Math.PI * (NUM.NINE - NUM.SEVEN);

  for (let i = 0; i < segmentCount; i += 1) {
    const radius = maxRadius / Math.pow(phi, segmentCount - i);
    const angle = i * angleStep + twoPI / NUM.TWENTYTWO;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    spiralPoints.push({ x, y });
  }

  ctx.save();
  ctx.strokeStyle = addAlpha(palette.layers[3], NUM.TWENTYTWO / (NUM.ONEFORTYFOUR * (NUM.NINE - NUM.SEVEN)));
  ctx.lineWidth = maxRadius / NUM.NINETYNINE * NUM.THREE;
  ctx.lineCap = "round";
  ctx.beginPath();
  spiralPoints.forEach((pt, index) => {
    if (index === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  });
  ctx.stroke();
  ctx.restore();
}

function drawDoubleHelix(ctx, bounds, settings) {
  const { NUM, palette } = settings;
  const centerX = bounds.width * (NUM.TWENTYTWO / (NUM.THIRTYTHREE + NUM.ELEVEN));
  const amplitude = bounds.width / NUM.ELEVEN;
  const strandLength = bounds.height;
  const strandSteps = NUM.ONEFORTYFOUR;
  const strandColorA = addAlpha(palette.layers[2], NUM.TWENTYTWO / NUM.ONEFORTYFOUR);
  const strandColorB = addAlpha(palette.layers[4], NUM.TWENTYTWO / NUM.ONEFORTYFOUR);
  const rungCount = NUM.THIRTYTHREE;
  const frequency = NUM.THREE; // three full twists down the canvas
  const twoPI = Math.PI * (NUM.NINE - NUM.SEVEN);

  const strandA = [];
  const strandB = [];
  for (let i = 0; i <= strandSteps; i += 1) {
    const t = i / strandSteps;
    const y = t * strandLength;
    const theta = t * frequency * twoPI;
    const xA = centerX + Math.sin(theta) * amplitude;
    const xB = centerX + Math.sin(theta + Math.PI) * amplitude;
    strandA.push({ x:xA, y });
    strandB.push({ x:xB, y });
  }

  ctx.save();
  ctx.lineWidth = amplitude / NUM.NINETYNINE * NUM.SEVEN;
  ctx.lineCap = "round";
  drawPolyline(ctx, strandA, strandColorA);
  drawPolyline(ctx, strandB, strandColorB);

  const rungInterval = Math.max(1, Math.floor(strandA.length / rungCount));
  ctx.strokeStyle = addAlpha(palette.ink, NUM.THREE / NUM.THIRTYTHREE);
  ctx.lineWidth = amplitude / NUM.ELEVEN;
  for (let i = 0; i < strandA.length; i += rungInterval) {
    const a = strandA[i];
    const b = strandB[i];
    if (!a || !b) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPolyline(ctx, points, color) {
  if (points.length === 0) {
    return;
  }
  ctx.beginPath();
  points.forEach((pt, index) => {
    if (index === 0) {
      ctx.moveTo(pt.x, pt.y);
    } else {
      ctx.lineTo(pt.x, pt.y);
    }
  });
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawNotice(ctx, bounds, settings) {
  ctx.save();
  ctx.fillStyle = addAlpha(settings.palette.ink, 0.72);
  ctx.font = "14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    settings.notice,
    bounds.width - bounds.width / settings.NUM.ELEVEN,
    bounds.height - bounds.height / settings.NUM.ELEVEN
  );
  ctx.restore();
}

function addAlpha(hexColor, alpha) {
  return hexToRgba(hexColor, alpha);
}

function hexToRgba(hex, alpha) {
  let raw = hex.replace("#", "");
  if (raw.length === 3) {
    raw = raw.split("").map((c) => c + c).join("");
  }
  const bigint = parseInt(raw, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
