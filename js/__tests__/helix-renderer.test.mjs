/*
  Test framework note:
  - Designed to run under Jest or Vitest (describe/it). Assertions via Node's assert/strict.
  - Also works under Mocha (BDD). No reliance on jest.fn/vi.fn; custom minimal spies are used.
  - If the project uses Node's built-in "node:test", consider wrapping these with a tiny adapter,
    or migrate the "describe/it" shells to that runner; assertions will remain valid.

  Scope:
  - Tests cover the public function renderHelix from ../helix-renderer.mjs.
  - We mock the 2D canvas context and assert side-effects: state changes, call counts, and style usage.
  - Focus on the PR diff content: vesica field, tree-of-life, fibonacci curve, double helix, palette normalization,
    numeric constants usage, safe defaults, and ND-safe drawing invariants.

  Important:
  - These tests intentionally avoid pixel rendering. They validate deterministic draw sequences and styles.
*/

import assert from 'node:assert/strict';
import { renderHelix } from '../helix-renderer.mjs';

const DEFAULT_PALETTE = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f", "#f5a3ff", "#d0d0e6"]
};

// Minimal BDD fallbacks to allow running even if a global runner isn't injected during ad-hoc execution
const $describe = typeof describe === 'function' ? describe : (name, fn) => fn();
const $it = typeof it === 'function' ? it : (name, fn) => fn();

class CanvasContextMock {
  constructor(width = 800, height = 600) {
    this.canvas = { width, height };
    this._state = {
      strokeStyle: '#000',
      fillStyle: '#000',
      globalAlpha: 1,
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter'
    };
    this.calls = [];   // property sets and ops like setTransform/clearRect/fillRect
    this.strokes = []; // collected at each stroke()
    this.fills = [];   // collected at each fill()
    this._saves = 0;
    this._restores = 0;
    this._newPath();
    this._defineTrackedProp('strokeStyle', 'setStrokeStyle');
    this._defineTrackedProp('fillStyle', 'setFillStyle');
    this._defineTrackedProp('globalAlpha', 'setGlobalAlpha');
    this._defineTrackedProp('lineWidth', 'setLineWidth');
    this._defineTrackedProp('lineCap', 'setLineCap');
    this._defineTrackedProp('lineJoin', 'setLineJoin');
  }

  _defineTrackedProp(prop, tag) {
    Object.defineProperty(this, prop, {
      get: () => this._state[prop],
      set: (v) => {
        this._state[prop] = v;
        this.calls.push({ type: tag, value: v });
      },
      enumerable: true,
      configurable: true
    });
  }

  _newPath() {
    this._path = { arcs: 0, lineTos: 0, hasMove: false };
  }

  // Canvas API methods used by the module
  save() { this._saves++; }
  restore() { this._restores++; }
  setTransform(a, b, c, d, e, f) { this.calls.push({ type: 'setTransform', args: [a,b,c,d,e,f] }); }
  clearRect(x, y, w, h) { this.calls.push({ type: 'clearRect', args: [x,y,w,h] }); }
  fillRect(x, y, w, h) { this.calls.push({ type: 'fillRect', args: [x,y,w,h], fillStyle: this.fillStyle, globalAlpha: this.globalAlpha }); }
  beginPath() { this._newPath(); }
  arc(x, y, r, sa, ea) { this._path.arcs++; }
  moveTo(x, y) { this._path.hasMove = true; }
  lineTo(x, y) { this._path.lineTos++; }
  stroke() {
    this.strokes.push({
      strokeStyle: this.strokeStyle,
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      arcs: this._path.arcs,
      lineTos: this._path.lineTos
    });
  }
  fill() {
    this.fills.push({
      fillStyle: this.fillStyle,
      globalAlpha: this.globalAlpha,
      arcs: this._path.arcs
    });
  }

  // Helpers for assertions
  get saves() { return this._saves; }
  get restores() { return this._restores; }

  findCall(type) { return this.calls.find(c => c.type === type); }
  findCalls(type) { return this.calls.filter(c => c.type === type); }
}

function makeCtx(w = 800, h = 600) {
  return new CanvasContextMock(w, h);
}

