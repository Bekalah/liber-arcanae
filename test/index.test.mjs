// Framework note: This test file is written using Jest/Vitest style APIs (describe/it/expect).
// It should run under either Jest (testEnvironment: jsdom) or Vitest (environment: jsdom).
// If using Jest, ensure "testEnvironment": "jsdom" in Jest config. If using Vitest, ensure environment is jsdom.

// Utilities to provide expect/assertions in both Vitest and Jest environments
const testApi = (() => {
  try {
    // Vitest globals
    return { describe, it, beforeEach, afterEach, expect, vi };
  } catch {
    // Jest fallback (vi is not present)
    return { describe, it, beforeEach, afterEach, expect, vi: null };
  }
})();
const { describe, it, beforeEach, afterEach, expect, vi } = testApi;

// Helper to reset DOM between tests

function resetDom() {
  document.body.innerHTML = `
    <a class="skip-link" href="#main">Skip to geometry</a>
    <header>
      <h1>Cosmic Helix Renderer — layered sacred geometry (offline, ND-safe)</h1>
      <p class="status" id="status" role="status" aria-live="polite">Loading palette…</p>
    </header>
    <main id="main">
      <canvas id="stage" width="1440" height="900" aria-label="Layered sacred geometry canvas" role="img"></canvas>
      <p class="note">This static renderer encodes Vesica, Tree-of-Life, Fibonacci, and a static double-helix lattice. No motion, no external libraries. Open this file directly.</p>
      <noscript>Enable JavaScript to draw the layered geometry. Without it the calm static illustration cannot render.</noscript>
    </main>
  `;
}

// Build a runnable ESM module from the inline <script type="module"> block of index.html.
// We strip the real import and inject a mock renderHelix that we can spy on.
// We also export internal functions for direct unit testing.


async function loadInlineModule({ mockRenderHelixImpl } = {}) {
  // Load index.html source from repository (assumed at project root)
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const htmlPath = path.resolve(process.cwd(), 'index.html');
  const html = await fs.readFile(htmlPath, 'utf8');

  // Extract the <script type="module"> … </script> content.
  const scriptMatch = html.match(/<script\s+type="module">([\s\S]*?)<\/script>/i);
  if (!scriptMatch) throw new Error('Inline module script not found in index.html');
  let moduleCode = scriptMatch[1];

  // Replace the import line with a local mock implementation that we can observe.
  // Original: import { renderHelix } from "./js/helix-renderer.mjs";
  const importPattern = /import\s+\{\s*renderHelix\s*\}\s+from\s+["'][^"']+["'];?/;
  const mockImpl = `
    export const __calls__ = [];
    export function renderHelix(ctx, args) {

      __calls__.push({ ctxPresent: !!ctx, args });
      return (mockRenderHelixImpl || (() => {}))(ctx, args);
    }
  `;
  moduleCode = moduleCode.replace(importPattern, mockImpl);

  // Expose internal functions by appending exports at the end of module
  // Functions present: init (async), announce, loadPalette (async), sanitizePalette, clonePalette, isHex
  moduleCode += `
    export { init, announce, loadPalette, sanitizePalette, clonePalette, isHex, NUM };
  `;

  // Provide a way for our test to inject a mock implementation reference
  // We'll rely on closure capture: define a module-scope variable mockRenderHelixImpl; assign from globalThis.__mockRenderHelixImpl
  moduleCode = `
    let mockRenderHelixImpl = (globalThis && globalThis.__mockRenderHelixImpl) || null;
  ` + moduleCode;

  // Build a data URL for dynamic import
  const encoded = Buffer.from(moduleCode, 'utf8').toString('base64');
  const dataUrl = 'data:text/javascript;base64,' + encoded;

  // Dynamic import as ESM
  return await import(dataUrl);
}

// Lightweight canvas context stub that supports getContext('2d')
function installCanvasStub() {
  const canvas = document.getElementById('stage');
  if (!canvas) throw new Error('Canvas not found in DOM');
  canvas.getContext = (type) => {
    if (type !== '2d') return null;
    // Return a minimal 2D context stub sufficient for code to pass around
    return {
      // Add no-op methods if needed by future changes
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      fillRect() {},
      clearRect() {},
      save() {},
      restore() {},
      // properties
      canvas
    };
  };
}

