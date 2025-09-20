/**
 * Framework: Jest (jsdom environment). If your repo uses Vitest, these tests are compatible with minimal changes.
 * This suite extracts pure functions from index.html and evaluates them in a controlled jsdom environment.
 */
/* eslint-disable no-new-func */
 /**
  * @jest-environment jsdom
  */

const fs = require('fs');
const path = require('path');

const HTML_CANDIDATE_PATHS = [
  'index.html',
  'public/index.html',
  'static/index.html',
];

function locateIndexHtml() {
  for (const p of HTML_CANDIDATE_PATHS) {
    const abs = path.resolve(process.cwd(), p);
    if (fs.existsSync(abs)) return abs;
  }
  // Fallback: search for the signature phrase "Cosmic Helix Renderer"
  // Scan shallow paths to avoid costly recursion in CI.
  const roots = ['.', 'public', 'static'];
  for (const r of roots) {
    try {
      const entries = fs.readdirSync(r, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && e.name.toLowerCase() === 'index.html') {
          const p = path.join(r, e.name);
          const s = fs.readFileSync(p, 'utf8');
          if (s.includes('Cosmic Helix Renderer')) return p;
        }
      }
    } catch (_) {}
  }
  throw new Error('index.html not found for tests. Expected one of: ' + HTML_CANDIDATE_PATHS.join(', '));
}

const INDEX_HTML_PATH = locateIndexHtml();
const htmlSource = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

/**
 * Extract the <script type="module">...</script> content.
 */
function extractModuleScript(source) {
  const openTag = '<script type="module">';
  const start = source.indexOf(openTag);
  if (start === -1) throw new Error('Module script tag not found in index.html');
  const after = start + openTag.length;
  const end = source.indexOf('</script>', after);
  if (end === -1) throw new Error('Closing </script> not found.');
  return source.slice(after, end);
}

/**
 * Extract a function definition by name using balanced brace parsing.
 * Supports "function name(...)" and "async function name(...)" forms.
 */
function extractFunctionCode(script, name) {
  const re = new RegExp('\\b(?:async\\s+)?function\\s+' + name + '\\s*\\(');
  const m = re.exec(script);
  if (!m) throw new Error('Function ' + name + ' not found in script');
  let i = m.index;
  // Find the first "{"
  let braceStart = script.indexOf('{', i);
  if (braceStart === -1) throw new Error('Opening brace for ' + name + ' not found');
  // Walk braces to find matching closing
  let depth = 0;
  let j = braceStart;
  for (; j < script.length; j++) {
    const ch = script[j];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        // function header starts at m.index, include "function name(...){...}"
        const header = script.slice(m.index, j + 1);
        return header;
      }
    }
  }
  throw new Error('Closing brace for ' + name + ' not found');
}

/**
 * Evaluate function code in current context and return the function reference.
 */
function materializeFunction(fnCode, name) {
  // Create the function in an isolated factory and return the named function reference.
  const factory = new Function(fnCode + '; return ' + name + ';');
  const fn = factory();
  if (typeof fn !== 'function') {
    throw new Error('Extracted ' + name + ' is not a function');
  }
  return fn;
}

/**
 * Prepare all target functions.
 */
function prepareFns() {
  const script = extractModuleScript(htmlSource)
    // Remove the import of renderHelix to keep eval simple
    .replace(/\n\s*import\s+\{\s*renderHelix\s*\}\s+from\s+["'][^"']+["'];?\s*\n/, '\nconst renderHelix = () => {};\n');

  const names = ['isHex', 'clonePalette', 'sanitizePalette', 'applyPaletteToDocument', 'loadJSON'];
  const fns = {};
  for (const n of names) {
    const code = extractFunctionCode(script, n);
    fns[n] = materializeFunction(code, n);
  }
  return fns;
}

