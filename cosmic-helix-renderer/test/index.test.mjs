/**
 * Tests for index.html (Cosmic Helix Renderer)
 *
 * Testing framework used:
 *   - Node.js built-in test runner (node:test) with node:assert/strict.
 *     If your project uses Jest/Vitest, you can switch the imports to the framework's test API.
 *
 * Scope and focus:
 *   - Validate the static HTML structure and accessible attributes.
 *   - Validate inline <style> CSS tokens and ND-safe guardrails presence.
 *   - Validate inline <script type="module"> content including:
 *       * presence and structure of loadJSON function
 *       * fallback palette default values and merging semantics (by inspecting source)
 *       * status text messages strings for both palette-present and fallback paths
 *       * NUM constants presence and expected values
 *       * renderHelix import and invocation signature presence
 *
 * Notes:
 *   - We do not execute the module script in a browser-like environment to avoid adding dependencies.
 *   - Instead, we parse and assert on the source text and, where applicable, evaluate isolated functions (e.g., loadJSON).
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const indexHtmlCandidates = [
  path.join(projectRoot, 'index.html'),
  // Fallback: repo root if the file is kept one level up (less likely)
  path.resolve(projectRoot, '..', 'index.html'),
];

async function readIndexHtml() {
  let lastErr;
  for (const p of indexHtmlCandidates) {
    try {
      const content = await fs.readFile(p, 'utf8');
      return { content, filePath: p };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`index.html not found in expected locations: ${indexHtmlCandidates.join(', ')}. Last error: ${lastErr}`);
}

// Utility: extract the first <style>...</style> and first <script type="module">...</script> blocks.
function extractTagContent(html, tagName, attributesRegex = '') {
  const re = new RegExp(`<${tagName}\\b${attributesRegex}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

// Utility: normalize whitespace for simple contains checks.
function squish(s) {
  return s.replace(/\s+/g, ' ').trim();
}

let html = '';
let styleBlock = '';
let moduleScript = '';
let filePath = '';

describe('Cosmic Helix Renderer index.html', () => {
  before(async () => {
    const res = await readIndexHtml();
    html = res.content;
    filePath = res.filePath;

    styleBlock = extractTagContent(html, 'style') ?? '';
    moduleScript = extractTagContent(html, 'script', '[^>]*type="module"') ?? '';
  });

  after(() => {
    // no-op
  });

  test('document has correct doctype and language', () => {
    assert.match(html, /<\!doctype html>/i, 'doctype should be HTML5');
    assert.match(html, /<html[^>]*\blang="en"/i, 'html lang should be en');
  });

  test('head contains correct meta and title', () => {
    assert.match(html, /<title>\s*Cosmic Helix Renderer \(ND-safe, Offline\)\s*<\/title>/i, 'title should match');
    assert.match(html, /<meta[^>]*charset="utf-8"/i, 'charset meta present');
    assert.match(html, /<meta[^>]*name="viewport"[^>]*content="[^"]*viewport-fit=cover[^"]*"/i, 'viewport meta with viewport-fit=cover');
    assert.match(html, /<meta[^>]*name="color-scheme"[^>]*content="light dark"/i, 'color-scheme meta present');
  });

  test('header includes status element with proper ARIA semantics', () => {
    assert.match(html, /<div[^>]*id="status"[^>]*class="status"[^>]*role="status"[^>]*aria-live="polite"[^>]*>/i, 'status element should exist with ARIA attributes');
    assert.match(html, />\s*Loading palette…\s*<\/div>/, 'status element initial text should be "Loading palette…"');
  });

  test('main contains canvas with expected attributes for accessibility', () => {
    assert.match(
      html,
      /<canvas[^>]*id="stage"[^>]*width="1440"[^>]*height="900"[^>]*role="img"[^>]*aria-label="Layered sacred geometry canvas"[^>]*><\/canvas>/i,
      'canvas should have correct id, size, role, and aria-label'
    );
  });

  test('inline style block defines ND-safe variables and media query for responsive canvas', () => {
    assert.ok(styleBlock && styleBlock.length > 0, 'style block should be present');

    const s = squish(styleBlock);
    assert.match(s, /:root\s*\{\s*--bg:\s*#0b0b12;\s*--ink:\s*#e8e8f0;\s*--muted:\s*#a6a6c1;\s*\}/i, 'root CSS variables match expected ND-safe palette');
    assert.match(s, /#stage\s*\{\s*display:block;[^}]*width:\s*1440px;[^}]*height:\s*900px;[^}]*\}/i, 'stage has expected base dimensions');
    assert.match(s, /@media\s*\(max-width:\s*1500px\)\s*\{\s*#stage\s*\{\s*width:\s*100%;\s*height:\s*auto;[^}]*\}\s*\}/i, 'responsive rule for stage present');
  });

  test('module script imports renderHelix and prepares canvas context', () => {
    assert.ok(moduleScript && moduleScript.length > 0, 'module script should be present');

    const s = squish(moduleScript);
    assert.match(s, /import\s*\{\s*renderHelix\s*\}\s*from\s*["']\.\/js\/helix-renderer\.mjs["'];/i, 'renderHelix should be imported from expected module');
    assert.match(s, /const\s+canvas\s*=\s*document\.getElementById\(["']stage["']\);/i, 'canvas element is selected');
    assert.match(s, /const\s+ctx\s*=\s*canvas\.getContext\(["']2d["']\);/i, '2D context is acquired');
  });

  test('module script defines loadJSON with offline-friendly behavior (success, non-ok, and error cases)', async () => {
    // Extract the loadJSON function body from the moduleScript.
    const fnMatch = moduleScript.match(/async\s+function\s+loadJSON\s*\(\s*path\s*\)\s*\{[\s\S]*?\n\s*\}/m);
    assert.ok(fnMatch, 'loadJSON function should be defined in the module script');
    const fnCode = fnMatch[0];

    // Build an isolated async function from the source.
    // We wrap it into an IIFE that returns the function object so we can call it in tests.
    // eslint-disable-next-line no-new-func
    const loaderFactory = new Function(`
      "use strict";
      ${fnCode}
      return loadJSON;
    `);
    const loadJSON = loaderFactory();
    assert.equal(typeof loadJSON, 'function', 'loadJSON should be a function');

    // Mock global fetch for different scenarios.
    const originalFetch = globalThis.fetch;

    try {
      // Case 1: Success path
      globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({ ok: true, palette: { bg: '#111111' } }),
      });
      const successRes = await loadJSON('./data/palette.json');
      assert.deepEqual(successRes, { ok: true, palette: { bg: '#111111' } }, 'loadJSON should return parsed JSON on success');

      // Case 2: Non-ok response (e.g., 404) should return null (after internal throw/catch)
      globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
      const notOkRes = await loadJSON('./data/miss.json');
      assert.equal(notOkRes, null, 'loadJSON should return null on non-ok status');

      // Case 3: Fetch throws -> return null
      globalThis.fetch = async () => { throw new Error('network down'); };
      const errorRes = await loadJSON('./data/error.json');
      assert.equal(errorRes, null, 'loadJSON should return null on thrown fetch error');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('module script contains defaults.palette and fallback messaging strings', () => {
    const s = moduleScript;

    // Validate default palette values are present
    assert.match(s, /defaults\s*=\s*\{\s*[\s\S]*palette\s*:\s*\{\s*[\s\S]*bg:\s*["']#0b0b12["'][\s\S]*ink:\s*["']#e8e8f0["'][\s\S]*muted:\s*["']#a6a6c1["'][\s\S]*layers:\s*\[[\s\S]*\][\s\S]*\}[\s\S]*\}/m, 'defaults.palette should exist with expected keys');

    // Status text messages for both branches
    assert.match(s, /statusEl\.textContent\s*=\s*hasPalette\s*\?\s*["']Palette loaded\.["']\s*:\s*["']Palette missing; using safe fallback\.["'];/m, 'status messages for palette present/missing should exist');
  });

  test('module script defines NUM constants with expected sacred numbers', () => {
    const s = moduleScript;
    // Check presence of expected constants and values
    const expectedPairs = [
      ['THREE', '3'],
      ['SEVEN', '7'],
      ['NINE', '9'],
      ['ELEVEN', '11'],
      ['TWENTYTWO', '22'],
      ['THIRTYTHREE', '33'],
      ['NINETYNINE', '99'],
      ['ONEFORTYFOUR', '144'],
    ];

    for (const [name, value] of expectedPairs) {
      const re = new RegExp(`\\b${name}\\s*:\\s*${value}\\b`);
      assert.match(s, re, `NUM.${name} should equal ${value}`);
    }
  });

  test('module script applies CSS variables from active palette to :root', () => {
    const s = squish(moduleScript);
    assert.match(s, /document\.documentElement\.style\.setProperty\(["']--bg["'],\s*active\.bg\)/, 'sets --bg from active.bg');
    assert.match(s, /document\.documentElement\.style\.setProperty\(["']--ink["'],\s*active\.ink\)/, 'sets --ink from active.ink');
    assert.match(s, /document\.documentElement\.style\.setProperty\(["']--muted["'],\s*active\.muted\)/, 'sets --muted from active.muted');
  });

  test('module script invokes renderHelix with expected arguments and options object', () => {
    const s = squish(moduleScript);
    assert.match(
      s,
      /renderHelix\s*\(\s*ctx\s*,\s*\{\s*width:\s*canvas\.width\s*,\s*height:\s*canvas\.height\s*,\s*palette:\s*active\s*,\s*NUM\s*\}\s*\)/,
      'renderHelix should be called with ctx and options containing width, height, palette, and NUM'
    );
  });

  test('module script gracefully handles missing 2D context (fallback status message)', () => {
    const s = squish(moduleScript);
    assert.match(
      s,
      /if\s*\(\!ctx\)\s*\{\s*statusEl\.textContent\s*=\s*["']Canvas context unavailable; showing calm fallback notice\.["']/,
      'should set a calm fallback message when ctx is unavailable'
    );
  });
});