/*
  first-paint-octagram.js
  Static ND-safe fallback that paints a calm octagram gradient when hero art is unavailable.
  The gradient avoids flicker and keeps layered depth until WEBP art loads.
*/

export function paintOctagram(id="opus", width=1200, height=675){
  const canvas = document.getElementById(id);
  if (!canvas) return;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const hyp = Math.hypot(width, height) / 2;

  const gradient = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, hyp);
  const palette = ["#0F0B1E", "#1d1d20", "#3b2e5a", "#bfa66b", "#dfe8ff"];
  palette.forEach((color, index) => {
    gradient.addColorStop(index / (palette.length - 1), color);
  });

  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#dfe8ff";

  const radius = Math.min(width, height) * 0.32;
  for (let k = 0; k < 8; k += 1){
    const angle = (Math.PI / 4) * k;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
    ctx.stroke();
  }
}
