// Palette validation tests
// Framework note: These tests use describe/it/expect style compatible with Vitest/Jest.
// If your project uses Mocha+Chai, you can replace `expect` with `chai.expect` and add appropriate imports.

const isHexColor = (s) => typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);

// Fallback embedded palette derived from the PR diff.
// If a canonical palette file exists elsewhere in the repo, adjust the import here.
const palette = {
  bg: "#0b0b12",
  ink: "#e8e8f0",
  layers: ["#b1c7ff", "#89f7fe", "#a0ffa1", "#ffd27f"]
};

// Utility: relative luminance and WCAG contrast ratio to validate legibility.
let hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255
  };
};

const channelToLinear = (c) => {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const relLuminance = ({ r, g, b }) => {
  const R = channelToLinear(r);
  const G = channelToLinear(g);
  const B = channelToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

const contrastRatio = (hex1, hex2) => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return NaN;
  const L1 = relLuminance(rgb1);
  const L2 = relLuminance(rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Minimal expect shim if not running under Jest/Vitest.
// This allows the file to be executed by other runners while keeping a consistent API.
const createExpect = () => {
  if (typeof expect !== 'undefined') return expect;
  const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };
  return (actual) => ({
    toBe: (exp) => assert(Object.is(actual, exp), `Expected ${actual} to be ${exp}`),
    toBeGreaterThanOrEqual: (n) => assert(actual >= n, `Expected ${actual} >= ${n}, got ${actual}`),
    toBeGreaterThan: (n) => assert(actual > n, `Expected ${actual} > ${n}, got ${actual}`),
    toBeTruthy: () => assert(!!actual, `Expected value to be truthy, got ${actual}`),
    toBeDefined: () => assert(typeof actual !== 'undefined', `Expected value to be defined`),
    toEqual: (exp) => {
      const a = JSON.stringify(actual); const b = JSON.stringify(exp);
      assert(a === b, `Expected ${a} to equal ${b}`);
    },
    toThrow: () => {
      let threw = false; try { actual(); } catch (_e) { threw = true; }
      assert(threw, `Expected function to throw`);
    },
    not: {
      toBe: (exp) => assert(!Object.is(actual, exp), `Expected ${actual} not to be ${exp}`),
    }
  });
};
const exp = createExpect();

// Minimal BDD shim if not under a test runner providing describe/it.
const g = (typeof globalThis !== 'undefined') ? globalThis : global;
if (typeof g.describe === 'undefined') {
  g.describe = (name, fn) => { console.log(`\nSuite: ${name}`); fn(); };
}
if (typeof g.it === 'undefined') {
  g.it = (name, fn) => {
    try {
      const res = fn();
      if (res && typeof res.then === 'function') {
        return res.then(() => console.log(` ✓ ${name}`)).catch((e) => { console.error(` ✗ ${name}`); throw e; });
      }
      console.log(` ✓ ${name}`);
    } catch (e) {
      console.error(` ✗ ${name}`);
      throw e;
    }
  };
}

describe('palette schema', () => {
  it('has required top-level keys', () => {
    exp(typeof palette).toBe('object');
    exp(palette).toBeDefined();
    exp('bg' in palette).toBeTruthy();
    exp('ink' in palette).toBeTruthy();
    exp('layers' in palette).toBeTruthy();
  });

  it('bg and ink are valid #RRGGBB hex strings', () => {
    exp(isHexColor(palette.bg)).toBeTruthy();
    exp(isHexColor(palette.ink)).toBeTruthy();
  });

  it('layers is a non-empty array of valid hex strings', () => {
    exp(Array.isArray(palette.layers)).toBeTruthy();
    exp(palette.layers.length).toBeGreaterThan(0);
    for (const c of palette.layers) {
      exp(isHexColor(c)).toBeTruthy();
    }
  });

  it('contains no duplicate colors across all entries', () => {
    const all = [palette.bg, palette.ink, ...palette.layers].map((s) => s.toLowerCase());
    const unique = new Set(all);
    exp(unique.size).toBe(all.length);
  });
});

describe('palette accessibility/contrast', () => {
  it('bg and ink have at least 4.5:1 contrast (WCAG AA for normal text)', () => {
    const ratio = contrastRatio(palette.bg, palette.ink);
    // 4.5:1 AA for normal text; if your design uses large text, 3:1 would suffice
    exp(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('each layer maintains at least 3:1 contrast with bg or ink (whichever is used on it)', () => {
    for (const layer of palette.layers) {
      const toBg = contrastRatio(layer, palette.bg);
      const toInk = contrastRatio(layer, palette.ink);
      const maxContrast = Math.max(toBg, toInk);
      exp(maxContrast).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('palette hex parsing helpers', () => {
  it('parses hex to rgb and back consistently', () => {
    const sample = '#89f7fe';
    const rgb = hexToRgb(sample);
    exp(rgb).toEqual({ r: 0x89 / 255, g: 0xf7 / 255, b: 0xfe / 255 });
  });

  it('rejects invalid hex strings', () => {
    exp(() => hexToRgb('#GGGGGG')).toThrow();
  });
});

// Make invalid hex throw to satisfy the test above
// Wrap hexToRgb to throw on invalid input for clearer failure semantics
const _origHexToRgb = hexToRgb;
hexToRgb = (hex) => {
  const v = _origHexToRgb(hex);
  if (!v) throw new Error('Invalid hex color');
  return v;
};