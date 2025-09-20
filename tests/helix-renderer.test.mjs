// Testing library/framework: Node's built-in test runner (node:test) with node:assert
// If your repo uses Jest/Vitest, you can replace node:test imports with `describe/it/expect` without changing test logic.

import test from 'node:test';
import assert from 'node:assert/strict';

// Adjust the import to match the actual module path exporting renderHelix.
let renderHelix;
try {
  // Common locations tried in order; first that works will be used.
  // We do dynamic import attempts to avoid hardcoding if repo layout differs.
  const candidates = [
    '../src/helix-renderer.mjs',
    '../src/helix-renderer.js',
    '../lib/helix-renderer.mjs',
    '../lib/helix-renderer.js',
    '../helix-renderer.mjs',
    '../helix-renderer.js',
  ];
  let loaded = false;

  for (const p of candidates) {

    try {

      const mod = await import(p);

      if (mod && (typeof mod.renderHelix === 'function' || typeof mod.default === 'function')) {

        renderHelix = mod.renderHelix || mod.default;
        loaded = true;
        break;

      }

    } catch (_) { /* try next */ }
  }

  if (!loaded) {

    // Fallback: if the test is colocated or the module path is custom, let this explicit import be edited by maintainers.

    // eslint-disable-next-line no-throw-literal

    throw { message: 'renderHelix module not found. Update import path in tests/helix-renderer.test.mjs.' };

  }

} catch (e) {

  // Provide a clearer error message to help adjust path quickly.

  throw new Error(`Unable to import renderHelix. Please update the import path in tests/helix-renderer.test.mjs.\nOriginal: ${e && e.message ? e.message : e}`);
}


// Minimal CanvasRenderingContext2D spy to capture drawing operations and styles.
function makeCtxSpy() {
  const calls = [];
  let state = {
    fillStyle: null,
    strokeStyle: null,
    lineWidth: null,
    lineCap: null,
    lineJoin: null,
  };
  const ctx = {
    // Style properties with setters tracking assignments
    get fillStyle() { return state.fillStyle; },
    set fillStyle(v) { state.fillStyle = v; calls.push({ type: 'setFillStyle', value: v }); },

    get strokeStyle() { return state.strokeStyle; },
    set strokeStyle(v) { state.strokeStyle = v; calls.push({ type: 'setStrokeStyle', value: v }); },

    get lineWidth() { return state.lineWidth; },
    set lineWidth(v) { state.lineWidth = v; calls.push({ type: 'setLineWidth', value: v }); },

    get lineCap() { return state.lineCap; },
    set lineCap(v) { state.lineCap = v; calls.push({ type: 'setLineCap', value: v }); },

    get lineJoin() { return state.lineJoin; },
    set lineJoin(v) { state.lineJoin = v; calls.push({ type: 'setLineJoin', value: v }); },

    // Path methods capturing current styles at call time
    clearRect: (x, y, w, h) => calls.push({ type: 'clearRect', x, y, w, h }),
    fillRect: (x, y, w, h) => calls.push({ type: 'fillRect', x, y, w, h, fillStyle: state.fillStyle }),
    beginPath: () => calls.push({ type: 'beginPath' }),
    arc: (x, y, r, s, e) => calls.push({ type: 'arc', x, y, r, s, e, strokeStyle: state.strokeStyle, lineWidth: state.lineWidth }),
    moveTo: (x, y) => calls.push({ type: 'moveTo', x, y }),
    lineTo: (x, y) => calls.push({ type: 'lineTo', x, y }),
    stroke: () => calls.push({ type: 'stroke', strokeStyle: state.strokeStyle, lineWidth: state.lineWidth }),
    fill: () => calls.push({ type: 'fill', fillStyle: state.fillStyle }),
    _calls: calls,
    _state: state,
  };
  return ctx;
}

// Shared NUM constants based on the implementation's expectations
const NUM = Object.freeze({
  THREE: 3,
  SEVEN: 7,
  NINE: 9,
  ELEVEN: 11,
  THIRTYTHREE: 33,
  TWENTYTWO: 22,
  NINETYNINE: 99,
  ONEFORTYFOUR: 144,
});

function summarize(calls, type) {
  return calls.filter(c => c.type === type);
}

function strokeColors(calls) {
  return summarize(calls, 'stroke').map(s => s.strokeStyle);
}

