/**
 * Tests for cosmic-helix-renderer/index.html
 *
 * Framework: Jest with JSDOM environment
 *
 * Strategy:
 * - Read the HTML, extract the content of the <script type="module"> ... </script>.
 * - Transform the module: remove "import { renderHelix } ..." and inject a stubbed renderHelix in scope.
 * - Wrap the script body in an async IIFE to support top-level await.
 * - Provide a JSDOM-based DOM, stub fetch to return success/failure, and stub canvas.getContext.
 * - Assert status text, CSS variables, and renderHelix invocation + arguments.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function extractModuleScript(html) {
  const startTag = '<script type="module">';
  const endTag = '</script>';
  const startIdx = html.indexOf(startTag);
  const endIdx = html.indexOf(endTag, startIdx + startTag.length);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Module script not found in index.html');
  }
  return html.slice(startIdx + startTag.length, endIdx).trim();
}

function transformScriptForTest(src) {
  // Remove the import of renderHelix and inject a stub
  const importLine = /import\s+\{\s*renderHelix\s*\}\s+from\s+["']\.\/js\/helix-renderer\.mjs["'];?\s*/;
  let body = src.replace(importLine, '');

  // Wrap in async IIFE to support top-level await in the original module
  body = `(async () => {\n${body}\n})();`;

  return body;
}

async function runTransformedScript({
  htmlPath,
  fetchImpl,
  canvasContextImpl,
  beforeRun,
}) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scriptSrc = extractModuleScript(html);
  const transformed = transformScriptForTest(scriptSrc);

  // Setup basic DOM
  document.body.innerHTML = `
    <header>
      <div class="status" id="status" role="status" aria-live="polite"></div>
    </header>
    <main>
      <canvas id="stage" width="1440" height="900" role="img" aria-label="Layered sacred geometry canvas"></canvas>
    </main>
  `;

  // Provide canvas.getContext
  const canvas = document.getElementById('stage');
  canvas.getContext = jest.fn().mockImplementation(() => canvasContextImpl);

  // Stub renderHelix in the global scope of the script
  const renderHelix = jest.fn();

  // Stub fetch
  const fetch = fetchImpl;

  // Allow pre-run tweaks
  if (beforeRun) beforeRun({ canvas, renderHelix });

  // Build a VM context that includes window/document/fetch/renderHelix
  const context = {
    window,
    document,
    fetch,
    renderHelix,
    console,
    // Allow the script to set CSS variables via document.documentElement.style
  };
  vm.createContext(context);

  // Execute
  await vm.runInContext(transformed, context);

  return { renderHelix, canvas };
}

describe('cosmic-helix-renderer/index.html module script', () => {
  const htmlPath = path.resolve(__dirname, '..', 'index.html');

  beforeEach(() => {
    // jsdom defaults are ok; ensure clean DOM
    document.documentElement.style.cssText = '';
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('falls back to safe palette when palette.json is missing', async () => {
    const failingFetch = jest.fn(async (url) => {
      // Simulate network error or non-ok response
      return { ok: false, status: 404, json: async () => ({}) };
    });

    const fakeCtx = {}; // truthy context so renderHelix is called
    const { renderHelix } = await runTransformedScript({
      htmlPath,
      fetchImpl: failingFetch,
      canvasContextImpl: fakeCtx,
    });

    // Status text shows fallback
    const statusEl = document.getElementById('status');
    expect(statusEl).toBeTruthy();
    expect(statusEl.textContent).toMatch(/Palette missing; using safe fallback\./);

    // CSS variables should reflect defaults
    const rs = getComputedStyle(document.documentElement);
    expect(rs.getPropertyValue('--bg').trim()).toBe('#0b0b12');
    expect(rs.getPropertyValue('--ink').trim()).toBe('#e8e8f0');
    expect(rs.getPropertyValue('--muted').trim()).toBe('#a6a6c1');

    // renderHelix called once with expected params
    expect(renderHelix).toHaveBeenCalledTimes(1);
    const [ctxArg, opts] = renderHelix.mock.calls[0];
    expect(ctxArg).toBe(fakeCtx);
    expect(opts).toMatchObject({
      width: 1440,
      height: 900,
      palette: {
        bg: '#0b0b12',
        ink: '#e8e8f0',
        muted: '#a6a6c1',
        layers: expect.any(Array),
      },
      NUM: expect.objectContaining({
        THREE: 3,
        SEVEN: 7,
        NINE: 9,
        ELEVEN: 11,
        TWENTYTWO: 22,
        THIRTYTHREE: 33,
        NINETYNINE: 99,
        ONEFORTYFOUR: 144,
      }),
    });
  });

  test('uses provided palette.json when available and OK', async () => {
    const samplePalette = {
      bg: '#111111',
      ink: '#eeeeee',
      muted: '#999999',
      layers: ['#123456', '#abcdef'],
    };
    const okFetch = jest.fn(async (url) => {
      return { ok: true, status: 200, json: async () => samplePalette };
    });

    const fakeCtx = {};
    await runTransformedScript({
      htmlPath,
      fetchImpl: okFetch,
      canvasContextImpl: fakeCtx,
    });

    // Status shows loaded
    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toMatch(/Palette loaded\./);

    // CSS variables reflect provided palette
    const rs = getComputedStyle(document.documentElement);
    expect(rs.getPropertyValue('--bg').trim()).toBe('#111111');
    expect(rs.getPropertyValue('--ink').trim()).toBe('#eeeeee');
    expect(rs.getPropertyValue('--muted').trim()).toBe('#999999');
  });

  test('handles null/invalid JSON gracefully, falling back', async () => {
    const weirdFetch = jest.fn(async (url) => {
      return { ok: true, status: 200, json: async () => null };
    });

    const fakeCtx = {};
    const { renderHelix } = await runTransformedScript({
      htmlPath,
      fetchImpl: weirdFetch,
      canvasContextImpl: fakeCtx,
    });

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toMatch(/Palette missing; using safe fallback\./);

    const rs = getComputedStyle(document.documentElement);
    expect(rs.getPropertyValue('--bg').trim()).toBe('#0b0b12');

    expect(renderHelix).toHaveBeenCalledTimes(1);
  });

  test('when canvas 2D context is unavailable, shows fallback notice and does not call renderHelix', async () => {
    const okFetch = jest.fn(async (url) => {
      return { ok: false, status: 404, json: async () => ({}) };
    });

    const noCtx = null; // getContext returns null
    const { renderHelix } = await runTransformedScript({
      htmlPath,
      fetchImpl: okFetch,
      canvasContextImpl: noCtx,
      beforeRun: ({ canvas }) => {
        canvas.getContext = jest.fn(() => null);
      },
    });

    expect(renderHelix).not.toHaveBeenCalled();

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toMatch(/Canvas context unavailable; showing calm fallback notice\./);

    // Ensure status color is set to active.ink even in fallback
    const statusStyleColor = document.getElementById('status').style.color;
    // Inline style updated; color could be rgb(...) due to JSDOM limitations, accept non-empty
    expect(statusStyleColor).toBeTruthy();
  });

  test('canvas has correct accessibility attributes', () => {
    // Basic static checks on the HTML structure
    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toMatch(/<canvas[^>]*id="stage"[^>]*role="img"[^>]*aria-label="Layered sacred geometry canvas"[^>]*>/);
    expect(html).toMatch(/<div class="status" id="status" role="status" aria-live="polite">/);
  });
});