// NOTE: Testing library/framework detection:
// - If the project uses a runner like Vitest/Jest/Mocha, this test should run under that runner.
// - The file uses minimal Node-style assertions via 'assert' to avoid adding dependencies.
// - If the repository uses a different assertion library (e.g., expect), you can adapt easily by replacing asserts.

import assert from 'node:assert/strict';

// Attempt common import locations; adjust as needed for your repo.
let renderHelix, ensurePalette, createStage, computeTreeNodes, computeTreeConnections, strokePolyline, hexToRgba;
const candidatePaths = [
  './helix-renderer.mjs',
  'src/helix-renderer.mjs',
  'lib/helix-renderer.mjs',
  'packages/helix-renderer/helix-renderer.mjs'
];
let lastErr;
for (const p of candidatePaths) {
  try {
    const m = await import(new URL(p, import.meta.url));
    renderHelix = m.renderHelix;
    ensurePalette = m.ensurePalette;
    createStage = m.createStage;
    computeTreeNodes = m.computeTreeNodes;
    computeTreeConnections = m.computeTreeConnections;
    strokePolyline = m.strokePolyline;
    hexToRgba = m.hexToRgba;
    break;
  } catch (e) {
    lastErr = e;
  }
}
if (!renderHelix) {
  throw new Error("Could not import helix-renderer.mjs from expected locations. Last error: " + lastErr);
}

// Simple 2D context mock that records calls and property sets.
function createCtxMock() {
  const calls = [];
  const ctx = new Proxy({
    // state
    _state: {
      fillStyle: undefined,
      strokeStyle: undefined,
      lineWidth: undefined,
      globalAlpha: undefined,
      font: undefined,
      textAlign: undefined,
      textBaseline: undefined,
    },
    // methods used by renderer
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    beginPath() { calls.push(['beginPath']); },
    closePath() { calls.push(['closePath']); },
    fill() { calls.push(['fill']); },
    stroke() { calls.push(['stroke']); },
    fillRect(x, y, w, h) { calls.push(['fillRect', x, y, w, h]); },
    arc(x, y, r, a0, a1, ccw) { calls.push(['arc', x, y, r, a0, a1, ccw]); },
    moveTo(x, y) { calls.push(['moveTo', x, y]); },
    lineTo(x, y) { calls.push(['lineTo', x, y]); },
    fillText(text, x, y) { calls.push(['fillText', text, x, y]); },
    // property intercepts
    get fillStyle() { return this._state.fillStyle; },
    set fillStyle(v) { this._state.fillStyle = v; calls.push(['set', 'fillStyle', v]); },
    get strokeStyle() { return this._state.strokeStyle; },
    set strokeStyle(v) { this._state.strokeStyle = v; calls.push(['set', 'strokeStyle', v]); },
    get lineWidth() { return this._state.lineWidth; },
    set lineWidth(v) { this._state.lineWidth = v; calls.push(['set', 'lineWidth', v]); },
    get globalAlpha() { return this._state.globalAlpha; },
    set globalAlpha(v) { this._state.globalAlpha = v; calls.push(['set', 'globalAlpha', v]); },
    get font() { return this._state.font; },
    set font(v) { this._state.font = v; calls.push(['set', 'font', v]); },
    get textAlign() { return this._state.textAlign; },
    set textAlign(v) { this._state.textAlign = v; calls.push(['set', 'textAlign', v]); },
    get textBaseline() { return this._state.textBaseline; },
    set textBaseline(v) { this._state.textBaseline = v; calls.push(['set', 'textBaseline', v]); },
  }, {
    get(target, prop, receiver) {
      if (prop === '__calls') return calls;
      return Reflect.get(target, prop, receiver);
    }
  });
  return ctx;
}

