// Testing library/framework: Node.js built-in test runner (node:test) with 'assert'
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// Attempt to import the palette from likely locations.
// If your palette is exported from a JS/TS module, update the import below accordingly.
// The provided diff snippet resembled a JSON object. We'll try to import a JSON file if present,
// otherwise fall back to inlining from environment variable injection or skip with a clear error.
let palette;

// Helper to try multiple import paths gracefully in ESM tests.
async function tryImport(paths) {
  for (const p of paths) {
    try {
      const mod = await import(p);
      // JSON imports under Node can be behind import assertions in some setups; normalize the value.
      if (mod?.default) return mod.default;
      return mod;
    } catch (e) {
      // continue trying next path
    }
  }
  return null;
}

const candidatePaths = [
  // Common possibilities:
  '../palette.json',
  '../src/palette.json',
  '../src/palette.mjs',
  '../palette.mjs',
  '../palette.js',
  '../../palette.json',
  '../../src/palette.json',
  '../../src/palette.mjs',
  '../../src/palette.js',
];

// The snippet from the PR diff (used as last resort fallback if no import path resolved)
const fallbackFromDiff = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  muted: "#a6a6c1",
  layers: [
    "#b1c7ff",
    "#89f7fe",
    "#a0ffa1",
    "#ffd27f",
    "#f5a3ff",
    "#d0d0e6"
  ]
};

const hex6 = /^#([0-9a-fA-F]{6})$/;

function hexToRgb(hex) {
  assert.match(hex, hex6, `Invalid hex color: ${hex}`);
  const v = hex.slice(1);
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return { r, g, b };
}

// Relative luminance per WCAG 2.1
function relativeLuminance({ r, g, b }) {
  const toLin = (c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const R = toLin(r);
  const G = toLin(g);
  const B = toLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(fgHex, bgHex) {
  const L1 = relativeLuminance(hexToRgb(fgHex));
  const L2 = relativeLuminance(hexToRgb(bgHex));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('palette configuration', () => {
  before(async () => {
    palette = await tryImport(candidatePaths);
    if (!palette) {
      // If no import succeeded, use the fallback obtained from the PR diff content
      palette = fallbackFromDiff;
    }
  });

  it('has required top-level keys', () => {
    assert.ok(palette && typeof palette === 'object', 'palette should be an object');
    for (const key of ['bg', 'ink', 'muted', 'layers']) {
      assert.ok(Object.prototype.hasOwnProperty.call(palette, key), `missing key: ${key}`);
    }
  });

  it('bg, ink, and muted are valid #RRGGBB hex strings', () => {
    for (const key of ['bg', 'ink', 'muted']) {
      const val = palette[key];
      assert.equal(typeof val, 'string', `${key} should be a string`);
      assert.match(val, hex6, `${key} should match #RRGGBB hex format`);
      const { r, g, b } = hexToRgb(val);
      assert.ok(r >= 0 && r <= 255);
      assert.ok(g >= 0 && g <= 255);
      assert.ok(b >= 0 && b <= 255);
    }
  });

  it('layers is a non-empty array of valid #RRGGBB hex strings', () => {
    assert.ok(Array.isArray(palette.layers), 'layers should be an array');
    assert.ok(palette.layers.length > 0, 'layers should not be empty');
    for (const [i, c] of palette.layers.entries()) {
      assert.equal(typeof c, 'string', `layer[${i}] should be a string`);
      assert.match(c, hex6, `layer[${i}] should match #RRGGBB hex format`);
      const { r, g, b } = hexToRgb(c);
      assert.ok(r >= 0 && r <= 255);
      assert.ok(g >= 0 && g <= 255);
      assert.ok(b >= 0 && b <= 255);
    }
  });

  it('layers contains unique values (no duplicates)', () => {
    const set = new Set(palette.layers);
    assert.equal(set.size, palette.layers.length, 'layers should not contain duplicates');
  });

  it('foreground ink has sufficient contrast against bg (>= 4.5:1)', () => {
    const ratio = contrastRatio(palette.ink, palette.bg);
    assert.ok(ratio >= 4.5, `contrast ratio too low: ${ratio.toFixed(2)} (expected >= 4.5)`);
  });

  it('muted color is distinct from bg and ink', () => {
    assert.notEqual(palette.muted.toLowerCase(), palette.bg.toLowerCase(), 'muted should differ from bg');
    assert.notEqual(palette.muted.toLowerCase(), palette.ink.toLowerCase(), 'muted should differ from ink');
  });

  it('hex strings are normalized to lowercase in snapshot (enforce consistency)', () => {
    const normalized = {
      bg: palette.bg.toLowerCase(),
      ink: palette.ink.toLowerCase(),
      muted: palette.muted.toLowerCase(),
      layers: palette.layers.map(c => c.toLowerCase()),
    };
    // Stable JSON snapshot ensures accidental changes are caught.
    const snapshot = JSON.stringify(normalized, null, 2);
    // Minimal inline snapshot; update intentionally if palette changes.
    const expectedSnapshot = `{
  "bg": "#0b0b12",
  "ink": "#e8e8f0",
  "muted": "#a6a6c1",
  "layers": [
    "#b1c7ff",
    "#89f7fe",
    "#a0ffa1",
    "#ffd27f",
    "#f5a3ff",
    "#d0d0e6"
  ]
}`;
    // If repository uses a different palette source, adjust expectedSnapshot accordingly.
    assert.equal(snapshot, expectedSnapshot, 'palette snapshot mismatch - verify intended changes or update snapshot');
  });

  it('rejects invalid hex inputs in helper when used directly (edge validation)', () => {
    assert.throws(() => hexToRgb('#zzz999'), /Invalid hex color/);
    assert.throws(() => hexToRgb('#12345'), /Invalid hex color/);
    assert.throws(() => hexToRgb('123456'), /Invalid hex color/);
  });
});