/**
 * helix-renderer.test.mjs
 * Framework: Node.js built-in test runner (node:test) + assert/strict
 * Note: These tests use a fake 2D canvas context and dynamic import to locate the module under test.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Utility: approximate float compare
const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));

// Fake 2D canvas context to capture draw calls and property assignments
class FakeCtx {
  constructor() {
    this.calls = [];
    this.arcs = [];
    this.moves = [];
    this.lines = [];
    this.clearRects = [];
    this.fillRects = [];
    this.propertyChanges = [];
    this._strokeStyle = null;
    this._fillStyle = null;
    this._lineWidth = null;
    this._lineCap = null;
    this._lineJoin = null;
    this.saves = 0;
    this.restores = 0;
    this.fills = 0;
  }
  get strokeStyle() { return this._strokeStyle; }
  set strokeStyle(v) { this._strokeStyle = v; this.propertyChanges.push({ prop: 'strokeStyle', value: v }); }
  get fillStyle() { return this._fillStyle; }
  set fillStyle(v) { this._fillStyle = v; this.propertyChanges.push({ prop: 'fillStyle', value: v }); }
  get lineWidth() { return this._lineWidth; }
  set lineWidth(v) { this._lineWidth = v; this.propertyChanges.push({ prop: 'lineWidth', value: v }); }
  get lineCap() { return this._lineCap; }
  set lineCap(v) { this._lineCap = v; this.propertyChanges.push({ prop: 'lineCap', value: v }); }
  get lineJoin() { return this._lineJoin; }
  set lineJoin(v) { this._lineJoin = v; this.propertyChanges.push({ prop: 'lineJoin', value: v }); }

  record(name, args) { this.calls.push({ name, args }); }

  save() { this.saves++; this.record('save', []); }
  restore() { this.restores++; this.record('restore', []); }

  clearRect(x, y, w, h) { this.clearRects.push([x, y, w, h]); this.record('clearRect', [x, y, w, h]); }
  fillRect(x, y, w, h) { this.fillRects.push([x, y, w, h]); this.record('fillRect', [x, y, w, h]); }

  beginPath() { this.record('beginPath', []); }
  moveTo(x, y) { this.moves.push({ x, y }); this.record('moveTo', [x, y]); }
  lineTo(x, y) { this.lines.push({ x, y }); this.record('lineTo', [x, y]); }
  arc(cx, cy, r, a0, a1) { this.arcs.push({ cx, cy, r, a0, a1 }); this.record('arc', [cx, cy, r, a0, a1]); }

  stroke() { this.record('stroke', []); }
  fill() { this.fills++; this.record('fill', []); }
}

// Try common locations for the module under test
async function loadRenderer() {
  const candidates = [
    '../src/helix-renderer.mjs',
    '../helix-renderer.mjs',
    '../lib/helix-renderer.mjs',
    '../../src/helix-renderer.mjs',
    './helix-renderer.mjs'
  ];
  for (const rel of candidates) {
    try {
      const url = new URL(rel, import.meta.url);
      const mod = await import(url.href);
      if (typeof mod.renderHelix === 'function') return mod;
    } catch (_) { /* keep trying */ }
  }
  throw new Error('renderHelix module not found in expected locations.');
}

const { renderHelix } = await loadRenderer();

const NUM = Object.freeze({
  THREE: 3,
  SEVEN: 7,
  NINE: 9,
  ELEVEN: 11,
  TWENTYTWO: 22,
  THIRTYTHREE: 33,
  NINETYNINE: 99,
  ONEFORTYFOUR: 144
});

const basePalette = Object.freeze({
  bg: '#0b0f13',
  layers: ['#6a88cc', '#cc886a', '#6acc88', '#cfcfd4']
});

function renderOnce(width = 900, height = 600, palette = basePalette) {
  const ctx = new FakeCtx();
  renderHelix(ctx, { width, height, palette, NUM });
  return ctx;
}

