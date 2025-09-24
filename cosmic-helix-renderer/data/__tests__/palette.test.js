/**
 * Tests for cosmic-helix-renderer/data/palette.json
 *
 * Test framework: Jest/Vitest-style (describe/it/expect API).
 * - We read the JSON via fs to avoid import tooling differences (ESM/CJS/TS).
 * - Focus: Validate schema, types, value formats, and some invariants.
 */

const fs = require('fs');
const path = require('path');

function loadPalette() {
  const filePath = path.resolve(__dirname, '../palette.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function isHex6Color(str) {
  return typeof str === 'string' && /^#[0-9a-fA-F]{6}$/.test(str);
}

describe('palette.json schema and integrity', () => {
  let palette;

  beforeAll(() => {
    palette = loadPalette();
  });

  it('should be a plain object with expected top-level keys', () => {
    expect(palette).toBeTruthy();
    expect(typeof palette).toBe('object');
    expect(palette).toHaveProperty('bg');
    expect(palette).toHaveProperty('ink');
    expect(palette).toHaveProperty('muted');
    expect(palette).toHaveProperty('layers');
  });

  it('should have bg, ink, muted as 6-digit hex colors', () => {
    expect(isHex6Color(palette.bg)).toBe(true);
    expect(isHex6Color(palette.ink)).toBe(true);
    expect(isHex6Color(palette.muted)).toBe(true);
  });

  it('should have layers as a non-empty array of 6-digit hex colors', () => {
    expect(Array.isArray(palette.layers)).toBe(true);
    expect(palette.layers.length).toBeGreaterThan(0);
    for (const c of palette.layers) {
      expect(isHex6Color(c)).toBe(true);
    }
  });

  it('should not include duplicate colors in layers', () => {
    const seen = new Set();
    for (const c of palette.layers) {
      expect(seen.has(c)).toBe(false);
      seen.add(c);
    }
  });

  it('bg and ink should not be identical (contrast invariant)', () => {
    expect(palette.bg.toLowerCase()).not.toBe(palette.ink.toLowerCase());
  });

  it('muted should be distinct from bg and ink', () => {
    const muted = palette.muted.toLowerCase();
    expect(muted).not.toBe(palette.bg.toLowerCase());
    expect(muted).not.toBe(palette.ink.toLowerCase());
  });

  it('should match a stable schema snapshot for regression safety (keys only)', () => {
    // Snapshot top-level keys to detect accidental structural changes
    const keys = Object.keys(palette).sort();
    expect(keys).toEqual(['bg', 'ink', 'layers', 'muted']);
  });

  it('layers should contain a reasonable number of entries (at least 3, at most 32)', () => {
    const n = palette.layers.length;
    expect(n).toBeGreaterThanOrEqual(3);
    expect(n).toBeLessThanOrEqual(32);
  });

  it('should not contain shorthand (#rgb) or alpha (#rrggbbaa) formats', () => {
    const all = [palette.bg, palette.ink, palette.muted, ...palette.layers];
    for (const c of all) {
      expect(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{8})$/.test(c)).toBe(false);
    }
  });

  it('colors should be normalizable to lowercase hex', () => {
    const all = [palette.bg, palette.ink, palette.muted, ...palette.layers];
    for (const c of all) {
      expect(c).toBe(c.toString()); // sanity: string-like
      const lc = c.toLowerCase();
      expect(lc).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('palette.json content-centric checks (diff-focused)', () => {
  let palette;
  beforeAll(() => {
    palette = loadPalette();
  });

  it('should include a balanced spread across the hue spectrum in layers (basic heuristic)', () => {
    // Heuristic: ensure not all layers are clustered — require at least 3 distinct hue buckets.
    // Convert hex to RGB then to hue, bucket into 6 segments.
    const buckets = new Set();
    for (const hex of palette.layers) {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const d = max - min;
      let h = 0;
      if (d === 0) h = 0;
      else if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = Math.round((h * 60 + 360) % 360);
      const bucket = Math.floor(h / 60); // 0..5
      buckets.add(bucket);
    }
    expect(buckets.size).toBeGreaterThanOrEqual(3);
  });

  it('bg should be perceived darker than ink (luminance check)', () => {
    const toLuminance = (hex) => {
      const c = [hex.slice(1,3), hex.slice(3,5), hex.slice(5,7)]
        .map(h => parseInt(h, 16) / 255)
        .map(v => v <= 0.03928 ? v / 12.92 : Math.pow(((v + 0.055) / 1.055), 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const Lbg = toLuminance(palette.bg);
    const Link = toLuminance(palette.ink);
    expect(Lbg).toBeLessThan(Link);
  });

  it('contrast ratio between bg and ink should be at least ~3:1 (basic accessibility heuristic)', () => {
    const toLuminance = (hex) => {
      const c = [hex.slice(1,3), hex.slice(3,5), hex.slice(5,7)]
        .map(h => parseInt(h, 16) / 255)
        .map(v => v <= 0.03928 ? v / 12.92 : Math.pow(((v + 0.055) / 1.055), 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const L1 = toLuminance(palette.bg);
    const L2 = toLuminance(palette.ink);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    const contrast = (lighter + 0.05) / (darker + 0.05);
    expect(contrast).toBeGreaterThanOrEqual(3.0);
  });
});

describe('robustness checks against malformed palette.json (negative cases)', () => {
  const palettePath = path.resolve(__dirname, '../palette.json');

  it('should fail JSON.parse on malformed JSON', () => {
    const raw = fs.readFileSync(palettePath, 'utf8');
    const malformed = raw.replace(/"bg":\s*".*?"/, '"bg": ');
    expect(() => JSON.parse(malformed)).toThrow();
  });

  it('should detect non-hex color values (schema guard)', () => {
    const palette = loadPalette();
    const bad = { ...palette, bg: 'blue' };
    const valid = /^#[0-9a-fA-F]{6}$/;
    expect(valid.test(bad.bg)).toBe(false);
  });

  it('should detect when layers is not an array', () => {
    const palette = loadPalette();
    const bad = { ...palette, layers: 'not-an-array' };
    expect(Array.isArray(bad.layers)).toBe(false);
  });
});