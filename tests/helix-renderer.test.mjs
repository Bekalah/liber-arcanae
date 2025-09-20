// Test suite for helix-renderer.mjs
// Framework: Node's built-in test runner (node:test) with assert (ESM).
// If this project uses Jest/Vitest/Mocha, you can replace imports accordingly:
 //  - Vitest: import { describe, it, expect, beforeEach } from 'vitest';
 //  - Jest (ESM): import { describe, it, expect, beforeEach, jest } from '@jest/globals';
 //  - Mocha + Chai: import { describe, it, beforeEach } from 'mocha'; import { expect } from 'chai';

import test from 'node:test';
import assert from 'node:assert/strict';

// Try multiple likely import locations for the module under test.
// Adjust these paths if the helix-renderer.mjs file lives elsewhere.

const importPaths = [
  '../helix-renderer.mjs',
  './helix-renderer.mjs',
  '../src/helix-renderer.mjs',
  '../lib/helix-renderer.mjs',
  '../modules/helix-renderer.mjs'
];

let cachedRenderHelix = null;
async function getRenderHelix() {
  if (cachedRenderHelix) return cachedRenderHelix;

  let importError = null;
  for (const path of importPaths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const mod = await import(path);
      if (mod && typeof mod.renderHelix === 'function') {
        cachedRenderHelix = mod.renderHelix;
        break;
      }
    } catch (e) {
      importError = e;
    }
  }

  if (!cachedRenderHelix) {
    throw new Error(
      "Could not import renderHelix from helix-renderer.mjs. " +
      "Tried common paths relative to tests/. Please adjust the import path in tests/helix-renderer.test.mjs. " +
      `Last import error: ${importError?.message ?? 'n/a'}`
    );
  }

  return cachedRenderHelix;
}

// Minimal NUM constants used by the renderer
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

// Helper: create a mock 2D context that records calls and property sets.
function createMockCtx() {
  const calls = [];
  // Use getters/setters to record style assignments
  let _fillStyle = null;
  let _strokeStyle = null;
  let _lineWidth = null;
  let _lineCap = null;
  let _lineJoin = null;

  const record = (name, args = []) => {
    calls.push({ name, args });
  };

  const ctx = {
    // stateful props with setters
    get fillStyle() { return _fillStyle; },
    set fillStyle(v) { _fillStyle = v; record('set:fillStyle', [v]); },

    get strokeStyle() { return _strokeStyle; },
    set strokeStyle(v) { _strokeStyle = v; record('set:strokeStyle', [v]); },

    get lineWidth() { return _lineWidth; },
    set lineWidth(v) { _lineWidth = v; record('set:lineWidth', [v]); },

    get lineCap() { return _lineCap; },
    set lineCap(v) { _lineCap = v; record('set:lineCap', [v]); },

    get lineJoin() { return _lineJoin; },
    set lineJoin(v) { _lineJoin = v; record('set:lineJoin', [v]); },

    // 2D methods
    save: () => record('save'),
    restore: () => record('restore'),
    clearRect: (...args) => record('clearRect', args),
    fillRect: (...args) => record('fillRect', args),
    beginPath: () => record('beginPath'),
    moveTo: (...args) => record('moveTo', args),
    lineTo: (...args) => record('lineTo', args),
    arc: (...args) => record('arc', args),
    stroke: () => record('stroke'),
    fill: () => record('fill'),
  };

  return { ctx, calls };
}

// Common palette used across tests
const palette = Object.freeze({
  bg: '#111827',
  layers: ['#60a5fa', '#34d399', '#fbbf24', '#f472b6'], // vesica, tree, fib, helix
});

test('renderHelix: draws background and uses full-canvas clear/fill with ND-safe palette', async () => {
  const renderHelix = await getRenderHelix();

  const width = 800;
  const height = 600;
  const { ctx, calls } = createMockCtx();

  renderHelix(ctx, { width, height, palette, NUM });

  // First calls should save, clear, set fillStyle, fillRect
  assert.equal(calls[0]?.name, 'save', 'First call should be ctx.save()');
  assert.deepEqual(calls.find(c => c.name === 'clearRect')?.args, [0, 0, width, height], 'clearRect should cover full canvas');

  const fillStyleSet = calls.find(c => c.name === 'set:fillStyle');
  assert.ok(fillStyleSet, 'fillStyle should be set');
  assert.equal(fillStyleSet.args[0], palette.bg, 'fillStyle should be set to palette.bg');

  const fillRectCall = calls.find(c => c.name === 'fillRect');

  assert.ok(fillRectCall, 'fillRect should be called');
  assert.deepEqual(fillRectCall.args, [0, 0, width, height], 'fillRect should cover full canvas');

  // Last call should be top-level restore
  assert.equal(calls.at(-1)?.name, 'restore', 'Final call should be ctx.restore()');
});

