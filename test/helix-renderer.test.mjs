/* Tests for helix-renderer.mjs
   Framework: auto-detected; this file supports Node's test runner, Vitest, Mocha, and Jest via a thin wrapper.
   If using:
     - node:test: uses 'test' from node:test and 'strict' assert
     - vitest/jest: maps 'test' to 'it' and 'beforeEach' where available
     - mocha: uses global 'describe/it' and Node 'assert'
*/
const framework = (() => {
  const hasJest = typeof globalThis.jest !== "undefined";
  const hasVitest = typeof globalThis.vi !== "undefined" || typeof globalThis.vitest !== "undefined";
  const isNodeTest = typeof process !== "undefined" && process.env.NODE_TEST === "1";
  return { hasJest, hasVitest, isNodeTest };
})();

let t, beforeEachFn;
try {
  // Prefer node:test if available
  ({ test: t, beforeEach: beforeEachFn } = await import('node:test'));
} catch {
  // Fallback shims
  const g = globalThis;
  if (g.it) {
    t = g.it; // jest/vitest/mocha
    beforeEachFn = g.beforeEach || (() => {});
  } else if (g.test) {
    t = g.test; // jest-like
    beforeEachFn = g.beforeEach || (() => {});
  } else {
    // minimal shim
    t = (name, fn) => { try { fn(); console.log("✓", name); } catch (e) { console.error("✗", name, e); throw e; } };
    beforeEachFn = () => {};
  }
}
import assert from 'node:assert/strict';

// Import unit under test
const srcRel = '../${SRC_PATH}';
const base = new URL(import.meta.url).pathname.includes('/test/') ? './' : './test/';
const cleaned = srcRel.startsWith('test/../') ? srcRel.slice('test/../'.length) : srcRel;
const importPath = (base + cleaned).replaceAll(String.fromCharCode(92), '/');
const { renderHelix } = await import(importPath);

function makeNUM(overrides = {}) {
  return {
    THREE: 3,
    SEVEN: 7,
    ELEVEN: 11,
    NINETYNINE: 99,
    NINE: 9,
    ONEFORTYFOUR: 144,
    TWENTYTWO: 22,
    THIRTYTHREE: 33,
    ...overrides,
  };
}

// Lightweight 2D context mock that records drawing operations and current styles.
function createMockCtx() {
  const ops = [];
  const ctx = {
    // state
    _stack: [],
    _state: {
      fillStyle: '#000',
      strokeStyle: '#000',
      globalAlpha: 1,
      lineWidth: 1,
    },
    get fillStyle() { return this._state.fillStyle; },
    set fillStyle(v) { this._state.fillStyle = v; ops.push({ op: 'setFillStyle', v }); },
    get strokeStyle() { return this._state.strokeStyle; },
    set strokeStyle(v) { this._state.strokeStyle = v; ops.push({ op: 'setStrokeStyle', v }); },
    get globalAlpha() { return this._state.globalAlpha; },
    set globalAlpha(v) { this._state.globalAlpha = v; ops.push({ op: 'setGlobalAlpha', v }); },
    get lineWidth() { return this._state.lineWidth; },
    set lineWidth(v) { this._state.lineWidth = v; ops.push({ op: 'setLineWidth', v }); },

    save() { this._stack.push({ ...this._state }); ops.push({ op: 'save' }); },
    restore() { this._state = this._stack.pop() || this._state; ops.push({ op: 'restore' }); },

    clearRect(x, y, w, h) { ops.push({ op: 'clearRect', x, y, w, h }); },
    fillRect(x, y, w, h) { ops.push({ op: 'fillRect', x, y, w, h, fillStyle: this.fillStyle, alpha: this.globalAlpha }); },

    // path handling
    _currentPath: null,
    beginPath() { this._currentPath = { points: [], strokeStyle: this.strokeStyle, fillStyle: this.fillStyle, alpha: this.globalAlpha, lineWidth: this.lineWidth }; ops.push({ op: 'beginPath' }); },
    moveTo(x, y) { if (this._currentPath) this._currentPath.points.push({ type: 'M', x, y }); ops.push({ op: 'moveTo', x, y }); },
    lineTo(x, y) { if (this._currentPath) this._currentPath.points.push({ type: 'L', x, y }); ops.push({ op: 'lineTo', x, y }); },
    arc(x, y, r, s, e) { if (this._currentPath) this._currentPath.points.push({ type: 'A', x, y, r, s, e }); ops.push({ op: 'arc', x, y, r, s, e }); },
    stroke() { if (this._currentPath) ops.push({ op: 'stroke', path: this._currentPath }); this._currentPath = null; },
    fill()   { if (this._currentPath) ops.push({ op: 'fill', path: this._currentPath }); this._currentPath = null; },

    // utilities
    _ops: ops
  };
  return ctx;
}

