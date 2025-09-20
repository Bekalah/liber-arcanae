/**
 * Palette tests
 * Testing library/framework note:
 * - This test file uses a runner-agnostic style that works with Vitest or Jest (ESM).
 *   If using Vitest: import { describe, it, expect } from 'vitest'
 *   If using Jest with ESM: globals 'describe/it/expect' are available if configured, or import from '@jest/globals'
 *
 * If your project is Jest (ESM):
 *   import { describe, it, expect } from '@jest/globals';
 * If your project is Vitest:
 *   import { describe, it, expect } from 'vitest';
 *
 * Adjust the single import line below to match your runner if necessary.
 */

/* Runner autodetect:
   Try Vitest first; if not available swap to @jest/globals during CI if needed.
*/
let testingLib;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  testingLib = await import('vitest');
} catch {
  // eslint-disable-next-line import/no-extraneous-dependencies
  testingLib = await import('@jest/globals').catch(() => (/** @type any */({})));
}
const { describe, it, expect } = testingLib;

/**
 * Source palette under test.
 * The original diff provided a JSON-like object; we embed it here to validate
 * semantics and invariants. If your repo stores this in a JSON file elsewhere,
 * you can replace the inline object with:
 *   import palette from '../path/to/palette.json' assert { type: 'json' };
 * Or:
 *   import fs from 'node:fs/promises';
 *   const palette = JSON.parse(await fs.readFile('path/to/palette.json', 'utf8'));
 */
const palette = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f"],
};

const HEX6 = /^#([0-9a-fA-F]{6})$/;

/** Utility: convert hex #rrggbb to linearized relative luminance per WCAG */
function hexToRGB(hex) {
  const [, h] = HEX6.exec(hex) || [];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}
function srgbToLinear(c) {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}
function relLuminance({ r, g, b }) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function contrastRatio(hexA, hexB) {
  const L1 = relLuminance(hexToRGB(hexA));
  const L2 = relLuminance(hexToRGB(hexB));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('palette schema', () => {
  it('has required top-level keys', () => {
    expect(palette).toBeDefined();
    expect(palette).toHaveProperty('bg');
    expect(palette).toHaveProperty('ink');
    expect(palette).toHaveProperty('layers');
  });

  it('uses correct types', () => {
    expect(typeof palette.bg).toBe('string');
    expect(typeof palette.ink).toBe('string');
    expect(Array.isArray(palette.layers)).toBe(true);
  });

  it('bg, ink, and each layer are 6-digit hex colors', () => {
    expect(palette.bg).toMatch(HEX6);
    expect(palette.ink).toMatch(HEX6);
    for (const c of palette.layers) {
      expect(typeof c).toBe('string');
      expect(c).toMatch(HEX6);
    }
  });

  it('layers is non-empty and reasonably small (1..12)', () => {
    expect(palette.layers.length).toBeGreaterThanOrEqual(1);
    expect(palette.layers.length).toBeLessThanOrEqual(12);
  });

  it('no duplicate colors across bg, ink, and layers', () => {
    const all = [palette.bg, palette.ink, ...palette.layers].map(s => s.toLowerCase());
    const set = new Set(all);
    expect(set.size).toBe(all.length);
  });
});

describe('palette semantics', () => {
  it('ink has sufficient contrast against bg (>= 4.5:1 for normal text)', () => {
    const ratio = contrastRatio(palette.ink, palette.bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('each layer is visually distinct from bg and ink (>= 2.0:1 against each)', () => {
    for (const c of palette.layers) {
      const rBg = contrastRatio(c, palette.bg);
      const rInk = contrastRatio(c, palette.ink);
      expect(rBg).toBeGreaterThanOrEqual(2.0);
      expect(rInk).toBeGreaterThanOrEqual(2.0);
    }
  });

  it('layers are ordered light-to-warm-ish progression (heuristic: monotonically non-decreasing luminance)', () => {
    const luminances = palette.layers.map(hex => relLuminance(hexToRGB(hex)));
    for (let i = 1; i < luminances.length; i++) {
      expect(luminances[i]).toBeGreaterThanOrEqual(luminances[i - 1] - 1e-9);
    }
  });
});

describe('palette robustness', () => {
  it('rejects invalid hex strings (negative test)', () => {
    const bad = ['#GGGGGG', '#123', '123456', '#abcd', '#1234567', '#12 456'];
    for (const s of bad) {
      expect(HEX6.test(s)).toBe(false);
    }
  });

  it('helpers compute sensible contrast ratios (sanity checks)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeGreaterThan(19); // ~21
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1);
    expect(contrastRatio('#0b0b12', '#e8e8f0')).toBeGreaterThan(4.5);
  });

  it('palette is serializable and stable (deep freeze semantics)', () => {
    const json = JSON.stringify(palette);
    const clone = JSON.parse(json);
    expect(clone).toEqual(palette);
  });
});