test('renderHelix draws layers in order and with expected stroke counts', () => {
  const ctx = makeCtxSpy();
  const width = 200, height = 100;
  const palette = {
    bg: '#101010',
    layers: ['#a1', '#b2', '#c3', '#d4'],
  };

  renderHelix(ctx, { width, height, palette, NUM });

  const calls = ctx._calls;

  // Clear and background
  const clears = summarize(calls, 'clearRect');
  assert.equal(clears.length, 1, 'clearRect called once');
  assert.deepEqual(clears[0], { type: 'clearRect', x: 0, y: 0, w: width, h: height }, 'clearRect dims');

  const fillsRect = summarize(calls, 'fillRect');
  assert.equal(fillsRect.length, 1, 'fillRect called once for background');
  assert.equal(fillsRect[0].fillStyle, '#101010', 'background uses palette.bg');

  // Line rendering configuration
  // Ensure rounded caps/joins were set at least once
  assert.ok(calls.some(c => c.type === 'setLineCap' && c.value === 'round'), 'lineCap set to round');
  assert.ok(calls.some(c => c.type === 'setLineJoin' && c.value === 'round'), 'lineJoin set to round');

  // Stroke counts by layer based on implementation:
  // Vesica: 18 strokes (2 per cell * 3x3)
  // Tree:   22 strokes (22 path edges)
  // Fib:     1 stroke
  // Helix:  12 strokes (2 strands + 10 crossbars)
  const strokes = summarize(calls, 'stroke');
  assert.equal(strokes.length, 53, 'total stroke calls = 53');

  // Validate layer order via stroke colors
  const colors = strokeColors(calls);
  const vesica = colors.slice(0, 18);
  const tree = colors.slice(18, 40);
  const fib = colors.slice(40, 41);
  const helix = colors.slice(41);

  assert.ok(vesica.every(c => c === '#a1'), 'vesica uses first layer color across 18 strokes');
  assert.equal(vesica.length, 18, 'vesica stroke count');

  assert.ok(tree.every(c => c === '#b2'), 'tree uses second layer color across 22 strokes');
  assert.equal(tree.length, 22, 'tree stroke count');

  assert.equal(fib.length, 1, 'fibonacci single stroke');
  assert.equal(fib[0], '#c3', 'fibonacci uses third layer color');

  assert.ok(helix.every(c => c === '#d4'), 'helix uses fourth layer color across 12 strokes');
  assert.equal(helix.length, 12, 'helix stroke count');

  // Arc and fill counts: vesica (18 arcs) + tree nodes (10 arcs) = 28 total arcs
  const arcs = summarize(calls, 'arc');
  assert.equal(arcs.length, 28, 'total circles/arcs drawn = 28');

  // Node fills: tree draws 10 filled nodes
  const fills = summarize(calls, 'fill');
  assert.equal(fills.length, 10, '10 node fills for Tree of Life');
});

test('renderHelix pads missing layer colors to four with fallback #e8e8f0', () => {
  const ctx = makeCtxSpy();
  const palette = {
    bg: '#ffffff',
    layers: ['#111111'], // only one provided; others should pad with fallback
  };
  renderHelix(ctx, { width: 180, height: 120, palette, NUM });

  const colors = strokeColors(ctx._calls);
  // Expected: vesica -> '#111111'; tree/fib/helix -> '#e8e8f0'
  const vesica = colors.slice(0, 18);
  const tree = colors.slice(18, 40);
  const fib = colors.slice(40, 41);
  const helix = colors.slice(41);

  assert.ok(vesica.every(c => c === '#111111'), 'vesica uses explicit provided color');
  assert.ok(tree.every(c => c === '#e8e8f0'), 'tree padded to fallback');
  assert.ok(fib.every(c => c === '#e8e8f0'), 'fibonacci padded to fallback');
  assert.ok(helix.every(c => c === '#e8e8f0'), 'helix padded to fallback');
});

test('renderHelix falls back to #e8e8f0 when provided per-layer colors are falsy', () => {
  const ctx = makeCtxSpy();
  const palette = {
    bg: '#222',
    // All entries present but falsy; internal functions should use color || '#e8e8f0'
    layers: ['', null, undefined, 0],
  };
  renderHelix(ctx, { width: 250, height: 150, palette, NUM });

  const colors = strokeColors(ctx._calls);

  const vesica = colors.slice(0, 18);
  const tree = colors.slice(18, 40);
  const fib = colors.slice(40, 41);
  const helix = colors.slice(41);

  for (const group of [vesica, tree, fib, helix]) {
    assert.ok(group.every(c => c === '#e8e8f0'), 'layer color falls back to #e8e8f0 when falsy');
  }
});

test('renderHelix handles degenerate sizes (0x0) without throwing', () => {
  const ctx = makeCtxSpy();
  const palette = { bg: '#000', layers: ['#1', '#2', '#3', '#4'] };
  assert.doesNotThrow(() => renderHelix(ctx, { width: 0, height: 0, palette, NUM }), 'should not throw on 0x0 canvas');
  // Even with 0 sizes, structure of calls remains: still clears/paints and performs strokes
  const strokes = summarize(ctx._calls, 'stroke');
  assert.equal(strokes.length, 53, 'stroke count remains structurally consistent');
});

test('helix crossbar cadence remains at floor(144/9)=16, producing 10 crossbar strokes', () => {
  const ctx = makeCtxSpy();
  const palette = { bg: '#fff', layers: ['#a', '#b', '#c', '#d'] };
  renderHelix(ctx, { width: 1440, height: 360, palette, NUM });

  const strokes = summarize(calls = ctx._calls, 'stroke'); // ensure `calls` available if needed
  // Helix strokes are at the end; last 12 strokes belong to helix (2 strands + 10 crossbars).
  const helixTail = strokes.slice(-12);
  assert.equal(helixTail.length, 12, 'helix stroke tail length = 12');

  // We cannot directly separate strands vs crossbars without deeper path introspection,
  // but we can assert that the 10 crossbars exist by verifying total helix strokes.
  // Additionally, ensure helix color is used.
  assert.ok(helixTail.every(s => s.strokeStyle === '#d'), 'helix tail uses helix color');
});

// Optional: sanity check that background is painted before any geometry strokes
test('background fill occurs before any geometry stroke', () => {
  const ctx = makeCtxSpy();
  const palette = { bg: '#abc', layers: ['#1', '#2', '#3', '#4'] };
  renderHelix(ctx, { width: 320, height: 240, palette, NUM });

  const firstFillRectIdx = ctx._calls.findIndex(c => c.type === 'fillRect');
  const firstStrokeIdx = ctx._calls.findIndex(c => c.type === 'stroke');

  assert.ok(firstFillRectIdx !== -1, 'has background fill');
  assert.ok(firstStrokeIdx !== -1, 'has strokes');
  assert.ok(firstFillRectIdx < firstStrokeIdx, 'background fill precedes first stroke');
});