test('renderHelix draws background, layers, and expected totals', () => {
  const width = 900, height = 600;
  const ctx = renderOnce(width, height);

  // Background prep
  assert.equal(ctx.clearRects.length, 1, 'clearRect should be called once');
  assert.deepEqual(ctx.clearRects[0], [0, 0, width, height], 'clearRect should cover full canvas');
  assert.equal(ctx.fillRects.length, 1, 'fillRect should be called once for background');
  assert.deepEqual(ctx.fillRects[0], [0, 0, width, height], 'fillRect should cover full canvas');

  // Save/restore balance: 1 (top) + 4 (layers) each
  assert.equal(ctx.saves, 5, 'Expected 5 ctx.save() calls');
  assert.equal(ctx.restores, 5, 'Expected 5 ctx.restore() calls');

  // Totals derived from implementation:
  // Vesica: 3x3x2 = 18 arcs/strokes
  // Tree paths: 22 begin/moveTo/lineTo/stroke
  // Tree nodes: 10 begin/arc/fill
  // Fibonacci: 1 begin + 33 lineTo + 1 stroke
  // Helix strands: 2 begins + (144+144) lineTo + 2 strokes
  // Crossbars: 10 begin/moveTo/lineTo/stroke
  const expectedBeginPath = 18 + 22 + 10 + 1 + 2 + 10; // 63
  const expectedStroke = 18 + 22 + 1 + 2 + 10;          // 53
  const expectedFill = 10;                               // nodes
  const expectedLineTo = 22 + 33 + 144 + 144 + 10;      // 353
  const expectedMoveTo = 22 + 1 + 2 + 10;               // 35

  const count = n => ctx.calls.filter(c => c.name === n).length;

  assert.equal(count('beginPath'), expectedBeginPath, 'Unexpected number of beginPath calls');
  assert.equal(count('stroke'), expectedStroke, 'Unexpected number of stroke calls');
  assert.equal(ctx.fills, expectedFill, 'Unexpected number of fill calls');
  assert.equal(ctx.lines.length, expectedLineTo, 'Unexpected number of lineTo calls');
  assert.equal(ctx.moves.length, expectedMoveTo, 'Unexpected number of moveTo calls');

  // Arc radius verification: vesica radius = min(w,h)/9, node radius = min(w,h)/66
  const minDim = Math.min(width, height);
  const rVesica = minDim / NUM.NINE; // 600/9 = 66.666...
  const rNode = minDim / ((NUM.TWENTYTWO * NUM.NINE) / NUM.THREE); // 600/66 = 9.0909...

  const vesicaArcs = ctx.arcs.filter(a => approx(a.r, rVesica));
  const nodeArcs = ctx.arcs.filter(a => approx(a.r, rNode));
  assert.equal(vesicaArcs.length, NUM.THREE * NUM.THREE * 2, 'Expected 18 vesica arcs');
  assert.equal(nodeArcs.length, 10, 'Expected 10 node arcs');
  assert.equal(ctx.arcs.length, 28, 'Total arcs should be 28 (18 vesica + 10 nodes)');

  // Property assignments: palette colors used and calming caps/joins set
  const assigns = ctx.propertyChanges;
  const saw = (prop, value) => assigns.some(a => a.prop === prop && a.value === value);
  assert.ok(saw('fillStyle', basePalette.bg), 'Background fillStyle should be set to palette.bg');
  assert.ok(saw('strokeStyle', basePalette.layers[0]), 'Vesica strokeStyle should be set');
  assert.ok(saw('strokeStyle', basePalette.layers[1]), 'Tree strokeStyle should be set');
  assert.ok(saw('strokeStyle', basePalette.layers[2]), 'Fibonacci strokeStyle should be set');
  assert.ok(saw('strokeStyle', basePalette.layers[3]), 'Helix strokeStyle should be set');
  assert.ok(assigns.some(a => a.prop === 'lineCap' && a.value === 'round'), 'lineCap should be set to round');
  assert.ok(assigns.some(a => a.prop === 'lineJoin' && a.value === 'round'), 'lineJoin should be set to round');
});

test('renderHelix maintains counts under non-square aspect ratios', () => {
  const width = 300, height = 500;
  const ctx = renderOnce(width, height);

  const count = n => ctx.calls.filter(c => c.name === n).length;

  assert.equal(ctx.saves, 5);
  assert.equal(ctx.restores, 5);
  assert.equal(count('beginPath'), 63);
  assert.equal(count('stroke'), 53);
  assert.equal(ctx.fills, 10);
  assert.equal(ctx.lines.length, 353);
  assert.equal(ctx.moves.length, 35);

  const minDim = Math.min(width, height);
  const rVesica = minDim / 9;
  const rNode = minDim / 66;
  const vesicaArcs = ctx.arcs.filter(a => approx(a.r, rVesica));
  const nodeArcs = ctx.arcs.filter(a => approx(a.r, rNode));
  assert.equal(vesicaArcs.length, 18);
  assert.equal(nodeArcs.length, 10);
});

test('renderHelix throws if ctx is missing required methods', () => {
  const badCtx = {};
  const NUM = { THREE:3, SEVEN:7, NINE:9, ELEVEN:11, TWENTYTWO:22, THIRTYTHREE:33, NINETYNINE:99, ONEFORTYFOUR:144 };
  const palette = { bg: '#000', layers: ['#1','#2','#3','#4'] };
  assert.throws(() => {
    renderHelix(badCtx, { width: 100, height: 100, palette, NUM });
  }, /save|is not a function/i);
});