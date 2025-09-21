/**
 * tests/helix-renderer.module.test.mjs
 * Testing library/framework: Node.js built-in assert/strict (no external dependencies).
 * Execution model: this file exports an async run() that the existing harness will await.
 */

import assert from 'node:assert/strict';

// Dynamically locate the module under test (robust to common project layouts)
let renderHelix;
{
  const candidates = [
    '../helix-renderer.mjs',
    '../src/helix-renderer.mjs',
    '../engines/helix-renderer.mjs',
    '../lib/helix-renderer.mjs'
  ];
  let lastErr = null;
  for (const p of candidates) {
    try {
      const mod = await import(p);
      if (typeof mod.renderHelix === 'function') {
        renderHelix = mod.renderHelix;
        break;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  if (typeof renderHelix !== 'function') {
    const msg = lastErr?.message ? ` ${lastErr.message}` : '';
    throw new Error('Unable to import renderHelix from expected paths.' + msg);
  }
}

// Minimal, instrumented Canvas 2D mock
function createMockContext(overrides = {}) {
  const calls = [];
  const fn = (name) => (...args) => { calls.push([name, ...args]); };
  const ctx = {
    canvas: { width: 800, height: 600 },
    save: fn('save'),
    restore: fn('restore'),
    setTransform: fn('setTransform'),
    clearRect: fn('clearRect'),
    fillRect: fn('fillRect'),
    beginPath: fn('beginPath'),
    moveTo: fn('moveTo'),
    lineTo: fn('lineTo'),
    arc: fn('arc'),
    stroke: fn('stroke'),
    fill: fn('fill'),
    _calls: calls
  };
  const trackProp = (k, initial) => {
    let v = initial;
    Object.defineProperty(ctx, k, {
      get() { return v; },
      set(val) { v = val; calls.push([`set:${k}`, val]); }
    });
  };
  trackProp('lineCap', 'butt');
  trackProp('lineJoin', 'miter');
  trackProp('lineWidth', 1);
  trackProp('strokeStyle', '#000');
  trackProp('fillStyle', '#000');
  trackProp('globalAlpha', 1);
  Object.assign(ctx, overrides);
  return ctx;
}

function expectContains(calls, entry, message) {
  assert(calls.some(c => JSON.stringify(c) === JSON.stringify(entry)), message || `Expected calls to contain ${JSON.stringify(entry)}`);
}
function expectSome(calls, pred, message) {
  assert(calls.some(pred), message || 'Expected at least one matching call');
}
function count(calls, pred) {
  return calls.reduce((n, c, i) => n + (pred(c, i) ? 1 : 0), 0);
}

// Public test entry
export async function run() {
  // Null/falsy ctx
  assert.doesNotThrow(() => renderHelix(null));
  assert.doesNotThrow(() => renderHelix(undefined));
  assert.doesNotThrow(() => renderHelix(false));

  // Defaults and setup
  {
    const ctx = createMockContext();
    renderHelix(ctx);
    expectContains(ctx._calls, ['setTransform', 1, 0, 0, 1, 0, 0], 'Reset transform');
    expectContains(ctx._calls, ['clearRect', 0, 0, 800, 600], 'Clear canvas');
    expectContains(ctx._calls, ['set:lineCap', 'round'], 'lineCap round');
    expectContains(ctx._calls, ['set:lineJoin', 'round'], 'lineJoin round');
    expectContains(ctx._calls, ['set:fillStyle', '#0b0b12'], 'Default bg');
    expectContains(ctx._calls, ['fillRect', 0, 0, 800, 600], 'BG fill');
  }

  // Dimensions handling
  {
    const ctx = createMockContext({ canvas: { width: 640, height: 480 } });
    renderHelix(ctx);
    expectContains(ctx._calls, ['clearRect', 0, 0, 640, 480], 'Use canvas dims');
  }
  {
    const ctx = createMockContext();
    renderHelix(ctx, { width: 1024, height: 768 });
    expectContains(ctx._calls, ['clearRect', 0, 0, 1024, 768], 'Use explicit dims');
    expectContains(ctx._calls, ['fillRect', 0, 0, 1024, 768], 'BG with explicit dims');
  }
  {
    const ctx = createMockContext({ canvas: null });
    renderHelix(ctx);
    expectContains(ctx._calls, ['clearRect', 0, 0, 0, 0], 'Fallback 0×0');
  }

  // Palette normalization
  {
    const ctx = createMockContext();
    renderHelix(ctx, { palette: { bg: '#ff0000' } });
    expectContains(ctx._calls, ['set:fillStyle', '#ff0000'], 'Custom bg');
  }
  {
    const ctx = createMockContext();
    renderHelix(ctx, { palette: { layers: ['#111111', '#222222'] } });
    expectContains(ctx._calls, ['set:strokeStyle', '#111111'], 'Custom layers[0]');
    expectSome(ctx._calls, c => c[0] === 'set:strokeStyle' && c[1] === '#222222', 'Custom layers[1]');
  }
  {
    const ctx = createMockContext();
    renderHelix(ctx, { palette: { layers: 'oops' } });
    expectContains(ctx._calls, ['set:strokeStyle', '#b1c7ff'], 'Default layer[0] used');
  }

  // NUM merging robustness
  {
    const ctx = createMockContext();
    assert.doesNotThrow(() => renderHelix(ctx, { NUM: { THREE: 5 } }));
    expectSome(ctx._calls, c => c[0] === 'restore', 'Completed render');
  }

  // Layer signatures and ordering
  {
    const ctx = createMockContext();
    renderHelix(ctx);
    const calls = ctx._calls;
    // Vesica
    expectContains(calls, ['set:globalAlpha', 0.32], 'Vesica alpha 0.32');
    expectContains(calls, ['set:strokeStyle', '#b1c7ff'], 'Vesica color layers[0]');
    assert(count(calls, c => c[0] === 'arc') > 20, 'Many vesica circles');
    // Tree
    expectContains(calls, ['set:strokeStyle', '#89f7fe'], 'Tree paths color');
    expectContains(calls, ['set:fillStyle', '#a0ffa1'], 'Tree nodes color');
    assert(count(calls, c => c[0] === 'moveTo') > 0 && count(calls, c => c[0] === 'lineTo') > 0, 'Tree lines');
    // Fibonacci
    expectContains(calls, ['set:strokeStyle', '#ffd27f'], 'Fibonacci stroke');
    expectContains(calls, ['set:lineWidth', 3], 'Fibonacci width 3');
    expectContains(calls, ['set:fillStyle', '#f5a3ff'], 'Fibonacci markers');
    // Helix
    expectContains(calls, ['set:strokeStyle', '#f5a3ff'], 'Helix strand A');
    expectContains(calls, ['set:strokeStyle', '#d0d0e6'], 'Helix strand B');
    expectContains(calls, ['set:strokeStyle', '#e8e8f0'], 'Helix rungs ink');

    // Order: bg -> vesica -> tree -> fibonacci -> helix
    const idxBg = calls.findIndex(c => c[0] === 'fillRect');
    const idxV = calls.findIndex(c => c[0] === 'set:strokeStyle' && c[1] === '#b1c7ff');
    const idxT = calls.findIndex(c => c[0] === 'set:strokeStyle' && c[1] === '#89f7fe');
    const idxF = calls.findIndex(c => c[0] === 'set:strokeStyle' && c[1] === '#ffd27f');
    const idxH = calls.findIndex(c => c[0] === 'set:strokeStyle' && c[1] === '#f5a3ff');
    assert(idxBg >= 0 && idxV > idxBg && idxT > idxV && idxF > idxT && idxH > idxF, 'Layer drawing order');
  }

  // Size edge cases
  {
    const s = createMockContext();
    renderHelix(s, { width: 1, height: 1 });
    expectContains(s._calls, ['clearRect', 0, 0, 1, 1]);
    const h = createMockContext();
    renderHelix(h, { width: 8192, height: 8192 });
    expectContains(h._calls, ['clearRect', 0, 0, 8192, 8192]);
  }

  // Vesica arc count on square canvas and central arcs near center
  {
    const ctx = createMockContext({ canvas: { width: 900, height: 900 } });
    renderHelix(ctx);
    const arcs = ctx._calls.filter(c => c[0] === 'arc');
    assert(arcs.length >= 65, 'At least 65 arcs expected (grid + central)');
    const lastTwo = arcs.slice(-2);
    lastTwo.forEach(a => {
      const x = a[1], y = a[2];
      assert(Math.abs(x - 450) < 120 && Math.abs(y - 450) < 80, 'Central arcs near center');
    });
  }

  // Idempotency on same options (key ops equal)
  {
    const ctx = createMockContext();
    const opts = { width: 300, height: 300, NUM: { THREE: 5 } };
    renderHelix(ctx, opts);
    const a = ctx._calls.filter(c => ['clearRect', 'fillRect'].includes(c[0]));
    ctx._calls.length = 0;
    renderHelix(ctx, opts);
    const b = ctx._calls.filter(c => ['clearRect', 'fillRect'].includes(c[0]));
    assert.deepEqual(a, b, 'Idempotent key ops with same options');
  }

  // Robustness: extreme NUM and weird colors
  {
    const ctx = createMockContext();
    renderHelix(ctx, {
      NUM: { THREE: 1, SEVEN: 1, NINE: 1, ELEVEN: 100, TWENTYTWO: 1, THIRTYTHREE: 1000, NINETYNINE: 1, ONEFORTYFOUR: 1 }
    });
    expectSome(ctx._calls, c => c[0] === 'restore', 'Completed under extreme NUM');

    const ctx2 = createMockContext();
    renderHelix(ctx2, { palette: { bg: 'bad', ink: null, layers: [undefined, false, 123, {}, [], 'rgb(256,256,256)'] } });
    expectSome(ctx2._calls, c => c[0] === 'restore', 'Completed under invalid colors');
  }
}

// Allow standalone execution (optional)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await run();
      console.log('helix-renderer.module.test.mjs: OK');
    } catch (e) {
      console.error('helix-renderer.module.test.mjs: FAIL');
      console.error(e);
      process.exit(1);
    }
  })();
}