describe('index.html pure functions', () => {
  let isHex, clonePalette, sanitizePalette, applyPaletteToDocument, loadJSON;

  beforeAll(() => {
    ({ isHex, clonePalette, sanitizePalette, applyPaletteToDocument, loadJSON } = prepareFns());
  });

  describe('isHex', () => {
    test('accepts valid 6-digit hex colors', () => {
      expect(isHex('#ffffff')).toBe(true);
      expect(isHex('#000000')).toBe(true);
      expect(isHex('#Aa12Ff')).toBe(true);
    });
    test('rejects invalid values', () => {
      expect(isHex('#fff')).toBe(false);
      expect(isHex('ffffff')).toBe(false);
      expect(isHex('#FFFFFG')).toBe(false);
      expect(isHex('#1234567')).toBe(false);
      expect(isHex(null)).toBe(false);
      expect(isHex(123)).toBe(false);
      expect(isHex({})).toBe(false);
    });
  });

  describe('clonePalette', () => {
    test('returns a shallow clone with layers copied by value', () => {
      const src = { bg: '#111111', ink: '#eeeeee', layers: ['#111111', '#222222'] };
      const cloned = clonePalette(src);
      expect(cloned).not.toBe(src);
      expect(cloned).toEqual(src);
      expect(cloned.layers).not.toBe(src.layers);
      // Mutating clone layers must not change source
      cloned.layers.push('#333333');
      expect(src.layers).toEqual(['#111111', '#222222']);
    });
  });

  describe('sanitizePalette', () => {
    const FALLBACK = {
      bg: '#0b0b12',
      ink: '#e8e8f0',
      layers: ['#b1c7ff', '#89f7fe', '#a0ffa1', '#ffd27f', '#f5a3ff', '#d0d0e6'],
    };

    test('returns fallback clone when input is null or non-object', () => {
      const out1 = sanitizePalette(null, FALLBACK);
      const out2 = sanitizePalette('nope', FALLBACK);
      expect(out1).toEqual({ bg: FALLBACK.bg, ink: FALLBACK.ink, layers: FALLBACK.layers.slice(0, 4) });
      expect(out2).toEqual({ bg: FALLBACK.bg, ink: FALLBACK.ink, layers: FALLBACK.layers.slice(0, 4) });
    });

    test('uses valid bg/ink from input, falls back for invalid', () => {
      const data = { bg: '#123456', ink: 'nothex', layers: [] };
      const out = sanitizePalette(data, FALLBACK);
      expect(out.bg).toBe('#123456');
      expect(out.ink).toBe(FALLBACK.ink);
    });

    test('filters layers to only valid hex, then fills to exactly 4 using fallback cycling', () => {
      const data = { bg: '#111111', ink: '#222222', layers: ['#badbad', '#333333', 'nope', '#444444'] };
      const out = sanitizePalette(data, FALLBACK);
      expect(out.layers.length).toBe(4);
      expect(out.layers[0]).toBe('#333333'); // only valid ones kept
      expect(out.layers[1]).toBe('#444444');
      // Now top up from fallback (cycling as needed)
      expect(out.layers[2]).toBe(FALLBACK.layers[2 % FALLBACK.layers.length]);
      expect(out.layers[3]).toBe(FALLBACK.layers[3 % FALLBACK.layers.length]);
    });

    test('truncates layers to 4 if more are provided', () => {
      const data = {
        bg: '#111111',
        ink: '#222222',
        layers: ['#010101', '#020202', '#030303', '#040404', '#050505', '#060606'],
      };
      const out = sanitizePalette(data, FALLBACK);
      expect(out.layers).toEqual(['#010101', '#020202', '#030303', '#040404']);
    });

    test('returns a new object without mutating fallback', () => {
      const fb = JSON.parse(JSON.stringify(FALLBACK));
      const out = sanitizePalette({ bg: '#111111', ink: '#222222', layers: [] }, fb);
      expect(out).not.toBe(fb);
      expect(fb.layers.length).toBe(6); // unchanged
    });
  });

  describe('applyPaletteToDocument', () => {
    test('applies CSS variables and body styles', () => {
      const palette = { bg: '#101010', ink: '#fafafa', layers: [] };
      // Ensure document is clean
      document.documentElement.style.cssText = '';
      document.body.style.cssText = '';

      applyPaletteToDocument(palette);

      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue('--bg')).toBe(palette.bg);
      expect(rootStyle.getPropertyValue('--ink')).toBe(palette.ink);
      expect(document.body.style.background).toBe(palette.bg);
      expect(document.body.style.color).toBe(palette.ink);
    });
  });

  describe('loadJSON', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    test('returns parsed JSON when fetch ok', async () => {
      const payload = { hello: 'world' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload),
      });
      const out = await loadJSON('/data/palette.json');
      expect(global.fetch).toHaveBeenCalledWith('/data/palette.json', { cache: 'no-store' });
      expect(out).toEqual(payload);
    });

    test('returns null when fetch non-ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });
      const out = await loadJSON('/missing.json');
      expect(out).toBeNull();
    });

    test('returns null on fetch error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      const out = await loadJSON('/boom.json');
      expect(out).toBeNull();
    });
  });
});