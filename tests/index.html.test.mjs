/**
 * Tests for index.html's inline module helpers.
 *
 * Test framework: Node.js built-in test runner (node:test) with assert/strict.
 * Rationale: Avoids introducing new dependencies; .test.mjs aligns with ESM usage.
 * If this repo uses Vitest/Jest, these tests can be adapted easily due to pure ESM and no globals beyond standard Node.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate index.html in common locations
const candidatePaths = [
  path.resolve(process.cwd(), 'index.html'),
  path.resolve(process.cwd(), 'public/index.html'),
  path.resolve(process.cwd(), 'docs/index.html'),
  path.resolve(process.cwd(), 'site/index.html'),
  path.resolve(__dirname, '../index.html'),
  path.resolve(__dirname, '../public/index.html'),
];

const INDEX_HTML_PATH = candidatePaths.find(p => fs.existsSync(p));
if (!INDEX_HTML_PATH) {
  throw new Error(`index.html not found. Checked:\n- ${candidatePaths.join('\n- ')}`);
}

const html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

// Extract the inline <script type="module"> content
function extractModuleScript(source) {
  const match = source.match(/<script\s+type=["']module["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('Module <script type="module"> not found in index.html');
  return match[1];
}

// From the module script, pull out only the helper functions so we can unit-test them in isolation
async function extractHelpersFromScript(script) {
  const start = script.indexOf('async function loadJSON');
  if (start === -1) throw new Error('loadJSON() not found in module script');
  // The last closing brace before </script> belongs to applyPaletteToDocument
  const end = script.lastIndexOf('}');
  if (end === -1 || end <= start) throw new Error('Could not determine end of helper functions block');
  const helpersCode = script.slice(start, end + 1);

  // Create an ephemeral module from the helpers code and import it to avoid eval().
  const moduleSource = `${helpersCode}\nexport { loadJSON, sanitizePalette, clonePalette, isHex, applyPaletteToDocument };`;
  const dataUrl = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(moduleSource);
  const mod = await import(dataUrl);
  return {
    loadJSON: mod.loadJSON,
    sanitizePalette: mod.sanitizePalette,
    clonePalette: mod.clonePalette,
    isHex: mod.isHex,
    applyPaletteToDocument: mod.applyPaletteToDocument,
  };
}

const scriptContent = extractModuleScript(html);
const helpers = await extractHelpersFromScript(scriptContent);

// Mirror DEFAULT_PALETTE from the page so expectations stay aligned
const DEFAULT_PALETTE = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  layers: ["#b1c7ff","#89f7fe","#a0ffa1","#ffd27f","#f5a3ff","#d0d0e6"]
};

describe('index.html inline helpers', () => {
  let originalFetch;
  let originalDocument;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.document = originalDocument;
  });

  describe('isHex()', () => {
    test('returns true for valid #RRGGBB hex (lowercase)', () => {
      assert.equal(helpers.isHex('#abcdef'), true);
      assert.equal(helpers.isHex('#000000'), true);
    });

    test('returns true for valid #RRGGBB hex (uppercase)', () => {
      assert.equal(helpers.isHex('#ABCDEF'), true);
      assert.equal(helpers.isHex('#A1B2C3'), true);
    });

    test('returns false for invalid formats', () => {
      for (const v of ['#abc', '#abcd12x', 'abc123', '#12345', '#1234567', '', null, undefined, 123, '#GGGGGG']) {
        assert.equal(helpers.isHex(v), false, `Expected isHex(${String(v)}) to be false`);
      }
    });
  });

  describe('clonePalette()', () => {
    test('returns a new object with cloned layers array', () => {
      const cloned = helpers.clonePalette(DEFAULT_PALETTE);
      assert.notStrictEqual(cloned, DEFAULT_PALETTE);
      assert.deepEqual(cloned, DEFAULT_PALETTE);
      assert.notStrictEqual(cloned.layers, DEFAULT_PALETTE.layers);
      // Mutating clone should not affect original
      cloned.layers[0] = '#ffffff';
      assert.equal(DEFAULT_PALETTE.layers[0], '#b1c7ff');
    });
  });

  describe('sanitizePalette()', () => {
    test('returns a clone of the fallback when data is null/invalid', () => {
      const sanitized = helpers.sanitizePalette(null, DEFAULT_PALETTE);
      assert.deepEqual(sanitized, DEFAULT_PALETTE);
      assert.notStrictEqual(sanitized.layers, DEFAULT_PALETTE.layers);
    });

    test('filters invalid hexes, fills up to 4 layers, and preserves valid bg', () => {
      const data = {
        bg: '#123456',
        ink: 'not-hex',
        layers: ['#000000', 'not-a-color', '#FFFFFF', '#abc123', '#nope']
      };
      const sanitized = helpers.sanitizePalette(data, DEFAULT_PALETTE);
      // ink falls back, bg kept
      assert.equal(sanitized.bg, '#123456');
      assert.equal(sanitized.ink, DEFAULT_PALETTE.ink);
      // valid from input: #000000, #FFFFFF, #abc123 (3) -> fill with fallback.layers[3]
      assert.deepEqual(sanitized.layers, ['#000000', '#FFFFFF', '#abc123', DEFAULT_PALETTE.layers[3]]);
      assert.equal(sanitized.layers.length, 4);
    });

    test('when layers is not an array, fills with first 4 fallback layers', () => {
      const data = { bg: '#abcdef', ink: '#010203', layers: 'nope' };
      const sanitized = helpers.sanitizePalette(data, DEFAULT_PALETTE);
      assert.deepEqual(sanitized.layers, DEFAULT_PALETTE.layers.slice(0, 4));
    });

    test('slices extra layers to exactly 4', () => {
      const data = { bg: '#111111', ink: '#222222', layers: ['#111111','#222222','#333333','#444444','#555555'] };
      const sanitized = helpers.sanitizePalette(data, DEFAULT_PALETTE);
      assert.deepEqual(sanitized.layers, ['#111111','#222222','#333333','#444444']);
      assert.equal(sanitized.layers.length, 4);
    });

    test('wraps fallback layers when fallback has fewer than needed', () => {
      const smallFallback = { bg: '#101010', ink: '#efefef', layers: ['#111111', '#222222'] };
      const data = { bg: '#000000', ink: '#ffffff', layers: [] };
      const sanitized = helpers.sanitizePalette(data, smallFallback);
      assert.deepEqual(sanitized.layers, ['#111111', '#222222', '#111111', '#222222']);
    });
  });

  describe('applyPaletteToDocument()', () => {
    test('sets CSS variables and body styles correctly', () => {
      const vars = {};
      const mockDocument = {
        documentElement: { style: { setProperty: (k, v) => { vars[k] = v; } } },
        body: { style: {} }
      };
      globalThis.document = mockDocument;

      const palette = { bg: '#0a0a0a', ink: '#fafafa', layers: ['#111111','#222222','#333333','#444444'] };

      helpers.applyPaletteToDocument(palette);

      assert.equal(vars['--bg'], '#0a0a0a');
      assert.equal(vars['--ink'], '#fafafa');
      assert.equal(mockDocument.body.style.background, '#0a0a0a');
      assert.equal(mockDocument.body.style.color, '#fafafa');
    });
  });

  describe('loadJSON()', () => {
    test('returns parsed JSON on successful fetch', async () => {
      globalThis.fetch = async (_path, _opts) => ({
        ok: true,
        json: async () => ({ hello: 'world' })
      });

      const res = await helpers.loadJSON('/data/palette.json');
      assert.deepEqual(res, { hello: 'world' });
    });

    test('returns null when response.ok is false', async () => {
      globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
      const res = await helpers.loadJSON('/missing.json');
      assert.equal(res, null);
    });

    test('returns null when fetch throws (offline-first behavior)', async () => {
      globalThis.fetch = async () => { throw new Error('network down'); };
      const res = await helpers.loadJSON('/any.json');
      assert.equal(res, null);
    });
  });
});