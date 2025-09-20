/**
 * Tests for README claims and renderer surface.
 * Test runner: Node.js built-in `node:test` with `node:assert/strict`.
 * These tests favor offline, dependency-free validation and skip gracefully
 * if optional assets are absent (e.g., data/palette.json).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const r = (p) => path.resolve(root, p);
const exists = (p) => fs.existsSync(r(p));
const readText = (p) => {
  try { return fs.readFileSync(r(p), 'utf8'); } catch { return null; }
};
const findReadme = () => {
  for (const name of ['README.md', 'Readme.md', 'readme.md']) {
    if (exists(name)) return name;
  }
  return null;
};

test('README: has title and key sections and links use relative paths', (t) => {
  const readmePath = findReadme();
  if (!readmePath) {
    t.skip('No README found at repo root');
  }
  const md = readText(readmePath);
  assert.ok(md && md.length > 0, 'README should be non-empty');

  // Title
  assert.match(md, /^#\s*Cosmic Helix Renderer/m, 'Missing H1 "Cosmic Helix Renderer"');

  // Sections referenced in the snippet
  assert.match(md, /^##\s*Files/m, 'Missing "Files" section');
  assert.match(md, /^##\s*Layer Order/m, 'Missing "Layer Order" section');
  assert.match(md, /^##\s*Numerology Anchors/m, 'Missing "Numerology Anchors" section');
  assert.match(md, /^##\s*Offline Use/m, 'Missing "Offline Use" section');
  assert.match(md, /^##\s*ND-safe Notes/m, 'Missing "ND-safe Notes" section');

  // Relative links
  assert.match(md, /\]\(\.\/index\.html\)/, 'README should link to ./index.html');
  assert.match(md, /\]\(\.\/js\/helix-renderer\.mjs\)/, 'README should link to ./js/helix-renderer.mjs');
  // palette.json is optional; only enforce existence if linked explicitly
  if (/\]\(\.\/data\/palette\.json\)/.test(md)) {
    assert.ok(exists('data/palette.json'), 'README links palette.json but file is missing');
  }
});

test('index.html: contains a canvas and references the module (offline-friendly)', (t) => {
  if (!exists('index.html')) {
    t.skip('index.html not found at repo root');
  }
  const html = readText('index.html');
  assert.ok(/<canvas/i.test(html), 'Expected a <canvas> element');

  // Prefer explicit width/height attributes per README (1440×900). Accept either on the tag or as attributes in any order.
  const canvasTag = html.match(/<canvas[^>]*>/i)?.[0] || '';
  const hasWidth = /width\s*=\s*["']?1440["']?/i.test(canvasTag) || /1440/.test(html);
  const hasHeight = /height\s*=\s*["']?900["']?/i.test(canvasTag) || /900/.test(html);
  assert.ok(hasWidth && hasHeight, 'Canvas should indicate 1440×900 dimensions (attr or inline)');

  // Must reference the ESM renderer module somewhere
  assert.ok(/js\/helix-renderer\.mjs/i.test(html), 'Expected reference to js/helix-renderer.mjs');

  // No external http(s) references for offline use
  const externalUrls = html.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  assert.equal(externalUrls.length, 0, `index.html should avoid external URLs; found ${externalUrls.join(', ')}`);
});

test('renderer module: exports a renderHelix function (named or default)', async (t) => {
  if (!exists('js/helix-renderer.mjs')) {
    t.skip('js/helix-renderer.mjs not found');
  }
  const url = pathToFileURL(r('js/helix-renderer.mjs')).href;

  // Dynamic import; do not execute the export, only assert the surface.
  const mod = await import(url);
  const fn = mod.renderHelix ?? mod.default;
  assert.equal(typeof fn, 'function', 'Expected named export renderHelix or a default function export');
});

test('renderer source and/or README mention numerology anchors', (t) => {
  const numerology = [3, 7, 9, 11, 22, 33, 99, 144];
  const sources = [];

  const mdPath = findReadme();
  if (mdPath) sources.push(readText(mdPath));
  if (exists('js/helix-renderer.mjs')) sources.push(readText('js/helix-renderer.mjs'));

  if (sources.length === 0) {
    t.skip('No sources available to check numerology anchors');
  }

  const present = new Set();
  for (const n of numerology) {
    const rx = new RegExp(`\\b${String(n)}\\b`);
    if (sources.some((s) => typeof s === 'string' && rx.test(s))) {
      present.add(n);
    }
  }
  // Require at least several anchors to be documented/used
  assert.ok(present.size >= 5, `Expected at least 5 numerology anchors referenced; found: ${[...present].join(', ')}`);
});

test('palette.json (if present): valid shape and color formats', async (t) => {
  if (!exists('data/palette.json')) {
    t.skip('palette.json is optional and not present');
  }
  const raw = await fsp.readFile(r('data/palette.json'), 'utf8');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    assert.fail('palette.json is not valid JSON');
  }

  // Accept either a raw array of hex colors or an object with a "colors"/"palette" array
  let colors = Array.isArray(parsed) ? parsed : (parsed?.colors || parsed?.palette || null);
  assert.ok(Array.isArray(colors), 'palette.json should be an array or an object with a colors/palette array');

  // Basic validation: hex colors (#RGB or #RRGGBB), case-insensitive
  const hex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
  assert.ok(colors.length >= 3, 'Palette should contain at least 3 colors');
  for (const [i, c] of colors.entries()) {
    assert.equal(typeof c, 'string', `Color at index ${i} must be a string`);
    assert.ok(hex.test(c.trim()), `Color at index ${i} is not a valid hex: ${c}`);
  }
});

test('Offline promise: no external URLs in renderer module', (t) => {
  if (!exists('js/helix-renderer.mjs')) {
    t.skip('js/helix-renderer.mjs not found');
  }
  const src = readText('js/helix-renderer.mjs') || '';
  const externals = src.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  assert.equal(externals.length, 0, `Renderer module should avoid external URLs; found ${externals.join(', ')}`);
});