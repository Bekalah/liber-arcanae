import { describe, it, beforeAll } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');

async function findReadmeLikeFile() {
  const candidates = [
    'README.md',
    'Readme.md',
    'readme.md',
    'docs/README.md',
    'docs/readme.md',
    'README.mdx',
    'DOCS.md',
    'readme_renderer.md',
    'README.txt',
  ];
  for (const rel of candidates) {
    const p = path.join(repoRoot, rel);
    try {
      const st = await fs.stat(p);
      if (st.isFile()) return p;
    } catch {}
  }
  // Fallback: scan a few likely docs for the anchor phrase
  // To keep things dependency-free and lightweight, we check a small set of paths.
  const more = ['.', 'docs', 'documentation', 'site'];
  const anchor = /Cosmic Helix Renderer|Per Texturas Numerorum, Spira Loquitur\./;
  for (const base of more) {
    const abs = path.join(repoRoot, base);
    try {
      const entries = await fs.readdir(abs, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isFile()) continue;
        const name = e.name.toLowerCase();
        if (!name.endsWith('.md') && !name.endsWith('.mdx') && !name.endsWith('.txt')) continue;
        const p = path.join(abs, e.name);
        const txt = await fs.readFile(p, 'utf8');
        if (anchor.test(txt)) return p;
      }
    } catch {}
  }
  return null;
}

let docPath = null;
let doc = '';

describe('Cosmic Helix Renderer documentation (content and links)', () => {
  beforeAll(async () => {
    docPath = await findReadmeLikeFile();
    assert.ok(docPath, 'Could not locate the documentation file containing "Cosmic Helix Renderer". Please ensure README exists.');
    doc = await fs.readFile(docPath, 'utf8');
  });

  it('contains the title header and opening motto', () => {
    assert.match(doc, /^#\s+Cosmic Helix Renderer/m, 'Missing or altered main H1 "Cosmic Helix Renderer"');
    assert.match(doc, /Per Texturas Numerorum, Spira Loquitur\./, 'Missing opening motto "Per Texturas Numerorum, Spira Loquitur."');
  });

  it('describes local use with explicit offline guidance', () => {
    assert.match(doc, /##\s+Local Use/m, 'Missing "Local Use" section');
    assert.match(doc, /Double-click\s+\[index\.html\]\(.\/index\.html\)\s+in any modern browser/i, 'Missing or altered local use instruction referencing index.html');
    assert.match(doc, /1440×900/, 'Missing canvas size "1440×900"');
    assert.match(doc, /Everything runs offline\./, 'Missing explicit offline statement "Everything runs offline."');
  });

  it('lists the four Layers with correct order and wording', () => {
    const layerOrder = [
      /\*\*Vesica field\*\s*–\s*intersecting circles laid out with the constant 3\./i,
      /\*\*Tree-of-Life\*\s*–\s*ten sephirot with twenty-two connecting paths\./i,
      /\*\*Fibonacci curve\*\s*–\s*fixed logarithmic spiral honoring natural growth\./i,
      /\*\*Double-helix lattice\*\s*–\s*two phase-shifted strands with calm crossbars\./i,
    ];
    for (const re of layerOrder) {
      assert.match(doc, re, `Missing or altered layer item: ${re}`);
    }
  });

  it('references the palette file and fallback behavior', () => {
    assert.match(doc, /data\/palette\.json\)\./, 'Missing link mention to data/palette.json');
    assert.match(doc, /falls back to built-in hues/i, 'Missing fallback description for missing palette');
  });

  it('includes Numerology as Spiral Grammar with key constants', () => {
    assert.match(doc, /##\s+Numerology as Spiral Grammar/m, 'Missing "Numerology as Spiral Grammar" section');
    const bullets = [
      /\*\*21 pillars\*\*.*\b8\s*\+\s*13\b/i,
      /\*\*33 spine\*\*/i,
      /\*\*72 Shem angels\/demons\*\*.*\(8 × 9\)/i,
      /\*\*78 archetypes\*\*/i,
      /\*\*99 gates\*\*.*\(3 × 33\)/i,
      /\*\*144 lattice\*\*.*8th Fibonacci/i,
      /\*\*243 completion\*\*.*3⁵/i,
    ];
    for (const re of bullets) {
      assert.match(doc, re, `Missing or altered numerology bullet: ${re}`);
    }
    assert.match(doc, /sacred numbers 3, 7, 9, 11, 22, 33, 99, and 144/i, 'Missing list of sacred numbers');
  });

  it('documents ND-safe notes and accessibility claims', () => {
    assert.match(doc, /##\s+ND-safe Notes/m, 'Missing "ND-safe Notes" section');
    assert.match(doc, /No motion or flashing.*render statically/i, 'Missing ND-safe note about no motion');
    assert.match(doc, /Palette uses gentle contrast.*reduced-motion/i, 'Missing note about gentle contrast and reduced-motion');
    assert.match(doc, /Skip link, `<main>` landmark, and status messaging/i, 'Missing accessibility navigation note');
    assert.match(doc, /Pure functions, ES modules, UTF-8, and LF newlines\./i, 'Missing implementation stack note (pure functions/ESM/UTF-8/LF)');
  });

  it('contains valid intra-repo links that should exist', async () => {
    // Validate links that should be present in the repository
    const requiredFiles = [
      'index.html',
      'js/helix-renderer.mjs',
      // palette is optional; do not fail if absent—document states fallback
    ];
    for (const rel of requiredFiles) {
      const abs = path.join(repoRoot, rel);
      try {
        const st = await fs.stat(abs);
        assert.ok(st.isFile(), `Expected file exists but is not a regular file: ${rel}`);
      } catch {
        assert.fail(`Missing required file linked in docs: ${rel}`);
      }
    }
  });

  it('does not require palette.json to exist (optional, fallback allowed)', async () => {
    const palettePath = path.join(repoRoot, 'data', 'palette.json');
    try {
      const st = await fs.stat(palettePath);
      assert.ok(st.isFile(), 'palette.json exists but is not a regular file');
    } catch {
      // If missing, ensure the doc explicitly states fallback behavior
      assert.match(doc, /falls back to built-in hues/i, 'palette.json missing but docs do not state fallback behavior');
    }
  });
});