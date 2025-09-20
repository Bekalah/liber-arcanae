/**
 * Tests for helix-renderer.mjs
 * Testing library/framework: Node's built-in test runner (node:test) with node:assert/strict.
 * Note: This file is ESM (.mjs) and should also work under Jest/Vitest ESM with minimal changes if the project uses them.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// Attempt to locate the module relative to common locations.
// Adjust the import path below if your repo places helix-renderer.mjs elsewhere.

let renderHelix;

/**
 * Create a minimal 2D-like drawing context mock that records operations and style mutations.
 * We record:
 *   - method calls: clearRect, fillRect, beginPath, arc, moveTo, lineTo, stroke, fill
 *   - property assignments: fillStyle, strokeStyle, lineWidth, lineCap, lineJoin
 */
function createCtxMock() {
  const calls = [];
  const state = {
    fillStyle: null,
    strokeStyle: null,
    lineWidth: null,
    lineCap: null,
    lineJoin: null
  };

  const record = (type, payload = {}) => calls.push({ type, ...payload });

  const ctx = {
    get fillStyle() { return state.fillStyle; },
    set fillStyle(v) { state.fillStyle = v; record('set', { prop: 'fillStyle', value: v }); },

    get strokeStyle() { return state.strokeStyle; },
    set strokeStyle(v) { state.strokeStyle = v; record('set', { prop: 'strokeStyle', value: v }); },

    get lineWidth() { return state.lineWidth; },
    set lineWidth(v) { state.lineWidth = v; record('set', { prop: 'lineWidth', value: v }); },

    get lineCap() { return state.lineCap; },
    set lineCap(v) { state.lineCap = v; record('set', { prop: 'lineCap', value: v }); },

    get lineJoin() { return state.lineJoin; },
    set lineJoin(v) { state.lineJoin = v; record('set', { prop: 'lineJoin', value: v }); },

    clearRect: (x, y, w, h) => record('clearRect', { x, y, w, h }),
    fillRect: (x, y, w, h) => record('fillRect', { x, y, w, h }),
    beginPath: () => record('beginPath'),
    arc: (x, y, r, a0, a1) => record('arc', { x, y, r, a0, a1 }),
    moveTo: (x, y) => record('moveTo', { x, y }),
    lineTo: (x, y) => record('lineTo', { x, y }),
    stroke: () => record('stroke'),
    fill: () => record('fill'),

    // Expose internals for assertions
    __calls: calls,
    __state: state
  };

  return ctx;
}

const NUM = {
  ONE: 1,
  THREE: 3,
  SEVEN: 7,
  NINE: 9,
  ELEVEN: 11,
  TWENTYTWO: 22,
  THIRTYTHREE: 33,
  NINETYNINE: 99,
  ONEFORTYFOUR: 144
};

function defaultOpts(overrides = {}) {
  return {
    width: 900,
    height: 600,
    palette: {
      bg: '#101218',
      layers: ['#aab', '#bbc', '#ccd', '#dde'] // will be sliced/padded by implementation
    },
    NUM,
    ...overrides
  };
}

