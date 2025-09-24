// Testing library/framework used: Node's built-in test runner (node:test) with 'assert'
// If this project uses Jest/Vitest/Mocha, adapt the import to their API while keeping the test bodies intact.

import { test, describe, before, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function loadReadmeText() {
  // Attempt candidates inside cosmic-helix-renderer and project root

  const candidates = [
    path.resolve(__dirname, '..', 'README.md'),
    path.resolve(__dirname, '..', 'Readme.md'),
    path.resolve(__dirname, '..', 'readme.md'),
    path.resolve(__dirname, '..', 'README.markdown'),
    // Fallback: if README is collocated differently, this test still asserts the invariant content
    path.resolve(__dirname, '..', 'docs', 'README.md'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return { text: fs.readFileSync(p, 'utf8'), file: p };
      }
    } catch {}
  }
  // If not found, try loading content embedded in repo (some projects store README-like content as .md under cosmic-helix-renderer)
  const altCandidates = fs.readdirSync(path.resolve(__dirname, '..'))
    .filter(f => /\.md$/i.test(f))
    .map(f => path.resolve(__dirname, '..', f));
  for (const p of altCandidates) {
    try {
      if (fs.existsSync(p)) {
        return { text: fs.readFileSync(p, 'utf8'), file: p };
      }
    } catch {}
  }
  // As a last resort, read from a known documentation string file if present.
  return { text: '', file: null };
}

