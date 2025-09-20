// Test library note:
// This repository's test runner is expected to be Vitest or Jest with a jsdom-like environment,
// given the .mjs tests path. These tests use standard ESM, assert/describe/it syntax, and should
// run under Vitest (recommended) or Jest (with ESM support) configured for jsdom.
//
// If using Vitest: ensure test.environment = 'jsdom' (or happy-dom).
// If using Jest: ensure testEnvironment = 'jsdom' and "type": "module" in package.json or transform for ESM.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to use the active runner's test API (Vitest or Jest). Fall back to node:test if needed.
let testApi = {};
try {
  // Vitest globals (available automatically). No import needed.
  // We alias to explicit names for clarity in Node ESM as a fallback if not present.
  // eslint-disable-next-line no-undef
  if (typeof describe !== 'undefined' && typeof it !== 'undefined' && typeof expect !== 'undefined') {
    // eslint-disable-next-line no-undef
    testApi.describe = describe;
    // eslint-disable-next-line no-undef
    testApi.it = it;
    // eslint-disable-next-line no-undef
    testApi.expect = expect;
    // eslint-disable-next-line no-undef
    testApi.beforeEach = typeof beforeEach !== 'undefined' ? beforeEach : (fn) => fn();
    // eslint-disable-next-line no-undef
    testApi.afterEach = typeof afterEach !== 'undefined' ? afterEach : (fn) => fn();
  } else {
    throw new Error('No global test API found.');
  }
} catch {
  // Last resort: node:test (only if repo uses node:test). Avoid introducing dependency.
  const nodeTest = await import('node:test');
  const assert = await import('node:assert/strict');
  testApi.describe = (name, fn) => nodeTest.describe(name, fn);
  testApi.it = (name, fn) => nodeTest.it(name, fn);
  testApi.expect = (value) => ({
    toBe: (v) => assert.equal(value, v),
    toEqual: (v) => assert.deepEqual(value, v),
    toBeTruthy: () => assert.ok(value),
    toBeNull: () => assert.equal(value, null),
    toContain: (v) => assert.ok(value.includes(v)),
    toHaveLength: (n) => assert.equal(value.length, n),
    toMatch: (re) => assert.ok(re.test(value)),
  });
  testApi.beforeEach = (fn) => nodeTest.beforeEach(fn);
  testApi.afterEach = (fn) => nodeTest.afterEach(fn);
}

// JSDOM is assumed via test environment; if not present, load a lightweight JSDOM for these tests.
// We try to use global.window/document first (as Vitest/Jest provide).
let JSDOM = null;
if (typeof window === 'undefined' || typeof document === 'undefined') {
  // Lazy import jsdom only if needed (do not add dependency; most setups already have it).
  try {
    ({ JSDOM } = await import('jsdom'));
  } catch {
    throw new Error('No DOM available. Ensure jsdom/happy-dom test environment is configured.');
  }
}

// Helpers
const { describe: describeFn, it: itFn, expect: expectFn, beforeEach: beforeEachFn, afterEach: afterEachFn } = testApi;

const projectRoot = path.resolve(__dirname, '..');
const indexHtmlPathCandidates = [
  path.join(projectRoot, 'index.html'),
  path.join(projectRoot, 'public', 'index.html'),
  path.join(projectRoot, 'app', 'index.html'),
];

// Load index.html content
function loadIndexHtml() {
  for (const p of indexHtmlPathCandidates) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  }
  // Fallback: if the file was renamed or located elsewhere, fail loudly.
  throw new Error('index.html not found in standard locations (./index.html, ./public/index.html, ./app/index.html).');
}

// Extract inline <script type="module"> content for evaluation
function extractModuleScript(html) {
  const startTag = '<script type="module">';
  const endTag = '</script>';
  const start = html.indexOf(startTag);
  const end = html.indexOf(endTag, start + startTag.length);
  if (start === -1 || end === -1) throw new Error('Could not extract module script from index.html');
  return html.slice(start + startTag.length, end).trim();
}

