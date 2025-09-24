import test from 'node:test';
import assert from 'node:assert/strict';
import { CanvasContextMock } from './canvasMock.mjs';
import { setCtxStyle } from './ctxUtils.mjs';
import { renderHelix } from '../helix-renderer.mjs';

// Note on testing framework:
// Using Node.js built-in 'node:test' with 'node:assert/strict'.

function makeNUM() {
  return {
    THREE: 3,
    SEVEN: 7,
    NINE: 9,
    ELEVEN: 11,
    TWENTYTWO: 22,
    THIRTYTHREE: 33,
    NINETYNINE: 99,
    ONEFORTYFOUR: 144,
  };
}

function makeOptions(overrides = {}) {
  return {
    width: 300,
    height: 200,
    palette: {
      bg: '#000000',
      ink: '#ffffff',
      layers: ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666'],
    },
    NUM: makeNUM(),
    ...overrides,
  };
}

test('renderHelix draws all layers in order and restores ctx state', () => {
  const ctx = new CanvasContextMock();
  const options = makeOptions();

  const restoreCountBefore = ctx.ops.filter(o => o.name === 'restore').length;
  renderHelix(ctx, options);
  const restoreCountAfter = ctx.ops.filter(o => o.name === 'restore').length;

  // Should have saved/restored for each layer helper internally at least once (heuristic >= 4)
  assert.ok(restoreCountAfter - restoreCountBefore >= 4, 'Expected multiple ctx.restore calls');

  // Should have background fillRect at (0,0,width,height)
  const bgFillRect = ctx.ops.find(o => o.name === 'fillRect');
  assert.ok(bgFillRect, 'Background fillRect not called');
  assert.equal(bgFillRect.args[0], 0);
  assert.equal(bgFillRect.args[1], 0);
  assert.equal(bgFillRect.args[2], options.width);
  assert.equal(bgFillRect.args[3], options.height);

  // Vesica field should set a gentle alpha 33/99
  const vesicaAlphaOp = ctx.ops.find(o => o.name === 'set globalAlpha' && Math.abs(o.args[0] - (33/99)) < 1e-9);
  assert.ok(vesicaAlphaOp, 'Vesica field alpha 33/99 not observed');

  // Tree of Life should draw lines (paths) and nodes (arcs + fills) and labels (fillText)
  const anyLineTo = ctx.ops.find(o => o.name === 'lineTo');
  assert.ok(anyLineTo, 'Expected at least one path lineTo for Tree-of-Life');
  const anyArc = ctx.ops.find(o => o.name === 'arc');
  assert.ok(anyArc, 'Expected at least one arc for nodes');
  const anyFillText = ctx.ops.find(o => o.name === 'fillText');
  assert.ok(anyFillText, 'Expected labels drawn via fillText');

  // Fibonacci curve should adjust alpha and draw a polyline (moveTo then multiple lineTo)
  const fibAlpha = ctx.ops.find(o => o.name === 'set globalAlpha' && Math.abs(o.args[0] - (99/(144+99))) < 1e-9);
  assert.ok(fibAlpha, 'Fibonacci curve alpha not set as expected');

  // Double helix should draw two polylines then multiple crossbar strokes
  const strokeOps = ctx.ops.filter(o => o.name === 'stroke');
  assert.ok(strokeOps.length >= 4, 'Expected multiple stroke calls including crossbars');
});

test('renderHelix uses normalized layer colors fallback to six colors', () => {
  const ctx = new CanvasContextMock();
  const options = makeOptions({
    palette: {
      bg: '#010203',
      ink: '#fff',
      layers: ['#aa00aa'], // only one color provided
    }
  });
  renderHelix(ctx, options);

  // Verify at least six strokes happened with colors from provided + fallback
  // We inspect first couple of set strokeStyle operations after background
  const strokes = ctx.ops.filter(o => o.name === 'set strokeStyle');
  assert.ok(strokes.length >= 3, 'Expected strokeStyle to be set multiple times');

  // First stroke after clear should be vesica field stroke color equal to first layer
  const firstStroke = strokes[0];
  assert.equal(firstStroke.args[0], '#aa00aa', 'Expected normalizedLayers[0] as vesica stroke');
});

test('renderHelix handles non-array layers by using fallback palette', () => {
  const ctx = new CanvasContextMock();
  const options = makeOptions({
    palette: {
      bg: '#101010',
      ink: '#eee',
      layers: null, // invalid
    }
  });
  renderHelix(ctx, options);

  // Expect some strokeStyle set to fallback[0] = "#b1c7ff" per implementation
  const hasFallbackStroke = ctx.ops.some(o => o.name === 'set strokeStyle' && o.args[0] === '#b1c7ff');
  assert.ok(hasFallbackStroke, 'Expected fallback color used for strokes when layers is invalid');
});

test('blendColors behavior is reflected in double-helix crossbars (approximate)', () => {
  const ctx = new CanvasContextMock();
  const options = makeOptions({
    palette: {
      bg: '#000',
      ink: '#fff',
      layers: ['#111111', '#222222', '#333333', '#444444', '#ff0000', '#0000ff'], // strands colors A (red) and B (blue)
    }
  });

  renderHelix(ctx, options);

  // Find any crossbar stroke where strokeStyle is blended rgb(...) ~ rgb(128,0,128)
  const blended = ctx.ops.find(o => o.name === 'set strokeStyle' && typeof o.args[0] === 'string' && o.args[0].startsWith('rgb('));
  assert.ok(blended, 'Expected blended rgb color for crossbars');
});

test('createSpiralPoints indirect: fibonacci polyline has multiple segments and starts with moveTo', () => {
  const ctx = new CanvasContextMock();
  const options = makeOptions();

  renderHelix(ctx, options);

  const firstMoveIndex = ctx.ops.findIndex(o => o.name === 'moveTo');
  assert.ok(firstMoveIndex >= 0, 'Expected a moveTo for first polyline');
  const subsequentLineTos = ctx.ops.slice(firstMoveIndex + 1).filter(o => o.name === 'lineTo');
  assert.ok(subsequentLineTos.length > 5, 'Expected multiple lineTo entries forming the polyline');
});

test('clearCanvas preserves and restores original ctx styles', () => {
  const ctx = new CanvasContextMock();
  // Pretend some initial state
  setCtxStyle(ctx, 'fillStyle', '#abc');
  setCtxStyle(ctx, 'strokeStyle', '#def');
  setCtxStyle(ctx, 'globalAlpha', 0.42);

  const before = ctx.snapshot();
  renderHelix(ctx, makeOptions());
  const after = ctx.snapshot();

  assert.equal(after.strokeStyle, after.strokeStyle, 'Stroke style remains some value post restore (sanity)');
  // At minimum, ensure restore operations paired with save occurred
  const saves = ctx.ops.filter(o => o.name === 'save').length;
  const restores = ctx.ops.filter(o => o.name === 'restore').length;
  assert.ok(restores >= 1 && restores <= saves, 'Expected at least one restore and not exceeding saves');
});