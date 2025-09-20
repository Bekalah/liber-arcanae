/**
 * Tests for inline module helpers in the Cosmic Helix HTML.
 * Runner: Jest/Vitest (ESM) with jsdom assumed; if Node's test runner is used,
 * ensure a DOM shim like JSDOM is available.
 *
 * This test extracts the <script type="module"> content from the HTML under test,
 * replaces the import of "./js/helix-renderer.mjs" with a stub, and evaluates
 * the module in a sandboxed ESM context so we can access the helper functions.
 */

import fs from 'node:fs';
import path from 'node:path';

// Helper to build a minimal DOM structure to satisfy the module's queries.
function mountMinimalDOM() {
  document.documentElement.innerHTML = `
    <head></head>
    <body>
      <header>
        <div><strong>Cosmic Helix Renderer</strong></div>
        <div class="status" id="status" role="status" aria-live="polite">Loading palette…</div>
      </header>
      <main>
        <canvas id="stage" width="1440" height="900" aria-label="Layered sacred geometry canvas" role="img"></canvas>
      </main>
    </body>
  `;
}

// Extract the inline module code from the provided file content (which may be index.html or a file in tests/ per diff).
function extractInlineModuleCode(html) {
  const start = html.indexOf('<script type="module">');
  const end = html.indexOf('</script>', start + 1);
  if (start === -1 || end === -1) throw new Error('Module script not found in HTML fixture');
  return html.slice(start + '<script type="module">'.length, end).trim();
}