function opsOf(ctx, op) {
  return ctx._ops.filter(e => e.op === op);
}

function strokesBy(ctx, pred) {
  if (!pred) {
    return ctx._ops.filter(e => e.op === 'stroke');
  }
  return ctx._ops.filter(e => e.op === 'stroke' && pred(e));
}

function fillsBy(ctx, pred) {
  if (!pred) {
    return ctx._ops.filter(e => e.op === 'fill');
  }
  return ctx._ops.filter(e => e.op === 'fill' && pred(e));
}

function lastSet(ctx, prop) {
  for (let i = ctx._ops.length - 1; i >= 0; i--) {
    const e = ctx._ops[i];
    if (e.op === prop) return e.v;
  }
  return undefined;
}

const WIDTH = 800, HEIGHT = 600;

t('renderHelix: clears and fills background with default normalized palette', () => {
  const ctx = createMockCtx();
  const NUM = makeNUM();
  renderHelix(ctx, { width: WIDTH, height: HEIGHT, palette: {}, NUM });
  // clearRect and fillRect with correct size
  const clear = opsOf(ctx, 'clearRect')[0];
  assert.equal(clear.w, WIDTH);
  assert.equal(clear.h, HEIGHT);
  const fill = opsOf(ctx, 'fillRect')[0];
  assert.equal(fill.w, WIDTH);
  assert.equal(fill.h, HEIGHT);
  // default bg should be #0b0b12
  assert.equal(fill.fillStyle, '#0b0b12');
});

t('renderHelix: maintains save/restore balance across layers (5 saves/restores)', () => {
  const ctx = createMockCtx();
  renderHelix(ctx, { width: WIDTH, height: HEIGHT, palette: {}, NUM: makeNUM() });
  assert.equal(opsOf(ctx, 'save').length, 5, 'expected 5 save() calls (top + 4 layers)');
  assert.equal(opsOf(ctx, 'restore').length, 5, 'expected 5 restore() calls (top + 4 layers)');
});

t('Vesica field: draws 16 circles (2 base + 14 rings) with alpha 0.25 and lineWidth 2', () => {
  const ctx = createMockCtx();
  const NUM = makeNUM(); // SEVEN=7 -> 14 ring arcs (both sides)
  renderHelix(ctx, { width: WIDTH, height: HEIGHT, palette: {}, NUM });
  const vesicaStrokes = strokesBy(ctx, s =>
    s.path && s.path.alpha === 0.25 && s.path.lineWidth === 2 && s.path.points.some(p => p.type === 'A')
  );
  const arcOps = ctx._ops.filter(e => e.op === 'arc');
  // Vesica contributes 16 arcs in total across its strokes
  const vesicaArcCount = vesicaStrokes.reduce((n, s) => n + s.path.points.filter(p => p.type === 'A').length, 0);
  assert.equal(vesicaArcCount, 16);
  // Ensure strokeStyle taken from first palette layer (default "#9fb8ff")
  assert.ok(vesicaStrokes.every(s => s.path.strokeStyle === '#9fb8ff'));
});