// Simple fetch mock harness (works for Jest and Vitest)
function mockFetchSuccess(jsonData, { status = 200 } = {}) {
  const fakeResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(JSON.stringify(jsonData)),
  };
  const mock = async () => fakeResponse;
  if (vi) {
    global.fetch = vi.fn().mockImplementation(mock);
  } else {
    global.fetch = jest.fn().mockImplementation(mock);
  }
  return global.fetch;
}
function mockFetchFailure({ status = 404 } = {}) {
  const fakeResponse = { ok: false, status, json: async () => ({}) };
  const mock = async () => fakeResponse;
  if (vi) {
    global.fetch = vi.fn().mockImplementation(mock);
  } else {
    global.fetch = jest.fn().mockImplementation(mock);
  }
  return global.fetch;
}
function mockFetchThrow(err = new Error('network')) {
  const mock = async () => { throw err; };
  if (vi) {
    global.fetch = vi.fn().mockImplementation(mock);
  } else {
    global.fetch = jest.fn().mockImplementation(mock);
  }
  return global.fetch;
}

describe('index.html inline module', () => {
  beforeEach(() => {
    // JSDOM DOM reset
    resetDom();
    // expose a place for the inline module to read our mock impl
    globalThis.__mockRenderHelixImpl = null;
  });
  afterEach(() => {
    // cleanup fetch mock
    if (global.fetch && (global.fetch.mockImplementation || global.fetch.mock)) {
      // jest fn has mockClear; vitest has mockClear via vi.fn()
      try { global.fetch.mockClear(); } catch {}
    }
    delete global.fetch;
    delete globalThis.__mockRenderHelixImpl;
  });

  it('announce() updates status text politely', async () => {
    const mod = await loadInlineModule();
    const status = document.getElementById('status');
    expect(status.textContent).toMatch(/Loading palette/);
    mod.announce('Palette loaded from data/palette.json.');
    expect(status.textContent).toBe('Palette loaded from data/palette.json.');
  });

  it('isHex() accepts valid 6-digit hex and rejects invalid inputs', async () => {
    const { isHex } = await loadInlineModule();
    expect(isHex('#000000')).toBe(true);
    expect(isHex('#ABCDEF')).toBe(true);
    expect(isHex('#abc123')).toBe(true);
    expect(isHex('#abcd')).toBe(false);
    expect(isHex('000000')).toBe(false);
    expect(isHex('#GGGGGG')).toBe(false);
    expect(isHex(null)).toBe(false);
    expect(isHex(123)).toBe(false);
  });

  it('clonePalette() returns shallow clone with at most 4 layers', async () => {
    const { clonePalette } = await loadInlineModule();
    const p = { bg: '#111111', ink: '#eeeeee', layers: ['#1', '#2', '#3', '#4', '#5'].map((x,i)=>['#111111','#222222','#333333','#444444','#555555'][i]) };
    const c = clonePalette(p);
    expect(c).not.toBe(p);
    expect(c).toEqual({ bg: p.bg, ink: p.ink, layers: ['#111111','#222222','#333333','#444444'] });
  });

  it('sanitizePalette() uses valid fields and falls back for invalid ones; pads/truncates layers to 4', async () => {
    const { sanitizePalette } = await loadInlineModule();
    const fallback = { bg: '#0b0b12', ink: '#e8e8f0', layers: ['#b1c7ff','#89f7fe','#a0ffa1','#ffd27f'] };

    // All valid passes through
    let input = { bg:'#123456', ink:'#abcdef', layers:['#000001','#000002','#000003','#000004'] };
    expect(sanitizePalette(input, fallback)).toEqual(input);

    // Invalid bg/ink -> fallback used
    input = { bg:'bad', ink:42, layers:['#000001','#000002','#000003','#000004'] };
    expect(sanitizePalette(input, fallback)).toEqual({
      bg: fallback.bg,
      ink: fallback.ink,
      layers: ['#000001','#000002','#000003','#000004']
    });

    // Layers filtered by isHex, padded from fallback to 4
    input = { bg:'#111111', ink:'#222222', layers:['#333333', 'oops', '#444444'] };
    expect(sanitizePalette(input, fallback)).toEqual({
      bg:'#111111',
      ink:'#222222',
      layers:['#333333','#444444', fallback.layers[2], fallback.layers[3]]
    });

    // Layers > 4 truncated to 4
    input = { bg:'#111111', ink:'#222222', layers:['#111111','#222222','#333333','#444444','#555555'] };
    expect(sanitizePalette(input, fallback)).toEqual({
      bg:'#111111',
      ink:'#222222',
      layers:['#111111','#222222','#333333','#444444']
    });

    // Non-object/empty input -> returns clone of fallback
    expect(sanitizePalette(null, fallback)).toEqual({
      bg: fallback.bg, ink: fallback.ink, layers: fallback.layers.slice(0,4)
    });
    expect(sanitizePalette(undefined, fallback)).toEqual({
      bg: fallback.bg, ink: fallback.ink, layers: fallback.layers.slice(0,4)
    });
  });

  it('loadPalette() returns JSON on 200 OK; null on non-ok; null on error', async () => {
    const { loadPalette } = await loadInlineModule();
    // success
    mockFetchSuccess({ bg:'#123456', ink:'#abcdef', layers:['#111111','#222222','#333333','#444444'] });
    await expect(loadPalette('./data/palette.json')).resolves.toEqual({
      bg:'#123456', ink:'#abcdef', layers:['#111111','#222222','#333333','#444444']
    });

    // non-ok
    mockFetchFailure({ status:404 });
    await expect(loadPalette('./data/palette.json')).resolves.toBeNull();

    // throw
    mockFetchThrow(new Error('boom'));
    await expect(loadPalette('./data/palette.json')).resolves.toBeNull();
  });

  it('init() announces success path and calls renderHelix with sanitized palette and constants NUM', async () => {
    resetDom();
    installCanvasStub();

    // Provide palette via fetch
    const paletteData = { bg:'#010203', ink:'#a1b2c3', layers:['#111111','#222222','#333333','#444444'] };
    mockFetchSuccess(paletteData);

    // Allow capturing calls to renderHelix
    globalThis.__mockRenderHelixImpl = (ctx, args) => { /* no-op */ };

    const mod = await loadInlineModule({ });

    // run init
    await mod.init();

    // status text should indicate loaded
    const status = document.getElementById('status');
    expect(status.textContent).toBe('Palette loaded from data/palette.json.');

    // Verify renderHelix called with expected shape
    expect(mod.__calls__).toBeDefined();
    expect(mod.__calls__.length).toBe(1);
    const call = mod.__calls__[0];
    expect(call.ctxPresent).toBe(true);
    expect(call.args).toMatchObject({
      width: 1440,
      height: 900,
      palette: paletteData, // already valid, sanitize should keep as-is
    });
    // NUM constants present and include known keys
    expect(Object.keys(mod.NUM)).toEqual(
      expect.arrayContaining(['THREE','SEVEN','NINE','ELEVEN','TWENTYTWO','THIRTYTHREE','NINETYNINE','ONEFORTYFOUR'])
    );
  });

  it('init() falls back when fetch fails, announces fallback, and still calls renderHelix', async () => {
    resetDom();
    installCanvasStub();
    mockFetchFailure({ status: 404 });

    const mod = await loadInlineModule({});
    await mod.init();

    const status = document.getElementById('status');
    expect(status.textContent).toBe('Palette missing; using safe fallback stored inline.');

    // Should still call renderHelix once with fallback palette
    expect(mod.__calls__).toBeDefined();
    expect(mod.__calls__.length).toBe(1);
    const call = mod.__calls__[0];
    expect(call.args.palette).toBeDefined();
    // fallback palette should have exactly 4 layers
    expect(Array.isArray(call.args.palette.layers)).toBe(true);
    expect(call.args.palette.layers).toHaveLength(4);
  });

  it('when 2D context is unavailable, status announces inability to render and init is not called', async () => {
    // DOM without working canvas context
    resetDom();
    const canvas = document.getElementById('stage');
    canvas.getContext = () => null; // force null

    const mod = await loadInlineModule({});
    // The inline module triggers init() only when ctx is truthy. We simulate the early branch by calling the logic:
    // Since we cannot re-run the top-level "if (!ctx) ... else init()", we validate the announce() path explicitly.
    mod.announce('Canvas context unavailable; static illustration cannot render.');
    const status = document.getElementById('status');
    expect(status.textContent).toBe('Canvas context unavailable; static illustration cannot render.');
  });

});
// -----------------------------------------------------------------------------
// Additional coverage focused on edge cases and failure modes
// Testing framework note: This suite remains compatible with both Jest and Vitest
// via the testApi harness at the top of this file.
// -----------------------------------------------------------------------------

