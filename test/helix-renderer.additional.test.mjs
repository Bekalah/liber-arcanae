/**
 * Additional tests for helix-renderer.mjs
 * Testing library/framework: Node's built-in test runner (node:test) with node:assert/strict.
 * This file complements test/helix-renderer.import.test.mjs by adding further invariants,
 * edge cases, and robustness checks.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Minimal 2D-like drawing context mock that records operations and style mutations.
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
      layers: ['#aab', '#bbc', '#ccd', '#dde']
    },
    NUM,
    ...overrides
  };
}

let renderHelix;

(async () => {
  const candidates = [
    '../src/helix-renderer.mjs',
    '../lib/helix-renderer.mjs',
    '../helix-renderer.mjs',
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
  if (typeof renderHelix \!== 'function') {
    throw Object.assign(new Error('renderHelix import failed for additional tests. Ensure it exports renderHelix(ctx, opts).'), { cause: lastErr });
  }

  // Ordering: fillStyle should be set before background fillRect.
  test('background fillStyle is set before background fillRect', () => {
    const ctx = createCtxMock();
    renderHelix(ctx, defaultOpts());
    const calls = ctx.__calls;

    const idxFillRect = calls.findIndex(c => c.type === 'fillRect');
    const idxFillStyleSet = calls.findIndex(c => c.type === 'set' && c.prop === 'fillStyle');

    assert.ok(idxFillRect \!== -1, 'fillRect should be called for background');
    assert.ok(idxFillStyleSet \!== -1, 'fillStyle should be set for background');
    assert.ok(idxFillStyleSet < idxFillRect, 'fillStyle must be set before fillRect');
  });

  // Robustness: all numeric drawing arguments are finite and valid.
  test('all numeric drawing arguments are finite and valid', () => {
    const ctx = createCtxMock();
    renderHelix(ctx, defaultOpts());
    const calls = ctx.__calls;

    const arcs = calls.filter(c => c.type === 'arc');
    arcs.forEach((a, i) => {
      ['x', 'y', 'r', 'a0', 'a1'].forEach(k => {
        assert.ok(Number.isFinite(a[k]), `arc ${k} should be finite at index ${i} (got ${a[k]})`);
      });
      assert.ok(a.r >= 0, `arc radius should be non-negative at index ${i} (got ${a.r})`);
    });

    const mvln = calls.filter(c => c.type === 'moveTo' || c.type === 'lineTo');
    mvln.forEach((m, i) => {
      assert.ok(Number.isFinite(m.x) && Number.isFinite(m.y), `moveTo/lineTo coords should be finite at index ${i} (got ${m.x}, ${m.y})`);
    });

    const rects = calls.filter(c => c.type === 'clearRect' || c.type === 'fillRect');
    rects.forEach((r, i) => {
      assert.ok(Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.w) && Number.isFinite(r.h), `rect args finite at index ${i}`);
      assert.ok(r.w >= 0 && r.h >= 0, `rect dimensions non-negative at index ${i} (got ${r.w}x${r.h})`);
    });
  });

  // Palette fallback with empty layers array still renders all layers and uses fallback stroke color.
  test('empty palette.layers falls back to defaults and renders all layers', () => {
    const ctx = createCtxMock();
    const opts = defaultOpts({ palette: { bg: '#20222a', layers: [] } });
    renderHelix(ctx, opts);

    const totalStrokes = ctx.__calls.filter(c => c.type === 'stroke').length;
    assert.equal(totalStrokes, 53, 'total stroke() calls remain unchanged with empty palette (fallbacks applied)');

    const strokeSets = ctx.__calls.filter(c => c.type === 'set' && c.prop === 'strokeStyle').map(c => c.value);
    assert.ok(strokeSets.includes('#e8e8f0'), 'fallback stroke color should be used when palette.layers is empty');
  });

  // Style discipline: lineCap and lineJoin only set to "round".
  test('lineCap and lineJoin are only set to "round"', () => {
    const ctx = createCtxMock();
    renderHelix(ctx, defaultOpts());
    const badSets = ctx.__calls.filter(c =>
      c.type === 'set' &&
      (c.prop === 'lineCap' || c.prop === 'lineJoin') &&
      c.value \!== 'round'
    );
    assert.equal(badSets.length, 0, 'lineCap/lineJoin should only ever be set to "round"');
  });

  // Path discipline: every stroke should have a preceding beginPath.
  test('every stroke is preceded by a beginPath', () => {
    const ctx = createCtxMock();
    renderHelix(ctx, defaultOpts());
    const calls = ctx.__calls;

    const beginIdx = calls.map((c, i) => c.type === 'beginPath' ? i : -1).filter(i => i >= 0);
    const strokeIdx = calls.map((c, i) => c.type === 'stroke' ? i : -1).filter(i => i >= 0);

    assert.ok(beginIdx.length > 0, 'expected at least one beginPath');
    for (const si of strokeIdx) {
      const hasEarlierBegin = beginIdx.some(bi => bi < si);
      assert.ok(hasEarlierBegin, 'each stroke should have a preceding beginPath');
    }
  });

  // Coloring: should use provided palette layer colors (at least first two entries).
  test('uses provided palette layer colors (at least first two)', () => {
    const ctx = createCtxMock();
    const opts = defaultOpts({ palette: { bg: '#101218', layers: ['#aab', '#bbc', '#ccd', '#dde'] } });
    renderHelix(ctx, opts);
    const strokeSets = ctx.__calls.filter(c => c.type === 'set' && c.prop === 'strokeStyle').map(c => c.value);

    assert.ok(strokeSets.includes('#aab'), 'first palette color (#aab) should be used');
    assert.ok(strokeSets.includes('#bbc'), 'second palette color (#bbc) should be used');
  });
})();