function approxEqual(a, b, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

function withinRange(v, min, max) {
  return v >= min && v <= max;
}

// Tests start

describe('ensurePalette', () => {
  it('returns defaults when palette is undefined', () => {
    const p = ensurePalette(undefined);
    assert.equal(p.bg, '#0b0b12');
    assert.equal(p.ink, '#e8e8f0');
    assert.equal(p.layers.length, 6);
  });

  it('fills missing fields and trims/extends layers to six', () => {
    const p = ensurePalette({ bg: '#111111', layers: ['#a', '#b', '#c'] });
    assert.equal(p.bg, '#111111');
    assert.equal(p.ink, '#e8e8f0'); // fallback ink
    assert.equal(p.layers.length, 6);
    assert.deepEqual(p.layers.slice(0, 3), ['#a', '#b', '#c']);
  });

  it('uses provided ink and layers fully when valid', () => {
    const custom = { bg: '#222', ink: '#333', layers: ['#1','#2','#3','#4','#5','#6','#7'] };
    const p = ensurePalette(custom);
    assert.equal(p.bg, '#222');
    assert.equal(p.ink, '#333');
    assert.equal(p.layers.length, 6);
    assert.deepEqual(p.layers, ['#1','#2','#3','#4','#5','#6']);
  });
});

describe('createStage', () => {
  it('calculates defaults when width/height are missing', () => {
    const s = createStage(undefined, undefined, undefined);
    assert.equal(s.width, 1440);
    assert.equal(s.height, 900);
    assert.ok(s.margin > 0);
    assert.equal(s.centerX, s.width / 2);
    assert.equal(s.centerY, s.height / 2);
    assert.equal(s.innerWidth, s.width - 2 * s.margin);
    assert.equal(s.innerHeight, s.height - 2 * s.margin);
  });

  it('respects provided dimensions and numerology for margin', () => {
    const numerology = { ONEFORTYFOUR: 144, NINE: 9 };
    const s = createStage(1000, 800, numerology);
    assert.equal(s.width, 1000);
    assert.equal(s.height, 800);
    // margin = min(w,h)/ (144/9) = 800 / 16 = 50
    assert.equal(s.margin, 50);
    assert.equal(s.innerWidth, 900);
    assert.equal(s.innerHeight, 700);
  });
});

describe('computeTreeConnections', () => {
  it('has stable connection list size and pairs within 0..9', () => {
    const conns = computeTreeConnections();
    assert.ok(Array.isArray(conns));
    assert.ok(conns.length >= 20);
    conns.forEach(([a,b]) => {
      assert.ok(Number.isInteger(a) && Number.isInteger(b));
      assert.ok(withinRange(a, 0, 9) && withinRange(b, 0, 9));
    });
  });
});

describe('computeTreeNodes', () => {
  it('returns 10 nodes with radius > 0 within stage bounds', () => {
    const s = createStage(800, 600);
    const nodes = computeTreeNodes(s);
    assert.equal(nodes.length, 10);
    nodes.forEach(n => {
      assert.ok(n.radius > 0);
      assert.ok(withinRange(n.x, s.centerX - s.innerWidth, s.centerX + s.innerWidth));
      assert.ok(withinRange(n.y, s.centerY - s.innerHeight, s.centerY + s.innerHeight));
    });
  });
});

describe('strokePolyline', () => {
  it('does nothing for fewer than 2 points', () => {
    const ctx = createCtxMock();
    strokePolyline(ctx, []);
    strokePolyline(ctx, [{x:1,y:2}]);
    const calls = ctx.__calls;
    // Should not call beginPath/moveTo/lineTo/stroke
    assert.equal(calls.findIndex(c => c[0] === 'beginPath'), -1);
    assert.equal(calls.findIndex(c => c[0] === 'moveTo'), -1);
    assert.equal(calls.findIndex(c => c[0] === 'lineTo'), -1);
    assert.equal(calls.findIndex(c => c[0] === 'stroke'), -1);
  });

  it('draws moveTo once and lineTo N-1 times for N points', () => {
    const ctx = createCtxMock();
    const pts = [{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3}];
    strokePolyline(ctx, pts);
    const calls = ctx.__calls;
    const moveCount = calls.filter(c => c[0] === 'moveTo').length;
    const lineCount = calls.filter(c => c[0] === 'lineTo').length;
    assert.equal(moveCount, 1);
    assert.equal(lineCount, pts.length - 1);
    assert.ok(calls.some(c => c[0] === 'stroke'));
  });
});

describe('hexToRgba', () => {
  it('converts 6-digit hex with alpha', () => {
    const s = hexToRgba('#112233', 0.5);
    assert.equal(s, 'rgba(17, 34, 51, 0.5)');
  });
  it('converts 3-digit hex', () => {
    const s = hexToRgba('#abc', 1);
    assert.equal(s, 'rgba(170, 187, 204, 1)');
  });
  it('clamps alpha and handles missing hex', () => {
    const s = hexToRgba(undefined, 2);
    assert.equal(s, 'rgba(232, 232, 240, 1)');
    const s2 = hexToRgba('#000000', -1);
    assert.equal(s2, 'rgba(0, 0, 0, 0)');
  });
});

describe('renderHelix orchestration', () => {
  it('skips when ctx or options missing', () => {
    assert.doesNotThrow(() => renderHelix(null, null));
    assert.doesNotThrow(() => renderHelix(createCtxMock(), null));
  });

  it('draws layers and optional notice', () => {
    const ctx = createCtxMock();
    const options = {
      width: 600,
      height: 400,
      palette: { bg: '#000000', ink: '#ffffff', layers: ['#1','#2','#3','#4','#5','#6'] },
      numerology: { THREE:3, SEVEN:7, ELEVEN:11, NINE:9, THIRTYTHREE:33, TWENTYTWO:22, NINETYNINE:99, ONEFORTYFOUR:144 },
      notice: 'Hello'
    };
    renderHelix(ctx, options);
    const calls = ctx.__calls;

    // Background fill occurred
    assert.ok(calls.some(c => c[0] === 'fillRect' && c[1] === 0 && c[2] === 0));

    // Vesica: at least two arcs for circles and grid arcs
    const arcCount = calls.filter(c => c[0] === 'arc').length;
    assert.ok(arcCount >= 2);

    // Tree of Life: expects multiple strokes (paths + nodes)
    const strokeCount = calls.filter(c => c[0] === 'stroke').length;
    assert.ok(strokeCount >= 10);

    // Notice text drawn
    assert.ok(calls.some(c => c[0] === 'fillText' && c[1] === 'Hello'));
  });

  it('omits notice when not provided', () => {
    const ctx = createCtxMock();
    const options = {
      width: 600,
      height: 400,
      palette: { layers: ['#1','#2','#3','#4','#5','#6'] },
      numerology: null
    };
    renderHelix(ctx, options);
    const calls = ctx.__calls;
    assert.equal(calls.findIndex(c => c[0] === 'fillText'), -1);
  });
});

// Minimal describe/it shim if running via node without a runner (allows `node tests/helix-renderer.test.mjs`)
function describe(name, fn) {
  console.log(`\nSuite: ${name}`);
  fn();
}
function it(name, fn) {
  try {
    const ret = fn();
    if (ret && typeof ret.then === 'function') {
      ret.then(() => console.log(`  ✓ ${name}`)).catch((e) => {
        console.error(`  ✗ ${name}`);
        console.error(e);
        process.exitCode = 1;
      });
    } else {
      console.log(`  ✓ ${name}`);
    }
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}