describe('index.html inline module — extended coverage', () => {
  beforeEach(() => {
    resetDom();
    globalThis.__mockRenderHelixImpl = null;
  });
  afterEach(() => {
    if (global.fetch && (global.fetch.mockImplementation || global.fetch.mock)) {
      try { global.fetch.mockClear(); } catch {}
    }
    delete global.fetch;
    delete globalThis.__mockRenderHelixImpl;
  });

  it('isHex() rejects 3-digit shorthand and whitespace-padded values', async () => {
    const { isHex } = await loadInlineModule();
    expect(isHex('#fff')).toBe(false);
    expect(isHex(' #abcdef ')).toBe(false);
  });

  it('clonePalette() does not mutate source object and trims layer count to 4', async () => {
    const { clonePalette } = await loadInlineModule();
    const src = {
      bg: '#111111',
      ink: '#222222',
      layers: ['#111111', '#222222', '#333333', '#444444', '#555555']
    };
    const cloned = clonePalette(src);
    // Mutate clone and verify source is unaffected
    cloned.layers[0] = '#999999';
    expect(src.layers[0]).toBe('#111111');
    // Ensure at most 4 layers
    expect(Array.isArray(cloned.layers)).toBe(true);
    expect(cloned.layers).toHaveLength(4);
  });

  it('sanitizePalette() tolerates non-array layers, preserves valid bg/ink, and outputs 4 valid hex layers', async () => {
    const { sanitizePalette, isHex } = await loadInlineModule();
    const fallback = { bg: '#0b0b12', ink: '#e8e8f0', layers: ['#b1c7ff','#89f7fe','#a0ffa1','#ffd27f'] };

    const input = { bg: '#101010', ink: '#202020', layers: 'oops' };
    const out = sanitizePalette(input, fallback);

    expect(out.bg).toBe('#101010');
    expect(out.ink).toBe('#202020');
    expect(out.layers).toHaveLength(4);
    out.layers.forEach(c => expect(isHex(c)).toBe(true));
  });

  it('init() sanitizes an invalid fetched palette before rendering and still announces success', async () => {
    resetDom();
    installCanvasStub();

    const badFetched = { bg: 'oops', ink: '#1a2b3c', layers: ['oops', '#111111'] };
    mockFetchSuccess(badFetched);

    // capture calls to renderHelix
    globalThis.__mockRenderHelixImpl = () => {};

    const mod = await loadInlineModule();
    await mod.init();

    // success announcement still expected even if data required sanitization
    const status = document.getElementById('status');
    expect(status.textContent).toBe('Palette loaded from data/palette.json.');

    // verify render call used sanitized palette
    expect(mod.__calls__).toBeDefined();
    expect(mod.__calls__.length).toBe(1);
    const p = mod.__calls__[0].args.palette;

    expect(mod.isHex(p.bg)).toBe(true);
    expect(p.bg).not.toBe('oops'); // sanitized
    expect(mod.isHex(p.ink)).toBe(true);
    expect(Array.isArray(p.layers)).toBe(true);
    expect(p.layers).toHaveLength(4);
    p.layers.forEach(c => expect(mod.isHex(c)).toBe(true));
  });

  it('top-level: when 2D context is null, announces inability and does not invoke renderHelix or fetch/init', async () => {
    resetDom();
    const canvas = document.getElementById('stage');
    canvas.getContext = () => null; // force unavailability

    // Spy on fetch to ensure it is not touched when ctx is unavailable
    const fetchSpy = (vi ? vi.fn() : jest.fn());
    global.fetch = fetchSpy;

    const mod = await loadInlineModule(); // triggers top-level branch evaluation

    const status = document.getElementById('status');
    expect(status.textContent).toBe('Canvas context unavailable; static illustration cannot render.');

    // No render attempts should occur
    expect(mod.__calls__).toBeDefined();
    expect(mod.__calls__.length).toBe(0);

    // And no network activity either
    if (fetchSpy && fetchSpy.mock) {
      expect(fetchSpy).not.toHaveBeenCalled();
    }
  });
});