// Evaluate the script in a DOM context, stubbing import and fetch.
// Returns handles to: window, document, api (exposed internals), renderCalls recorder.
async function evalPage({ paletteJson, fetchOk = true, throwOnFetch = false } = {}) {
  const html = loadIndexHtml();

  // Prepare DOM
  let dom, win, doc;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Use existing environment (Vitest/Jest with jsdom/happy-dom)
    doc = document.implementation.createHTMLDocument('Test');
    doc.documentElement.innerHTML = html;
    win = window;
    // Attach a detached document to the same window; adjust globals used by code as needed.
    // Move essential elements into global document
    const oldDoc = globalThis.document;
    globalThis.document = doc;
    const restore = () => { globalThis.document = oldDoc; };
    // We'll restore in caller via returned cleanup
    dom = { window: win, cleanup: restore };
  } else {
    // Create new JSDOM instance
    dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
    win = dom.window;
    doc = win.document;
  }

  // Stub canvas.getContext to ensure non-null ctx
  const canvas = doc.getElementById('stage');
  if (!canvas) throw new Error('Canvas #stage not found in DOM.');
  if (!canvas.getContext || canvas.getContext === null) {
    Object.defineProperty(win.HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: () => ({ /* minimal stub */ }),
    });
  }

  // Prepare global fetch stub
  const renderCalls = [];
  const fetchStub = async (url, opts) => {
    if (throwOnFetch) throw new Error('network down');
    if (!fetchOk) return { ok: false, json: async () => ({}), url, opts };
    return {
      ok: true,
      async json() { return paletteJson ?? { bg: '#111111', ink: '#eeeeee', layers: ['#aabbcc', '#bbccdd', '#ccddee', '#ddeeff'] }; },
      url,
      opts,
    };
  };

  // Extract and transform module script:
  let code = extractModuleScript(html);
  // Replace ESM import with a stub function that records calls.
  code = code.replace(
    /import\s+\{\s*renderHelix\s*\}\s+from\s+["'][^"']+["'];?/,
    'const renderHelix = (ctx, opts) => { (globalThis.__renderCalls ||= []).push({ ctx, opts }); };'
  );

  // After function declarations, expose pure helpers for unit tests
  // We append at the end to attach references.
  code += '\n' +
    'globalThis.__exposed = { sanitizePalette, clonePalette, isHex, loadPalette, NUM, defaults, announce, init };';

  // Install stubs into the evaluation context globals
  const g = win; // evaluation target (window-like)
  g.__renderCalls = renderCalls;
  g.fetch = fetchStub;

  // Evaluate
  if (typeof dom.runVMScript === 'function') {
    // jsdom VM path (older API). Not used here; we rely on win.eval for simplicity.
    win.eval(code);
  } else {
    win.eval(code);
  }

  // Allow async microtasks to settle
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));

  // Provide cleanup to restore document if we swapped it
  const cleanup = dom.cleanup ? dom.cleanup : () => dom.window.close();

  // Collect exposed API and status element for assertions
  const api = win.__exposed;
  const statusEl = doc.getElementById('status');

  return { window: win, document: doc, api, renderCalls: g.__renderCalls, statusEl, cleanup };
}