test('renderHelix: sets layer stroke styles for vesica, tree, fibonacci, and helix', async () => {
  const renderHelix = await getRenderHelix();

  const { ctx, calls } = createMockCtx();
  renderHelix(ctx, { width: 640, height: 480, palette, NUM });

  const strokeSets = calls.filter(c => c.name === 'set:strokeStyle').map(c => c.args[0]);

  // Each layer should set strokeStyle to its color at least once
  for (const color of palette.layers) {
    assert.ok(strokeSets.includes(color), `Expected strokeStyle to be set to ${color}`);
  }
});

test('renderHelix: call accounting is stable for given NUM constants (beginPath, stroke, arc, lineTo)', async () => {
  const renderHelix = await getRenderHelix();

  const { ctx, calls } = createMockCtx();
  renderHelix(ctx, { width: 900, height: 600, palette, NUM });

  const count = (name) => calls.filter(c => c.name === name).length;

  // Derived expectations from implementation:
  // Vesica: 3x3 grid, two circles per cell => 18 arcs, 18 beginPath, 18 strokes
  // Tree-of-Life: 22 paths => 22 beginPath + 22 strokes; 10 node circles => 10 arcs + 10 beginPath + 10 strokes
  // Fibonacci: 1 beginPath + 33 lineTo + 1 stroke; 0 arcs
  // Helix lattice: 2 strands: each has 1 beginPath + 144 lineTo + 1 stroke => total 2 beginPath, 288 lineTo, 2 stroke
  // Crossbars: step every 16 across 0..144 => 10 bars, each 1 beginPath + 1 lineTo + 1 stroke
  // Totals:
  //   beginPath: 18 + (22+10) + 1 + (2+10) = 63
  //   stroke:    18 + (22+10) + 1 + (2+10) = 63
  //   arc:       18 + 10 = 28
  //   lineTo:    22 + 33 + 288 + 10 = 353

  assert.equal(count('beginPath'), 63, 'Expected total beginPath count to be 63');
  assert.equal(count('stroke'), 63, 'Expected total stroke count to be 63');
  assert.equal(count('arc'), 28, 'Expected total arc count to be 28');
  assert.equal(count('lineTo'), 353, 'Expected total lineTo count to be 353');

  // Also check save/restore counts: top-level + 4 layers
  assert.equal(count('save'), 5, 'Expected 5 save() calls (top + 4 layers)');
  assert.equal(count('restore'), 5, 'Expected 5 restore() calls (top + 4 layers)');
});

test('renderHelix: ND-safe stroke widths and caps set by layers', async () => {
  const renderHelix = await getRenderHelix();

  const { ctx, calls } = createMockCtx();
  renderHelix(ctx, { width: 500, height: 500, palette, NUM });

  const lineWidthSets = calls.filter(c => c.name === 'set:lineWidth').map(c => c.args[0]);

  const lineCapSets = calls.filter(c => c.name === 'set:lineCap').map(c => c.args[0]);
  const lineJoinSets = calls.filter(c => c.name === 'set:lineJoin').map(c => c.args[0]);

  // Vesica uses lineWidth=2 and lineCap="round"
  assert.ok(lineWidthSets.includes(2), 'Expected a lineWidth of 2 to be set');
  assert.ok(lineCapSets.includes('round'), 'Expected lineCap "round" to be set');

  // Tree-of-Life uses lineWidth=1.5 and lineCap="round"
  assert.ok(lineWidthSets.some(v => Math.abs(v - 1.5) < 1e-9), 'Expected a lineWidth of 1.5 to be set');

  // Fibonacci uses lineWidth=2 and lineJoin="round"
  assert.ok(lineJoinSets.includes('round'), 'Expected lineJoin "round" to be set');
});

test('renderHelix: zero-size canvas still executes without throwing and respects rect arguments', async () => {
  const renderHelix = await getRenderHelix();

  const { ctx, calls } = createMockCtx();
  assert.doesNotThrow(() => renderHelix(ctx, { width: 0, height: 0, palette, NUM }));

  const clear = calls.find(c => c.name === 'clearRect');
  const fill = calls.find(c => c.name === 'fillRect');
  assert.deepEqual(clear?.args, [0, 0, 0, 0], 'clearRect should match zero-size canvas');
  assert.deepEqual(fill?.args, [0, 0, 0, 0], 'fillRect should match zero-size canvas');
});

test('renderHelix: handles undefined layer colors gracefully (no throws, still draws)', async () => {
  const renderHelix = await getRenderHelix();

  const { ctx, calls } = createMockCtx();
  const brokenPalette = { bg: '#000', layers: ['#123456'] }; // fewer than needed
  assert.doesNotThrow(() => renderHelix(ctx, { width: 300, height: 200, palette: brokenPalette, NUM }));

  // Still should have performed some drawing calls
  assert.ok(calls.some(c => c.name === 'beginPath'), 'Expected some drawing operations despite incomplete palette');
});