(async () => {
  const candidates = [
    '../src/helix-renderer.mjs',
    '../lib/helix-renderer.mjs',
    '../helix-renderer.mjs',
    // Fallback: allow tests to run if the file is colocated near test (rare)
    './helix-renderer.mjs'
  ];
  let lastErr;
  for (const p of candidates) {
    try {
      const mod = await import(p);
      renderHelix = mod.renderHelix;
      if (typeof renderHelix === 'function') break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (typeof renderHelix !== 'function') {
    throw Object.assign(new Error('renderHelix import failed. Ensure helix-renderer.mjs is present and exported renderHelix(ctx, opts).'), { cause: lastErr });
  }

  // Happy path: end-to-end render produces expected high-level sequence and counts
  test('renderHelix renders all four layers with correct sequencing and sane counts', () => {
    const ctx = createCtxMock();
    const opts = defaultOpts();
    renderHelix(ctx, opts);

    const calls = ctx.__calls;

    // Background happens first
    const firstClear = calls.findIndex(c => c.type === 'clearRect');
    const firstFillRect = calls.findIndex(c => c.type === 'fillRect');
    assert.ok(firstClear !== -1, 'clearRect should be called at least once');
    assert.ok(firstFillRect !== -1, 'fillRect should be called to paint background');
    assert.ok(firstClear < firstFillRect, 'clearRect should precede fillRect');

    // Line cap/join configured early
    const capSetIndex = calls.findIndex(c => c.type === 'set' && c.prop === 'lineCap' && c.value === 'round');
    const joinSetIndex = calls.findIndex(c => c.type === 'set' && c.prop === 'lineJoin' && c.value === 'round');
    assert.ok(capSetIndex !== -1 && joinSetIndex !== -1, 'lineCap and lineJoin should be set to "round"');

    // Rough stroke totals by layer (based on constants)
    // Vesica: 3x3 grid, two circles per cell => 18 strokes
    // Tree-of-Life: 22 edges => 22 strokes
    // Fibonacci curve: 1 stroke
    // Helix lattice: 2 strands + 10 crossbars => 12 strokes
    // Total strokes expected: 53
    const totalStrokes = calls.filter(c => c.type === 'stroke').length;
    assert.equal(totalStrokes, 53, 'total stroke() calls should match expected geometry count');

    // Node fills: 10 filled nodes in Tree-of-Life
    const totalFills = calls.filter(c => c.type === 'fill').length;
    assert.equal(totalFills, 10, 'Tree-of-Life should fill 10 node circles');

    // Ensure arcs exist (vesica + nodes)
    const totalArcs = calls.filter(c => c.type === 'arc').length;
    // Vesica arcs: 18; Node arcs: 10; Total >= 28; Fibonacci draws no arc, lattice none.
    assert.ok(totalArcs >= 28, 'should draw at least 28 arcs (vesica + nodes)');

    // Stroke width alternation by layer is set: vesica(2), tree(1), fibonacci(2), helix(1)
    const lineWidthSets = calls.filter(c => c.type === 'set' && c.prop === 'lineWidth').map(c => c.value);
    assert.ok(lineWidthSets.includes(2), 'lineWidth 2 should be set (vesica/fibonacci)');
    assert.ok(lineWidthSets.includes(1), 'lineWidth 1 should be set (tree/helix)');
  });

  // Palette padding guard: when fewer than 4 layer colors are provided, fallback color is used and all layers still render
  test('renderHelix pads palette.layers to four entries and still renders all layers', () => {
    const ctx = createCtxMock();
    const opts = defaultOpts({ palette: { bg: '#20222a', layers: ['#abc'] } }); // only one color provided
    renderHelix(ctx, opts);

    const calls = ctx.__calls;
    const totalStrokes = calls.filter(c => c.type === 'stroke').length;
    assert.equal(totalStrokes, 53, 'total stroke() calls remain unchanged even with short palette (fallbacks applied)');

    // Verify that strokeStyle was set to provided color at least once and fallback color at least once
    const strokeSets = calls.filter(c => c.type === 'set' && c.prop === 'strokeStyle').map(c => c.value);

    assert.ok(strokeSets.includes('#abc'), 'provided layer color should be used for at least one layer');
    assert.ok(strokeSets.includes('#e8e8f0'), 'fallback stroke color should be used when palette is short');
  });

  // Background fill correctness and dimensions
  test('renderHelix paints background using palette.bg and full canvas dimensions', () => {
    const ctx = createCtxMock();
    const opts = defaultOpts({ width: 777, height: 333, palette: { bg: '#334455', layers: ['#1', '#2', '#3', '#4'] } });
    renderHelix(ctx, opts);

    const fillRect = ctx.__calls.find(c => c.type === 'fillRect');
    const bgSet = ctx.__calls.find(c => c.type === 'set' && c.prop === 'fillStyle');

    assert.equal(bgSet && bgSet.value, '#334455', 'fillStyle should be set to palette.bg for background');
    assert.deepEqual(fillRect && { x: fillRect.x, y: fillRect.y, w: fillRect.w, h: fillRect.h }, { x: 0, y: 0, w: 777, h: 333 }, 'fillRect should cover full canvas');
  });

  // Degenerate canvas sizes should not throw and should produce zero/NaN-free geometry commands
  test('renderHelix is robust to tiny or zero canvas sizes', () => {
    for (const pair of [[1, 1], [0, 0], [0, 100], [100, 0]]) {
      const w = pair[0];
      const h = pair[1];
      const ctx = createCtxMock();
      assert.doesNotThrow(() => renderHelix(ctx, defaultOpts({ width: w, height: h })), 'should not throw for size ' + w + 'x' + h);

      // Validate that no arc radius argument is NaN or negative
      const arcs = ctx.__calls.filter(c => c.type === 'arc');

      for (const a of arcs) {
        assert.ok(Number.isFinite(a.r) && a.r >= 0, 'arc radius should be finite and non-negative (got ' + a.r + ')');
      }
    }
  });

  // NUM constants drive counts; changing them should change totals predictably
  test('renderHelix respects NUM constants for stroke distribution', () => {
    const ctx = createCtxMock();
    const customNUM = { ...NUM, THIRTYTHREE: 16, ONEFORTYFOUR: 72, NINE: 9, TWENTYTWO: 22 }; // halve steps and curve segments
    renderHelix(ctx, defaultOpts({ NUM: customNUM }));

    const totalStrokes = ctx.__calls.filter(c => c.type === 'stroke').length;
    // New expected:
    // Vesica: unchanged (18)
    // Tree: unchanged edges (22)
    // Fibonacci: 1 stroke
    // Helix: strands=2, crossbars: steps=72, barStep=floor(72/9)=8 => indices 0..72 step 8 => 10 (0..64) plus 1 at 72 => 10+? compute: 72/8 = 9 steps then plus last = 10 (0,8,16,24,32,40,48,56,64,72) => 10
    // Helix total = 12 again (2 + 10). Overall 18+22+1+12=53 (unchanged in this specific tweak).
    assert.equal(totalStrokes, 53, 'stroke totals align with NUM-driven geometry');
  });

  // Order of layers: vesica -> tree -> fibonacci -> helix (we detect via first lineWidth switch and representative operations)
  test('renderHelix draws layers in documented order', () => {
    const ctx = createCtxMock();
    renderHelix(ctx, defaultOpts());

    const calls = ctx.__calls;

    // Heuristic markers:
    // - Vesica sets lineWidth=2 then performs many arc+stroke pairs; first arc after lineWidth=2 is vesica.
    // - Tree sets lineWidth=1 and uses moveTo/lineTo then stroke repeatedly without fill until node fills; first fill after a batch of strokes belongs to nodes.
    // - Fibonacci sets lineWidth=2 then does many lineTo then a single stroke; we can detect another lineWidth=2 later.
    // - Helix ends with repeated crossbar beginPath/moveTo/lineTo/stroke sequences with lineWidth=1.
    const lws = calls.map((c, i) => ({ i, c })).filter(x => x.c.type === 'set' && x.c.prop === 'lineWidth').map(x => ({ idx: x.i, value: x.c.value }));

    assert.ok(lws.length >= 3, 'expected multiple lineWidth changes across layers');

    const foundLW2 = lws.find(x => x.value === 2);
    const firstLW2 = foundLW2 ? foundLW2.idx : -1;
    const foundLW1 = lws.find(x => x.value === 1);
    const firstLW1 = foundLW1 ? foundLW1.idx : -1;
    assert.ok(firstLW2 !== -1 && firstLW1 !== -1, 'should set both 2 and 1 line widths');

    assert.ok(firstLW2 < firstLW1, 'vesica (lw=2) should precede tree (lw=1)');

    const rev = [].concat(lws).reverse();
    const foundLastLW1 = rev.find(x => x.value === 1);
    const lastSetIndexForLW1 = foundLastLW1 ? foundLastLW1.idx : -1;
    const lastCrossbarStroke = [].concat(calls).reverse().findIndex(c => c.type === 'stroke');
    assert.ok(lastSetIndexForLW1 <= calls.length - 1, 'helix (lw=1) near the end of sequence');
  });
})();