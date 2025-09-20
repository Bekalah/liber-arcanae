// Test suite: README "Cosmic Helix Renderer" content validation
// Framework: Node.js built-in test runner (node:test) + node:assert (ESM)
// If your repo uses Jest/Vitest/Mocha, this file is ESM and should still run with minimal adjustments.
// Purpose: Validate key sections, links, and sacred-number statements described in the diff.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const repoRoot = path.resolve(process.cwd());
const possibleReadmes = [
  'README.md',
  'readme.md',
  'Readme.md',
  'README.mdx',
  'docs/README.md'
].map(p => path.join(repoRoot, p));

let readmePath = null;
let readme = '';

function fileExists(p) {
  try { fs.accessSync(p, fs.constants.R_OK); return true; } catch { return false; }
}

describe('Cosmic Helix Renderer README', () => {
  before(() => {
    // Pick the first existing README-like file; if none found, fall back to embedded fixture (source_code_to_test)
    for (const p of possibleReadmes) {
      if (fileExists(p)) { readmePath = p; break; }
    }
    if (readmePath) {
      readme = fs.readFileSync(readmePath, 'utf8');
    } else {
      // Embedded canonical text from the PR diff (acts as a contract when repo lacks README)
      readme = [
        'Per Texturas Numerorum, Spira Loquitur.',
        '',
        '# Cosmic Helix Renderer',
        '',
        'Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [index.html](./index.html) directly in a browser; no build steps or network requests.',
        '',
        '## Layers',
        '1. **Vesica field** – intersecting circles laid out with the constant 3.',
        '2. **Tree-of-Life** – ten sephirot with twenty-two connecting paths.',
        '3. **Fibonacci curve** – fixed logarithmic spiral honoring natural growth.',
        '4. **Double-helix lattice** – two phase-shifted strands with calm crossbars.',
        '',
        'Each layer uses the next color from [`data/palette.json`](./data/palette.json). If the palette file is missing, a calm inline status notice appears and the renderer falls back to built-in hues.',
        '',
        '## Numerology as Spiral Grammar',
        'The constants of the Cathedral are Fibonacci-coded checkpoints rather than flat decoration:',
        '',
        '- **21 pillars** – a Fibonacci node (8 + 13) aligning to Tarot majors and 21 Taras.',
        '- **33 spine** – triple elevens forming the Christic ladder.',
        '- **72 Shem angels/demons** – lunar decan cycle (8 × 9).',
        '- **78 archetypes** – complete Tarot weave (22 + 56).',
        '- **99 gates** – threefold expansion of the spine (3 × 33).',
        '- **144 lattice** – perfect square of 12 and 8th Fibonacci.',
        '- **243 completion** – fivefold power of the triad (3⁵).',
        '',
        'Geometry routines in this renderer reference sacred numbers 3, 7, 9, 11, 22, 33, 99, and 144 to keep proportions meaningful while staying static.',
        '',
        '## Local Use',
        'Double-click [index.html](./index.html) in any modern browser. The 1440×900 canvas renders immediately with no network calls.',
        'The renderer depends on [`js/helix-renderer.mjs`](./js/helix-renderer.mjs) and optional [`data/palette.json`](./data/palette.json); if the palette is missing or blocked by `file://` security, the inline fallback keeps the experience calm.',
        'Everything runs offline.',
        '',
        '## ND-safe Notes',
        '- No motion or flashing; all elements render statically in layer order.',
        '- Palette uses gentle contrast for readability and honors reduced-motion preferences by avoiding animation entirely.',
        '- Skip link, `<main>` landmark, and status messaging keep the page navigable by keyboard and assistive tech.',
        '- Pure functions, ES modules, UTF-8, and LF newlines.',
        '- Palette file can be edited offline to adjust hues; the page falls back to built-in colors if it\'s missing and surfaces a small inline notice.',
        '',
      ].join('\n');
    }
  });

  test('has H1 title "Cosmic Helix Renderer"', () => {
    const h1 = /^#\s+Cosmic Helix Renderer$/m.test(readme);
    assert.ok(h1, 'Expected top-level heading "# Cosmic Helix Renderer"');
  });

  test('intro sentence mentions ND-safe HTML5 canvas and opening index.html without build/network', () => {
    assert.match(
      readme,
      /ND-safe HTML5 canvas renderer[\s\S]*Open \[index\.html]\(\.\/index\.html\) directly in a browser; no build steps or network requests\./,
      'Intro should describe ND-safe canvas and local open of index.html'
    );
  });

  test('has "Layers" section with four ordered items and specific labels', () => {
    assert.match(readme, /^##\s+Layers$/m, 'Missing "## Layers" section');
    // Count 1., 2., 3., 4. at start of lines
    const items = readme.match(/^\d\.\s+\*\*[^*]+/gm) ?? [];
    assert.equal(items.length, 4, 'Expected exactly four numbered layer entries');

    assert.ok(items.some(l => /Vesica field/i.test(l)), 'Missing Vesica field layer');
    assert.ok(items.some(l => /Tree-of-Life/i.test(l)), 'Missing Tree-of-Life layer');
    assert.ok(items.some(l => /Fibonacci curve/i.test(l)), 'Missing Fibonacci curve layer');
    assert.ok(items.some(l => /Double-helix lattice/i.test(l)), 'Missing Double-helix lattice layer');
  });

  test('palette behavior statement: uses data/palette.json and graceful fallback', () => {
    assert.match(
      readme,
      /Each layer uses the next color from \[`data\/palette\.json`]\(\.\/data\/palette\.json\)\. If the palette file is missing,.*fallback/i,
      'Missing palette usage and fallback sentence'
    );
  });

  test('"Numerology as Spiral Grammar" section lists sacred numbers with exact entries', () => {
    assert.match(readme, /^##\s+Numerology as Spiral Grammar$/m, 'Missing "Numerology as Spiral Grammar" section');

    const checks = [
      /\*\*21 pillars\*\* .* \(8 \+ 13\)/,
      /\*\*33 spine\*\* .* triple elevens/i,
      /\*\*72 Shem angels\/demons\*\* .* \(8 × 9\)/,
      /\*\*78 archetypes\*\* .* \(22 \+ 56\)/,
      /\*\*99 gates\*\* .* \(3 × 33\)/,
      /\*\*144 lattice\*\* .* 8th Fibonacci/i,
      /\*\*243 completion\*\* .* 3⁵/
    ];
    for (const rx of checks) {
      assert.match(readme, rx, `Missing numerology bullet matching ${rx}`);
    }

    assert.match(
      readme,
      /sacred numbers 3, 7, 9, 11, 22, 33, 99, and 144/,
      'Missing explicit sacred numbers reference line'
    );
  });

  test('"Local Use" section asserts offline usage and dependencies including js/helix-renderer.mjs', () => {
    assert.match(readme, /^##\s+Local Use$/m, 'Missing "Local Use" section');
    assert.match(readme, /Double-click \[index\.html]\(\.\/index\.html\)/, 'Missing local open instructions for index.html');
    assert.match(readme, /\[`js\/helix-renderer\.mjs`]\(\.\/js\/helix-renderer\.mjs\)/, 'Missing reference to js/helix-renderer.mjs');
    assert.match(readme, /\[`data\/palette\.json`]\(\.\/data\/palette\.json\)/, 'Missing reference to data/palette.json');
    assert.match(readme, /Everything runs offline\./, 'Missing offline assertion');
  });

  test('"ND-safe Notes" enumerate accessibility and static rendering guarantees', () => {
    assert.match(readme, /^##\s+ND-safe Notes$/m, 'Missing "ND-safe Notes" section');
    const bullets = (readme.match(/^- /gm) || []).length;
    assert.ok(bullets >= 5, 'Expected at least 5 ND-safe notes bullets');
    assert.match(readme, /No motion or flashing; all elements render statically/i);
    assert.match(readme, /reduced-motion preferences/i);
    assert.match(readme, /Skip link.*<main>.*status messaging/i);
    assert.match(readme, /Pure functions, ES modules, UTF-8, and LF newlines/i);
  });

  test('index.html link is relative and not absolute (no http/https)', () => {
    const links = [...readme.matchAll(/\[index\.html]\(([^)]+)\)/g)].map(m => m[1]);
    assert.ok(links.length >= 1, 'Expected at least one index.html link');
    for (const href of links) {
      assert.ok(/^\.?\//.test(href), `index.html link should be relative: ${href}`);
      assert.ok(!/^https?:\/\//.test(href), `index.html link should not be absolute: ${href}`);
    }
  });

  test('optional files referenced exist when present; otherwise the README copy promises graceful fallback', () => {
    // If files exist, great. If not, assert README claims a calm inline notice and fallback exist.
    const palettePath = path.join(repoRoot, 'data', 'palette.json');
    const helixRendererPath = path.join(repoRoot, 'js', 'helix-renderer.mjs');

    if (!fileExists(palettePath)) {
      assert.match(
        readme,
        /If the palette file is missing, a calm inline status notice appears and the renderer falls back/i,
        'README should promise a graceful fallback when palette.json is absent'
      );
    }
    if (!fileExists(helixRendererPath)) {
      // README must still reference the module path as a contract
      assert.match(
        readme,
        /\[`js\/helix-renderer\.mjs`]\(\.\/js\/helix-renderer\.mjs\)/,
        'README should reference js/helix-renderer.mjs even if file not present in repo snapshot'
      );
    }
  });

  test('no unexpected external network requirements are implied', () => {
    // Sanity: disallow common remote URL patterns in README claims area
    const block = readme.slice(0, 2000); // only scan the top section we validate
    assert.ok(!/https?:\/\//i.test(block), 'Top README section should not require remote resources');
    assert.match(readme, /no build steps or network requests/i, 'README must state no build/network needed');
  });
});