export function setCtxStyle(ctx, key, value) {
  // Assign property and record via explicit method if available
  ctx[key] = value;
  const map = {
    fillStyle: 'set fillStyle',
    strokeStyle: 'set strokeStyle',
    globalAlpha: 'set globalAlpha',
    lineWidth: 'set lineWidth',
    font: 'set font',
    textAlign: 'set textAlign',
    textBaseline: 'set textBaseline',
  };
  const label = map[key];
  if (label && typeof ctx.record === 'function') {
    ctx.record(label, [value]);
  }
}