/**
 * Testing library/framework: Jest or Vitest (both support describe/it/expect in ESM).
 * These tests use only Node.js built-ins (fs, path) and no new dependencies.
 * Focus: Validate README_RENDERER.md content and referenced file existence.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { repoRoot } from '../test-utils/pathHelpers.js';

const readmePath = repoRoot('README_RENDERER.md');

function readReadme() {
  if (!existsSync(readmePath)) {
    // Graceful skip if file missing in this PR branch
    return null;
  }
  return readFileSync(readmePath, 'utf8');
}

describe('README_RENDERER.md structure and content', () => {
  let text;
  beforeAll(() => {
    text = readReadme();
  });

  it('should exist at repository root as README_RENDERER.md', () => {
    expect(existsSync(readmePath)).toBe(true);
  });

  it('should start with the H1 "Cosmic Helix Renderer"', () => {
    expect(text).toMatch(/^#\s+Cosmic Helix Renderer/m);
  });

  it('mentions no build step and opening index.html with 1440×900 canvas', () => {
    // Accept both × and x for robustness
    expect(text).toMatch(/double-click\s+`index\.html`\s+to open\s+the\s+1440[×x]900 canvas/i);
  });

  describe('Files section', () => {
    it('lists index.html, js/helix-renderer.mjs, data/palette.json', () => {
      expect(text).toMatch(/- `index\.html`/);
      expect(text).toMatch(/- `js\/helix-renderer\.mjs`/);
      expect(text).toMatch(/- `data\/palette\.json`/);
    });

    it('referenced files exist (index.html and js/helix-renderer.mjs). palette.json may be optional', () => {
      const idx = repoRoot('index.html');
      const mjs = repoRoot('js', 'helix-renderer.mjs');
      const palette = repoRoot('data', 'palette.json');
      expect(existsSync(idx)).toBe(true);
      expect(existsSync(mjs)).toBe(true);
      // palette can be missing; README says renderer falls back if missing
      // If present, ensure it is valid JSON
      if (existsSync(palette)) {
        const raw = readFileSync(palette, 'utf8');
        expect(() => JSON.parse(raw)).not.toThrow();
      }
    });
  });

  describe('Layer order section', () => {
    it('includes the four named layers in order', () => {
      const order = [
        /\*\*Vesica field\*\*/,
        /\*\*Tree of Life\*\*/,
        /\*\*Fibonacci curve\*\*/,
        /\*\*Double helix lattice\*\*/
      ];
      let startIndex = 0;
      for (const re of order) {
        const match = text.slice(startIndex).match(re);
        expect(match).toBeTruthy();
        startIndex += match.index + 1;
      }
    });

    it('captures key constants and descriptors for each layer', () => {
      // Vesica field
      expect(text).toMatch(/7×9 grid|7x9 grid/);
      expect(text).toMatch(/\bconstants?\s+7,\s*9,\s*11,\s*and\s*33\b/i);
      // Tree of Life
      expect(text).toMatch(/\bTen sephirot\b/i);
      expect(text).toMatch(/\btwenty-two paths\b/i);
      expect(text).toMatch(/\bscaled with constants\s+3,\s*7,\s*9,\s*11,\s*22,\s*and\s*33\b/i);
      // Fibonacci curve
      expect(text).toMatch(/\bmarkers every\s+11 steps\b/i);
      expect(text).toMatch(/\banchored by\s+22,\s*33,\s*and\s*144\b/i);
      // Double helix lattice
      expect(text).toMatch(/\bsampled across\s+99 points\b/i);
      expect(text).toMatch(/\b22\s+static rungs\b/i);
      expect(text).toMatch(/\bhelix never animates\b/i);
    });
  });

  describe('ND-safe choices section', () => {
    it('lists ND-safe choices and includes four bullets', () => {
      const sectionMatch = text.match(/## ND-safe choices([\s\S]*?)##/m) || text.match(/## ND-safe choices([\s\S]*)$/m);
      expect(sectionMatch).toBeTruthy();
      const block = sectionMatch[1];
      const bullets = (block.match(/^- /gm) || []).length;
      expect(bullets).toBeGreaterThanOrEqual(4);
      expect(block).toMatch(/No animation, autoplay, or flashing changes\./i);
      expect(block).toMatch(/Calming palette with sufficient contrast/i);
      expect(block).toMatch(/Pure geometric primitives/i);
      expect(block).toMatch(/Canvas is deterministic/i);
    });
  });

  describe('Offline usage section', () => {
    it('explains direct file opening and palette fallback behavior', () => {
      const off = text.match(/## Offline usage([\s\S]*)$/m);
      expect(off).toBeTruthy();
      const block = off[1];
      expect(block).toMatch(/Open `index\.html` directly/i);
      expect(block).toMatch(/If the palette JSON cannot be read/i);
      expect(block).toMatch(/switches to the built-in safe palette/i);
    });
  });
});