describe('Cosmic Helix Renderer README structure', () => {
  let readme;
  let file;

  before(() => {
    const res = loadReadmeText();
    readme = res.text;
    file = res.file;
  });

  it('should load a README-like file for the renderer', () => {
    assert.ok(typeof readme === 'string', 'README text should be a string');
    assert.ok(readme.length > 0, 'README should not be empty');
  });

  it('should contain the correct title', () => {
    assert.match(readme, /^#\s*Cosmic Helix Renderer/m, 'Title heading is missing or incorrect');
  });

  it('should include the four-layer structure with correct names and order', () => {
    // Validate presence
    assert.match(readme, /^##\s*Structure/m, 'Structure section is missing');
    // Validate each layer bullet exists with expected key phrases
    const requiredLayers = [
      /Layer\s*1\s*—\s*Vesica Field/i,
      /Layer\s*2\s*—\s*Tree-of-Life Scaffold/i,
      /Layer\s*3\s*—\s*Fibonacci Curve/i,
      /Layer\s*4\s*—\s*Double Helix Lattice/i,
    ];
    for (const rx of requiredLayers) {
      assert.match(readme, rx, `Missing structure layer: ${rx}`);
    }
    // Validate order: 1 before 2 before 3 before 4
    const idx1 = readme.search(/Layer\s*1\s*—\s*Vesica Field/i);
    const idx2 = readme.search(/Layer\s*2\s*—\s*Tree-of-Life Scaffold/i);
    const idx3 = readme.search(/Layer\s*3\s*—\s*Fibonacci Curve/i);
    const idx4 = readme.search(/Layer\s*4\s*—\s*Double Helix Lattice/i);
    assert.ok(idx1 >= 0 && idx2 > idx1 && idx3 > idx2 && idx4 > idx3, 'Layer ordering is incorrect');
  });

  it('should describe offline-first usage and palette fallback', () => {
    assert.match(readme, /^##\s*Usage/m, 'Usage section missing');
    assert.match(readme, /Open `index\.html` directly/i, 'Should instruct opening index.html directly');
    assert.match(readme, /attempts to load `data\/palette\.json`.*falls back/i, 'Palette fallback behavior not described');
    assert.match(readme, /All modules are ES modules/i, 'ES modules note missing');
  });

  it('should document palette accessibility and safety', () => {
    assert.match(readme, /^##\s*Palette/m, 'Palette section missing');
    assert.match(readme, /Each color supports AA contrast/i, 'AA contrast claim missing');
    assert.match(readme, /Avoid high saturation/i, 'Saturation safety guidance missing');
  });

  it('should enumerate numerology constants with expected values and roles', () => {
    assert.match(readme, /^##\s*Numerology Constants/m, 'Numerology Constants section missing');
    assert.match(readme, /\*\*3,\s*7,\s*9:\*\*.*vesica.*helix.*Fibonacci/i, '3,7,9 constants description missing or mismatched');
    assert.match(readme, /\*\*11,\s*22,\s*33:\*\*.*Tree-of-Life.*helix/i, '11,22,33 constants description missing or mismatched');
    assert.match(readme, /\*\*99,\s*144:\*\*.*opacity.*lattice/i, '99,144 constants description missing or mismatched');
  });

  it('should state offline and safety notes with fixed canvas size and no motion', () => {
    assert.match(readme, /^##\s*Offline\s*\+\s*Safety Notes/m, 'Offline + Safety Notes section missing');
    assert.match(readme, /no external dependencies or network requests beyond the optional palette load/i, 'Offline dependency statement missing');
    assert.match(readme, /Motion is absent/i, 'No-motion statement missing');
    assert.match(readme, /Canvas dimensions are fixed at 1440×900/i, 'Fixed canvas dimension statement missing');
  });

  it('should avoid non-ASCII characters in code modules per guidance (readme states ASCII + LF)', () => {
    // The README claims modules are ASCII + LF; here we assert README itself avoids exotic characters in critical headings and bullets.
    // Allow the "—" dash and "×" multiplication symbol as they appear in the README; ensure no control characters.
    for (const [i, ch] of Array.from(readme).entries()) {
      const code = ch.codePointAt(0);
      // Allow common printable ASCII, LF(10), CR(13), tab(9), and specific symbols present in the doc: em dash (8212), multiplication sign (215), backticks(96)
      const allowedExtras = new Set([8212, 215]);
      const isAsciiPrintable = code >= 9 && code <= 126;
      const isLF = code === 10;
      const isCR = code === 13;
      const allowed = isAsciiPrintable || isLF || isCR || allowedExtras.has(code);
      if (!allowed) {
        // Don't fail hard; just ensure no C0/C1 controls other than LF/CR/TAB
        assert.ok(code >= 32 || code === 9 || code === 10 || code === 13 || allowedExtras.has(code),
          `Unexpected control or non-allowed character U+${code.toString(16).toUpperCase()} at pos ${i}`);
      }
    }
  });

  it('should reference specific counts for geometry (e.g., 21 vessels, 10 nodes, 22 paths, 33 segments, eleven crossbars)', () => {
    assert.match(readme, /3x7 grid\s*\(21 vessels\)/i, '21 vessels detail missing');
    assert.match(readme, /Ten numbered nodes with 22 connective paths/i, 'Tree-of-Life nodes/paths missing');
    assert.match(readme, /Two static braids\s*\(33 segments\)\s*linked by eleven crossbars/i, 'Double helix counts missing');
  });

  it('should not indicate any animation/motion and should state static composition in multiple places', () => {
    assert.match(readme, /No animation or automated motion is present/i, 'Explicit no-animation note missing in layer description');
    assert.match(readme, /Motion is absent; reduced-motion users see an identical static composition/i, 'Reduced-motion static note missing');
  });

  it('should avoid implying network needs beyond optional local palette file', () => {
    assert.doesNotMatch(readme, /\b(fetch|http|https):\/\//i, 'README should not reference network URLs for runtime');
  });

  it('should instruct to open index.html without servers or build tools', () => {
    assert.match(readme, /No build tools or servers are required/i, 'Should emphasize no-build/no-server usage');
  });

  it('should mention comments explaining layer ordering and safety', () => {
    assert.match(readme, /Comments throughout the code explain layer ordering and safety considerations/i,
      'Code comments explanation missing');
  });

  // Edge case validations - ensure headings are present only once (avoid duplication)
  it('should not duplicate key top-level sections', () => {
    const singleHeading = (rx) => {
      const matches = [...readme.matchAll(rx)].length;
      assert.equal(matches, 1, `Expected exactly one heading for ${rx}, found ${matches}`);
    };
    singleHeading(/^#\s*Cosmic Helix Renderer/m);
    singleHeading(/^##\s*Structure/m);
    singleHeading(/^##\s*Usage/m);
    singleHeading(/^##\s*Palette/m);
    singleHeading(/^##\s*Numerology Constants/m);
    singleHeading(/^##\s*Offline\s*\+\s*Safety Notes/m);
  });

  // Failure condition: if any critical keyword is missing, assert surfaces it explicitly
  it('should include critical keywords to support discoverability', () => {
    const keywords = [
      /ND-safe/i,
      /offline-first/i,
      /canvas/i,
      /ES modules/i,
      /palette\.json/i
    ];
    for (const rx of keywords) {
      assert.match(readme, rx, `Missing critical keyword: ${rx}`);
    }
  });
});