$describe('helix-renderer: renderHelix()', () => {
  $it('returns early (no throw) when ctx is falsy', () => {
    assert.doesNotThrow(() => renderHelix(undefined));
    assert.doesNotThrow(() => renderHelix(null));
  });

  $it('uses options.width/height over ctx.canvas size for clearRect', () => {
    const ctx = makeCtx(500, 400);
    renderHelix(ctx, { width: 1000, height: 800 });
    const cr = ctx.findCall('clearRect');
    assert.deepEqual(cr.args, [0, 0, 1000, 800]);
  });

  $it('falls back to ctx.canvas width/height when options omit dimensions', () => {
    const ctx = makeCtx(720, 540);
    renderHelix(ctx, {});
    const cr = ctx.findCall('clearRect');
    assert.deepEqual(cr.args, [0, 0, 720, 540]);
  });

  $it('resets transform and sets round line caps/joins', () => {
    const ctx = makeCtx();
    renderHelix(ctx, { width: 600, height: 400 });
    const st = ctx.findCall('setTransform');
    assert.deepEqual(st.args, [1, 0, 0, 1, 0, 0]);
    // Final state should be "round" (module sets before drawing)
    const lastCap = ctx.findCalls('setLineCap').pop();
    const lastJoin = ctx.findCalls('setLineJoin').pop();
    assert.equal(lastCap.value, 'round');
    assert.equal(lastJoin.value, 'round');
  });

  $it('fills background with provided palette.bg', () => {
    const ctx = makeCtx(640, 480);
    const palette = { bg: '#123456' };
    renderHelix(ctx, { palette });
    const fr = ctx.findCall('fillRect');
    assert.equal(fr.fillStyle, '#123456');
    assert.deepEqual(fr.args, [0, 0, 640, 480]);
  });

  $it('draws vesica field grid arcs (63) with expected style and softness', () => {
    const ctx = makeCtx(770, 770);
    renderHelix(ctx, {});
    const strokes = ctx.strokes.filter(s =>
      s.strokeStyle === DEFAULT_PALETTE.layers[0] &&
      s.globalAlpha === 0.32 &&
      s.lineWidth === 1.5 &&
      s.arcs >= 1 && s.lineTos === 0
    );
    assert.equal(strokes.length, 63, 'expected 9x7 circle strokes');
  });

  $it('draws central vesica pair (2 arcs) with accent alpha/width', () => {
    const ctx = makeCtx(800, 600);
    renderHelix(ctx, {});
    const strokes = ctx.strokes.filter(s =>
      s.strokeStyle === DEFAULT_PALETTE.layers[0] &&
      s.globalAlpha === 0.45 &&
      s.lineWidth === 2 &&
      s.arcs >= 1
    );
    assert.equal(strokes.length, 2, 'expected two highlighted central arcs');
  });

  $it('renders Tree-of-Life edges (22 lines) with layers[1] style', () => {
    const ctx = makeCtx(800, 900);
    renderHelix(ctx, {});
    const pathStrokes = ctx.strokes.filter(s =>
      s.strokeStyle === DEFAULT_PALETTE.layers[1] &&
      s.globalAlpha === 0.7 &&
      s.lineWidth === 2.2 &&
      s.lineTos >= 1
    );
    assert.equal(pathStrokes.length, 22, 'expected 22 scaffold path strokes');
  });

  $it('fills 10 Tree-of-Life nodes with layers[2] at high alpha', () => {
    const ctx = makeCtx(900, 900);
    renderHelix(ctx, {});
    const nodeFills = ctx.fills.filter(f =>
      f.fillStyle === DEFAULT_PALETTE.layers[2] &&
      f.globalAlpha === 0.95 &&
      f.arcs >= 1
    );
    assert.equal(nodeFills.length, 10, 'expected 10 sephirot fills');
  });

  $it('strokes Fibonacci curve once and fills 10 pacing markers with layers[4]', () => {
    const ctx = makeCtx(1000, 800);
    renderHelix(ctx, {});
    // One main curve stroke (lineWidth=3, alpha=0.85, style=layers[3])
    const curveStrokes = ctx.strokes.filter(s =>
      s.strokeStyle === DEFAULT_PALETTE.layers[3] &&
      s.globalAlpha === 0.85 &&
      s.lineWidth === 3
    );
    assert.ok(curveStrokes.length >= 1, 'expected main Fibonacci curve stroke');

    // 10 quiet markers
    const markers = ctx.fills.filter(f =>
      f.fillStyle === DEFAULT_PALETTE.layers[4] &&
      f.globalAlpha === 0.55 &&
      f.arcs >= 1
    );
    assert.equal(markers.length, 10, 'expected 10 Fibonacci markers');
  });

  $it('renders double helix polylines (left/right) with layers[4] and layers[5]', () => {
    const ctx = makeCtx(1200, 900);
    renderHelix(ctx, {});
    const left = ctx.strokes.find(s =>
      s.strokeStyle === DEFAULT_PALETTE.layers[4] && s.lineWidth === 2.4 && s.globalAlpha === 0.85
    );
    const right = ctx.strokes.find(s =>
      s.strokeStyle === DEFAULT_PALETTE.layers[5] && s.lineWidth === 2.4 && s.globalAlpha === 0.85
    );
    assert.ok(left, 'expected left strand stroke in layers[4]');
    assert.ok(right, 'expected right strand stroke in layers[5]');
  });

  $it('draws lattice rungs with palette.ink (26 by default over 99 samples)', () => {
    const ctx = makeCtx(1000, 1000);
    renderHelix(ctx, {});
    const rungs = ctx.strokes.filter(s =>
      s.strokeStyle === DEFAULT_PALETTE.ink &&
      s.globalAlpha === 0.35 &&
      s.lineWidth === 1.5 &&
      s.arcs === 0 &&
      s.lineTos >= 1
    );
    assert.equal(rungs.length, 26, 'expected 26 rung connectors');
  });

  $it('respects NUM.TWENTYTWO override for rung frequency (TWENTYTWO=11 -> 12 rungs)', () => {
    const ctx = makeCtx(1000, 1000);
    renderHelix(ctx, { NUM: { TWENTYTWO: 11 } });
    const rungs = ctx.strokes.filter(s =>
      s.strokeStyle === DEFAULT_PALETTE.ink &&
      s.globalAlpha === 0.35 &&
      s.lineWidth === 1.5 &&
      s.arcs === 0 &&
      s.lineTos >= 1
    );
    assert.equal(rungs.length, 12, 'expected 12 rungs when TWENTYTWO=11');
  });

  $it('normalises palette: partial layer overrides and non-array layers fallback', () => {
    const ctx1 = makeCtx(800, 600);
    renderHelix(ctx1, { palette: { layers: ['#111111', '#222222'] } });
    // Tree-of-Life edges use layers[1]:
    const edgeStroke = ctx1.strokes.find(s => s.lineTos >= 1 && s.globalAlpha === 0.7 && s.lineWidth === 2.2);
    assert.equal(edgeStroke.strokeStyle, '#222222', 'layers[1] override should apply');

    const ctx2 = makeCtx(800, 600);
    renderHelix(ctx2, { palette: { layers: 'not-an-array' } });
    // Should fall back to defaults; verify a Fibonacci curve stroke style (layers[3]):
    const fibStroke = ctx2.strokes.find(s => s.lineWidth === 3 && s.globalAlpha === 0.85);
    assert.equal(fibStroke.strokeStyle, DEFAULT_PALETTE.layers[3], 'non-array layers should fall back to defaults');
  });

  $it('allows overriding palette.ink for rung connectors', () => {
    const customInk = '#ff00ff';
    const ctx = makeCtx(900, 900);
    renderHelix(ctx, { palette: { ink: customInk } });
    const rung = ctx.strokes.find(s =>
      s.strokeStyle === customInk &&
      s.globalAlpha === 0.35 &&
      s.lineWidth === 1.5 &&
      s.lineTos >= 1 &&
      s.arcs === 0
    );
    assert.ok(rung, 'expected at least one rung using custom ink colour');
  });

  $it('clears to 0x0 when neither options nor canvas dimensions are provided', () => {
    const ctx = new CanvasContextMock(0, 0);
    // Remove canvas to simulate entirely missing sizing info
    delete ctx.canvas;
    renderHelix(ctx, {});
    const cr = ctx.findCall('clearRect');
    assert.deepEqual(cr.args, [0, 0, 0, 0]);
  });

  $it('balances save()/restore() calls across the full render', () => {
    const ctx = makeCtx(800, 600);
    renderHelix(ctx, {});
    // Expect equal saves/restores from: top-level + each sub-layer function
    assert.equal(ctx.saves, ctx.restores, 'canvas state should be balanced (save/restore counts equal)');
    assert.ok(ctx.saves >= 6, 'expected at least 6 save/restore pairs for all layers and background');
  });
});