t('Tree of Life: draws 22 path strokes and 10 filled nodes with expected styles', () => {
  const ctx = createMockCtx();
  renderHelix(ctx, { width: WIDTH, height: HEIGHT, palette: {}, NUM: makeNUM() });
  // Paths: alpha 0.4, lineWidth 2.5, strokeStyle layers[1] default "#89f7fe"
  const tolPathStrokes = strokesBy(ctx, s => s.path && s.path.alpha === 0.4 && s.path.lineWidth === 2.5);
  assert.equal(tolPathStrokes.length, 22);
  // Nodes: fills under alpha 0.9, fillStyle "#a0ffa1"
  const tolNodeFills = fillsBy(ctx, f => f.path && f.path.alpha === 0.9 && f.path.fillStyle === '#a0ffa1');
  assert.equal(tolNodeFills.length, 10);
});

t('Fibonacci curve: polyline uses steps+1 points (23) with correct style', () => {
  const ctx = createMockCtx();
  const NUM = makeNUM(); // TWENTYTWO = 22 -> points = 23
  const palette = { layers: ['#L0','#L1','#L2','#FIB','#H0','#H1'], bg: '#BG' };
  renderHelix(ctx, { width: WIDTH, height: HEIGHT, palette, NUM });
  const fibStroke = strokesBy(ctx, s => s.path && s.path.alpha === 0.45 && s.path.lineWidth === 3 && s.path.strokeStyle === '#FIB')[0];
  assert.ok(fibStroke, 'expected a Fibonacci stroke with alpha 0.45 and lw 3');
  const pointCount = fibStroke.path.points.filter(p => p.type === 'M' || p.type === 'L').length;
  assert.equal(pointCount, 23);
});

t('Helix lattice: two strand polylines (145 points each) and 37 rung strokes', () => {
  const ctx = createMockCtx();
  const NUM = makeNUM(); // ONEFORTYFOUR=144 => 145 points per strand; THIRTYTHREE=33 => step = floor(144/33)=4 -> 37 rungs
  const palette = { layers: ['#V0','#T0','#T1','#F','#A','#B'], bg: '#BG' };
  renderHelix(ctx, { width: WIDTH, height: HEIGHT, palette, NUM });
  // Strand polylines: alpha 0.5, lineWidth 2
  const strandStrokes = strokesBy(ctx, s => s.path && s.path.alpha === 0.5 && s.path.lineWidth === 2);
  // There are 3 groups at alpha 0.5: first strand A, then strand B (both stroke), possibly other alpha 0.5? Only strands.
  assert.ok(strandStrokes.length >= 2, 'expected at least two strand strokes');
  const segmentsEach = strandStrokes.map(s => s.path.points.filter(p => p.type === 'M' || p.type === 'L').length);
  assert.ok(segmentsEach.every(n => n === 145), 'each strand should have 145 points');

  // Rungs: alpha 0.35, strokeStyle equals strandColorB (layers[5] '#B')
  const rungStrokes = strokesBy(ctx, s => s.path && s.path.alpha === 0.35 && s.path.strokeStyle === '#B');
  assert.equal(rungStrokes.length, 37);
  // Each rung path should be a single move+line (2 points)
  assert.ok(rungStrokes.every(s => s.path.points.filter(p => p.type === 'M' || p.type === 'L').length === 2));
});

t('Helix rungs: step fallback when THIRTYTHREE too large (step -> 1, 145 rungs)', () => {
  const ctx = createMockCtx();
  const NUM = makeNUM({ THIRTYTHREE: 10000 }); // segments/THIRTYTHREE -> 0 => fallback to 1
  renderHelix(ctx, { width: WIDTH, height: HEIGHT, palette: {}, NUM });
  const rungStrokes = strokesBy(ctx, s => s.path && s.path.alpha === 0.35);
  // Expect a rung per index -> 145
  assert.equal(rungStrokes.length, 145);
});

t('Robustness: handles missing palette and minimal options without throwing', () => {
  const ctx = createMockCtx();
  assert.doesNotThrow(() => renderHelix(ctx, { width: WIDTH, height: HEIGHT, NUM: makeNUM() }));
});