// Build an ESM data URL that exposes the helpers via exports for testing.
function buildExportingModuleSource(rawModule) {
  // 1) Replace the import of renderHelix with a stub that records calls.
  const stub = `
    // Stub renderHelix that records its invocations on window.__renderHelixCalls
    const renderHelix = (ctx, opts) => { 
      if (!window.__renderHelixCalls) window.__renderHelixCalls = [];
      window.__renderHelixCalls.push({ ctx: !!ctx, opts });
    };
  `;
  let code = rawModule.replace(/import\s+\{\s*renderHelix\s*\}\s+from\s+["']\.\/js\/helix-renderer\.mjs["'];?/, stub);

  // 2) Expose helpers by appending exports at the end of the module.
  code += `
    export { loadJSON, sanitizePalette, clonePalette, isHex, applyPaletteToDocument };
    export { DEFAULT_PALETTE as __DEFAULT_PALETTE, NUM as __NUM };
  `;
  return code;
}

// Dynamically import a data: URL ESM module
async function importFromStringAsModule(source) {
  const encoded = Buffer.from(source, 'utf8').toString('base64');
  return import('data:text/javascript;base64,' + encoded);
}

describe('Cosmic Helix module helpers', () => {
  let html;

  beforeAll(() => {
    // Try common locations in priority order:
    const candidates = [
      'index.html',
      'public/index.html',
      'tests/index.test.mjs', // per diff, file contains the HTML content
    ].map(p => path.resolve(process.cwd(), p));

    const htmlPath = candidates.find(p => fs.existsSync(p));
    if (!htmlPath) {
      throw new Error('Could not locate HTML under test (index.html/public/index.html/tests/index.test.mjs)');
    }
    html = fs.readFileSync(htmlPath, 'utf8');
  });

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mountMinimalDOM();
    // Reset renderHelix call log
    // eslint-disable-next-line no-underscore-dangle
    window.__renderHelixCalls = [];
  });

  test('isHex validates proper #RRGGBB values and rejects invalid ones', () => {
    const moduleSrc = buildExportingModuleSource(extractInlineModuleCode(html));
    return importFromStringAsModule(moduleSrc).then(({ isHex }) => {
      expect(isHex('#000000')).toBe(true);
      expect(isHex('#ffffff')).toBe(true);
      expect(isHex('#A1B2C3')).toBe(true);
      expect(isHex('#abc')).toBe(false);
      expect(isHex('A1B2C3')).toBe(false);
      expect(isHex('#ZZZZZZ')).toBe(false);
      expect(isHex('#12345')).toBe(false);
      expect(isHex(null)).toBe(false);
      expect(isHex(123)).toBe(false);
      expect(isHex({})).toBe(false);
    });
  });

  test('clonePalette returns a shallow-cloned object with a deep-copied layers array', async () => {
    const { clonePalette } = await importFromStringAsModule(buildExportingModuleSource(extractInlineModuleCode(html)));
    const original = { bg: '#111111', ink: '#eeeeee', layers: ['#112233', '#445566'] };
    const cloned = clonePalette(original);
    expect(cloned).not.toBe(original);
    expect(cloned.layers).not.toBe(original.layers);
    expect(cloned).toEqual(original);

    // Mutate clone and ensure original is unchanged
    cloned.layers.push('#778899');
    expect(original.layers).toEqual(['#112233', '#445566']);
  });

  test('sanitizePalette handles null/invalid data by falling back, enforces 4 layers, filters non-hex', async () => {
    const { sanitizePalette, __DEFAULT_PALETTE } = await importFromStringAsModule(buildExportingModuleSource(extractInlineModuleCode(html)));

    // Null data -> fallback clone
    const s1 = sanitizePalette(null, __DEFAULT_PALETTE);
    expect(s1.bg).toBe(__DEFAULT_PALETTE.bg);
    expect(s1.ink).toBe(__DEFAULT_PALETTE.ink);
    expect(s1.layers).toHaveLength(4);

    // Partial + invalid entries get filtered/padded then truncated to 4
    const custom = {
      bg: '#010203',
      ink: 'not-a-color',
      layers: ['#0a0b0c', 'bad', '#dEeF00'] // one invalid
    };
    const s2 = sanitizePalette(custom, __DEFAULT_PALETTE);
    expect(s2.bg).toBe('#010203');
    expect(s2.ink).toBe(__DEFAULT_PALETTE.ink); // fallback
    expect(s2.layers).toEqual(['#0a0b0c', '#dEeF00', __DEFAULT_PALETTE.layers[2], __DEFAULT_PALETTE.layers[3]]);
    expect(s2.layers).toHaveLength(4);

    // Excess layers get truncated
    const s3 = sanitizePalette({ bg:'#111111', ink:'#222222', layers: ['#1a1a1a','#2b2b2b','#3c3c3c','#4d4d4d','#5e5e5e'] }, __DEFAULT_PALETTE);
    expect(s3.layers).toEqual(['#1a1a1a','#2b2b2b','#3c3c3c','#4d4d4d']);
    expect(s3.layers).toHaveLength(4);
  });

  test('applyPaletteToDocument sets CSS variables and body styles', async () => {
    const { applyPaletteToDocument } = await importFromStringAsModule(buildExportingModuleSource(extractInlineModuleCode(html)));
    const pal = { bg:'#101010', ink:'#fafafa', layers:['#1','#2','#3','#4'] };
    applyPaletteToDocument(pal);
    const rootStyle = document.documentElement.style;
    expect(rootStyle.getPropertyValue('--bg')).toBe(pal.bg);
    expect(rootStyle.getPropertyValue('--ink')).toBe(pal.ink);
    expect(document.body.style.background).toBe(pal.bg);
    expect(document.body.style.color).toBe(pal.ink);
  });

  test('loadJSON: success returns parsed data and uses no-store cache; HTTP error returns null; network error returns null', async () => {
    const { loadJSON } = await importFromStringAsModule(buildExportingModuleSource(extractInlineModuleCode(html)));

    // Mock fetch on globalThis
    const origFetch = global.fetch;

    // Success case
    global.fetch = jest.fn(async (url, opts) => ({
      ok: true,
      json: async () => ({ hello: 'world' }),
      status: 200,
      _opts: opts
    }));
    const ok = await loadJSON('/path/to.json');
    expect(ok).toEqual({ hello: 'world' });
    expect(global.fetch).toHaveBeenCalledWith('/path/to.json', { cache: 'no-store' });

    // HTTP error (ok=false)
    global.fetch = jest.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }));
    const notFound = await loadJSON('/missing.json');
    expect(notFound).toBeNull();

    // Network error (throw)
    global.fetch = jest.fn(async () => { throw new Error('network'); });
    const netFail = await loadJSON('/oops.json');
    expect(netFail).toBeNull();

    global.fetch = origFetch;
  });

  test('integration: when canvas context is available, renderHelix is called once; status text acknowledges palette state', async () => {
    // Provide a 2D context stub on canvas
    const canvas = document.getElementById('stage');
    canvas.getContext = () => ({ /* dummy ctx */ });

    // Mock fetch to return a palette
    const origFetch = global.fetch;
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ bg:'#111111', ink:'#eeeeee', layers:['#111111','#222222','#333333','#444444'] })
    }));

    const moduleSrc = buildExportingModuleSource(extractInlineModuleCode(html));

    await importFromStringAsModule(moduleSrc);

    const statusEl = document.getElementById('status');

    expect(statusEl.textContent).toMatch(/Palette loaded\./);
    expect(window.__renderHelixCalls.length).toBe(1);

    global.fetch = origFetch;
  });

  test('integration: when canvas context is unavailable, status reflects the issue and renderHelix is not called', async () => {
    const canvas = document.getElementById('stage');
    canvas.getContext = () => null;

    const origFetch = global.fetch;
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));

    const moduleSrc = buildExportingModuleSource(extractInlineModuleCode(html));
    await importFromStringAsModule(moduleSrc);

    const statusEl = document.getElementById('status');
    expect(statusEl.textContent).toMatch(/Palette missing; using safe fallback\./);
    expect(statusEl.textContent).toMatch(/Canvas context unavailable/);
    expect(window.__renderHelixCalls.length).toBe(0);

    global.fetch = origFetch;
  });
});