describeFn('index.html inline script — ND-safe helix renderer', () => {
  let cleanupFn = null;

  afterEachFn(() => {
    if (cleanupFn) {
      cleanupFn();
      cleanupFn = null;
    }
  });

  itFn('announces fallback when fetch returns not ok and renders with defaults', async () => {
    const { api, renderCalls, statusEl, cleanup } = await evalPage({ fetchOk: false });
    cleanupFn = cleanup;

    // Initial branch should have executed init() automatically since ctx is non-null
    expectFn(statusEl.textContent).toBe('Palette missing; using safe fallback stored inline.');
    expectFn(renderCalls).toHaveLength(1);
    const call = renderCalls[0];

    // Validate render options
    expectFn(call.opts.width).toBe(1440);
    expectFn(call.opts.height).toBe(900);
    // Defaults palette echoed
    expectFn(call.opts.palette).toEqual(api.defaults.palette);

    // NUM constants passed through
    expectFn(Object.keys(api.NUM)).toContain('THIRTYTHREE');
    expectFn(api.NUM.ONEFORTYFOUR).toBe(144);
  });

  itFn('loads palette JSON, sanitizes it, announces success, and renders with sanitized palette', async () => {
    const dirty = {
      bg: '#123456',
      ink: 'not-a-color',
      layers: ['#ff0000', 'bad', '#00ff00'] // short, with an invalid entry; should be filled and filtered to 4 valid hex
    };
    const { api, renderCalls, statusEl, cleanup } = await evalPage({ paletteJson: dirty, fetchOk: true });
    cleanupFn = cleanup;

    expectFn(statusEl.textContent).toBe('Palette loaded from data/palette.json.');
    expectFn(renderCalls).toHaveLength(1);
    const { opts } = renderCalls[0];

    // bg should be from JSON, ink should fall back
    expectFn(opts.palette.bg).toBe('#123456');
    expectFn(opts.palette.ink).toBe(api.defaults.palette.ink);

    // layers: only valid hex kept, then filled from fallback, capped at 4
    expectFn(opts.palette.layers).toHaveLength(4);
    expectFn(opts.palette.layers[0]).toBe('#ff0000');
    expectFn(opts.palette.layers[1]).toBe('#00ff00');
    // Positions 2 & 3 filled from fallback.layers cycling
    expectFn(api.defaults.palette.layers).toContain(opts.palette.layers[2]);
    expectFn(api.defaults.palette.layers).toContain(opts.palette.layers[3]);
  });

  itFn('sanitizePalette: handles null/invalid input by cloning fallback exactly (pure function)', async () => {
    const { api, cleanup } = await evalPage({ fetchOk: false });
    cleanupFn = cleanup;

    const clone = api.sanitizePalette(null, api.defaults.palette);
    expectFn(clone).toEqual(api.defaults.palette);
    // Ensure layers array is a shallow copy (not same reference)
    clone.layers.push('#abcdef');
    expectFn(api.defaults.palette.layers).toHaveLength(4);
    expectFn(clone.layers).toHaveLength(5);
  });

  itFn('isHex: validates only #RRGGBB strings', async () => {
    const { api, cleanup } = await evalPage({ fetchOk: false });
    cleanupFn = cleanup;

    expectFn(api.isHex('#a1B2c3')).toBe(true);
    expectFn(api.isHex('#ABCDEF')).toBe(true);
    expectFn(api.isHex('#abcd')).toBe(false);
    expectFn(api.isHex('aabbcc')).toBe(false);
    expectFn(api.isHex('#GGGGGG')).toBe(false);
    expectFn(api.isHex('')).toBe(false);
    expectFn(api.isHex(null)).toBe(false);
  });

  itFn('loadPalette: returns null on fetch error and on non-ok responses; returns JSON on ok', async () => {
    // Case 1: throws
    {
      const { api, cleanup } = await evalPage({ throwOnFetch: true });
      cleanupFn = cleanup;
      const res = await api.loadPalette('./data/palette.json');
      expectFn(res).toBeNull();
      cleanup();
      cleanupFn = null;
    }
    // Case 2: !ok
    {
      const { api, cleanup } = await evalPage({ fetchOk: false });
      cleanupFn = cleanup;
      const res = await api.loadPalette('./data/palette.json');
      expectFn(res).toBeNull();
      cleanup();
      cleanupFn = null;
    }
    // Case 3: ok with object
    {
      const sample = { bg: '#101010', ink: '#fafafa', layers: ['#111111', '#222222', '#333333', '#444444'] };
      const { api, cleanup } = await evalPage({ paletteJson: sample, fetchOk: true });
      cleanupFn = cleanup;
      const res = await api.loadPalette('./data/palette.json');
      expectFn(res).toEqual(sample);
    }
  });

  itFn('clonePalette: returns a safe shallow copy trimmed to 4 layers', async () => {
    const { api, cleanup } = await evalPage({});
    cleanupFn = cleanup;

    const many = { bg: '#0b0b12', ink: '#e8e8f0', layers: ['#1', '#2', '#3', '#4', '#5'] };
    // Note: sanitizePalette trims/filters; clonePalette simply slices first 4.
    const cloned = api.clonePalette({ bg: '#000000', ink: '#ffffff', layers: ['#111111', '#222222', '#333333', '#444444', '#555555'] });

    expectFn(cloned.layers).toHaveLength(4);
    expectFn(cloned.layers[3]).toBe('#444444');
  });

  itFn('accessibility: skip link exists and points to #main; canvas has ARIA attributes', async () => {
    const { document, cleanup } = await evalPage({ fetchOk: false });
    cleanupFn = cleanup;

    const skip = document.querySelector('a.skip-link');
    expectFn(skip).toBeTruthy();
    expectFn(skip.getAttribute('href')).toBe('#main');

    const canvas = document.getElementById('stage');
    expectFn(canvas.getAttribute('role')).toBe('img');
    expectFn(canvas.getAttribute('aria-label')).toMatch(/sacred geometry canvas/i);
  });
});