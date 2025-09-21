/* 
  Cosmic Helix Renderer - index.html tests

  Framework compatibility:
  - Designed to run under Jest or Vitest (and Mocha) using only Node's 'assert' module.
  - Uses describe/it which are provided by these frameworks; assertions are via Node's assert.
  - No additional deps (e.g., jsdom) required; tests validate structure via robust regex/string checks
    and isolated evaluation of the pure helper function loadJSON using Node's 'vm'.

  Focus:
  - Validates contents introduced/modified in index.html, emphasizing ND-safe offline behavior,
    inline CSS, module script semantics, and the pure function loadJSON.
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const htmlPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Helper: extract content of the first style tag
function extractStyle(source) {
  const m = source.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return m ? m[1] : '';
}

// Helper: extract content of the first module script tag
function extractModuleScript(source) {
  const m = source.match(/<script[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/i);
  return m ? m[1] : '';
}

// Helper: safely build a one-time setup hook for Jest (beforeAll) or Mocha (before)
const setupOnce = (global.beforeAll || global.before || ((fn) => fn.bind(null))) ;

// Helper: extract a named top-level function source by balancing braces
function extractFunctionSource(source, funcName) {
  const sig = new RegExp('\\basync\\s+function\\s+' + funcName + '\\s*\\(');
  const startIdx = source.search(sig);
  if (startIdx === -1) return null;
  // Find the opening brace after signature
  let i = source.indexOf('{', startIdx);
  if (i === -1) return null;
  let level = 0;
  let end = -1;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') level++;
    else if (ch === '}') {
      level--;
      if (level === 0) { end = i; break; }
    }
  }
  if (end === -1) return null;
  return source.slice(startIdx, end + 1);
}

describe('index.html - structure and accessibility', () => {
  it('declares HTML5 doctype', () => {
    assert.match(html.trim(), /^<\!doctype html>/i, 'Missing or incorrect <\!doctype html>');
  });

  it('sets lang="en" on <html>', () => {
    assert.match(html, /<html[^>]*\blang=["']en["'][^>]*>/i, 'Expected <html lang="en">');
  });

  it('contains required meta tags and correct title', () => {
    assert.match(html, /<meta\s+charset=["']utf-?8["']\s*>/i, 'Missing UTF-8 charset meta');
    assert.match(html, /<meta\s+name=["']viewport["'][^>]*content=["']width=device-width,initial-scale=1,viewport-fit=cover["'][^>]*>/i, 'Missing viewport meta');
    assert.match(html, /<meta\s+name=["']color-scheme["']\s+content=["']light dark["']\s*>/i, 'Missing color-scheme meta');
    assert.match(html, /<title>\s*Cosmic Helix Renderer \(ND-safe, Offline\)\s*<\/title>/i, 'Unexpected or missing <title>');
  });

  it('includes a header with status placeholder', () => {
    assert.match(html, /<header>[\s\S]*Cosmic Helix Renderer[\s\S]*id=["']status["'][^>]*>Loading palette…<\/div>[\s\S]*<\/header>/i, 'Header or status placeholder missing/mismatched');
  });

  it('renders a canvas with required attributes and ARIA label', () => {
    assert.match(
      html,
      /<canvas[^>]*\bid=["']stage["'][^>]*\bwidth=["']?1440["']?[^>]*\bheight=["']?900["']?[^>]*\baria-label=["']Layered sacred geometry canvas["'][^>]*><\/canvas>/i,
      'Canvas #stage not found with expected attributes'
    );
  });

  it('contains a helpful note about offline, static rendering', () => {
    assert.match(
      html,
      /<p[^>]*class=["']note["'][^>]*>[\s\S]*Vesica[\s\S]*Tree-of-Life[\s\S]*Fibonacci[\s\S]*double-helix[\s\S]*<\/p>/i,
      'Explanatory note missing or incomplete'
    );
  });
});

describe('index.html - inline CSS (ND-safe, no motion)', () => {
  const css = extractStyle(html);

  it('defines ND-safe CSS variables', () => {
    assert.ok(css.length > 0, 'Inline <style> block missing');
    assert.match(css, /:root\s*{[^}]*--bg:#0b0b12;[^}]*--ink:#e8e8f0;[^}]*--muted:#a6a6c1;[^}]*}/i, 'Expected :root variables for ND-safe palette');
  });

  it('avoids motion: no animation, transition, or keyframes', () => {
    assert.doesNotMatch(css, /\banimation\s*:/i, 'animation:* should not be present');
    assert.doesNotMatch(css, /\btransition\s*:/i, 'transition:* should not be present');
    assert.doesNotMatch(css, /@keyframes/i, '@keyframes should not be present');
  });
});

describe('index.html - module script (static analysis)', () => {
  const js = extractModuleScript(html);

  it('imports renderHelix from a local ESM module', () => {
    assert.match(js, /import\s+\{\s*renderHelix\s*\}\s+from\s+["']\.\/js\/helix-renderer\.mjs["'];/i, 'Expected local import of renderHelix');
  });

  it('defines loadJSON with no-store caching and null-on-error behavior', () => {
    assert.match(js, /async\s+function\s+loadJSON\s*\(/, 'loadJSON function missing');
    assert.match(js, /fetch\s*\(\s*path\s*,\s*\{\s*cache:\s*["']no-store["']\s*\}\s*\)/, 'fetch should specify cache:"no-store"');
    assert.match(js, /if\s*\(\s*\!res\.ok\s*\)\s*throw\s+new\s+Error\s*\(\s*String\s*\(\s*res\.status\s*\)\s*\)\s*;/, 'Should throw on \!res.ok');
    assert.match(js, /catch\s*\(\s*err\s*\)\s*\{\s*return\s+null;\s*\}/s, 'Should return null in catch');
  });

  it('provides defaults.palette and appropriate status messaging', () => {
    assert.ok(js.includes('defaults'), 'defaults object not defined');
    assert.ok(js.includes('palette'), 'defaults.palette missing');
    assert.ok(js.includes('bg:"#0b0b12"'), 'defaults.palette.bg should be #0b0b12');
    assert.ok(js.includes('ink:"#e8e8f0"'), 'defaults.palette.ink should be #e8e8f0');
    assert.ok(js.includes('layers:['), 'defaults.palette.layers missing');

    assert.ok(js.includes('const palette = await loadJSON("./data/palette.json");'), 'Palette file should be read from ./data/palette.json');
    assert.ok(js.includes('const active = palette || defaults.palette;'), 'Active palette fallback missing');
    assert.ok(js.includes('Palette loaded.'), 'Positive status message missing');
    assert.ok(js.includes('Palette missing; using safe fallback.'), 'Fallback status message missing');
  });

  it('declares numerology constants with expected values', () => {
    const keys = ['THREE:3','SEVEN:7','NINE:9','ELEVEN:11','TWENTYTWO:22','THIRTYTHREE:33','NINETYNINE:99','ONEFORTYFOUR:144'];
    for (const k of keys) {
      assert.ok(js.includes(k), `NUM constant should include ${k}`);
    }
  });

  it('invokes renderHelix with expected argument shape', () => {
    assert.match(
      js,
      /renderHelix\s*\(\s*ctx\s*,\s*\{\s*width\s*:\s*canvas\.width\s*,\s*height\s*:\s*canvas\.height\s*,\s*palette\s*:\s*active\s*,\s*NUM\s*\}\s*\)\s*;/,
      'renderHelix should be called with ctx and {width,height,palette,NUM}'
    );
  });

  it('is offline-safe: no external http(s) references and no animation APIs used in JS', () => {
    assert.doesNotMatch(html, /https?:\/\//i, 'External URLs should not be referenced for offline safety');
    assert.doesNotMatch(js, /\brequestAnimationFrame\b|\bsetInterval\s*\(/i, 'No animation APIs should be used');
  });
});

describe('index.html - loadJSON behavior (isolated evaluation)', () => {
  const js = extractModuleScript(html);
  const fnSrc = extractFunctionSource(js, 'loadJSON');

  it('can extract the loadJSON function source', () => {
    assert.ok(fnSrc && fnSrc.includes('async function loadJSON'), 'Failed to extract loadJSON source');
  });

  it('returns parsed JSON on success and uses cache:"no-store"', async () => {
    const sandbox = { module: {}, console };
    let captured = null;
    sandbox.fetch = async (pathArg, opts) => {
      captured = { path: pathArg, opts };
      return { ok: true, json: async () => ({ path: pathArg, ok: true }) };
    };
    vm.runInNewContext(fnSrc, sandbox);
    assert.strictEqual(typeof sandbox.loadJSON, 'function', 'loadJSON not defined in sandbox');

    const result = await sandbox.loadJSON('/palette.json');
    assert.deepStrictEqual(result, { path: '/palette.json', ok: true }, 'Expected parsed JSON return');
    assert.ok(captured, 'fetch was not called');
    assert.strictEqual(captured.opts && captured.opts.cache, 'no-store', 'Expected cache:"no-store" in fetch options');
  });

  it('returns null when response.ok is false', async () => {
    const sandbox = { module: {}, console };
    sandbox.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
    vm.runInNewContext(fnSrc, sandbox);
    const out = await sandbox.loadJSON('/missing.json');
    assert.strictEqual(out, null, 'Expected null on non-ok response');
  });

  it('returns null when fetch throws', async () => {
    const sandbox = { module: {}, console };
    sandbox.fetch = async () => { throw new Error('network'); };
    vm.runInNewContext(fnSrc, sandbox);
    const out = await sandbox.loadJSON('/error.json');
    assert.strictEqual(out, null, 'Expected null when fetch throws');
  });
});