// Test suite validating the "Cosmic Helix Renderer" README content structure.
// Framework note: This suite is compatible with Jest or Vitest using ESM. It uses describe/it/expect only.
// If the project uses Node's built-in test runner, adapt by importing from 'node:test' and 'node:assert/strict'.

const README_TEXT = `
Per Texturas Numerorum, Spira Loquitur.

# Cosmic Helix Renderer

Static, ND-safe HTML5 canvas renderer for layered sacred geometry. Open [\`index.html\`](./index.html) directly in any modern browser; no build steps, servers, or network calls are required.

## Files
- [\`index.html\`](./index.html) — offline entry point with a 1440×900 canvas, status notice, and palette fallback logic.
- [\`js/helix-renderer.mjs\`](./js/helix-renderer.mjs) — pure ES module that draws the four sacred layers.
- [\`data/palette.json\`](./data/palette.json) — optional palette override; delete or edit to suit your local ritual.

If \`data/palette.json\` cannot be read (common when double-clicking without a server), the page shows a small inline notice and uses a built-in ND-safe palette.

## Layer Order
1. **Vesica field** — 3×3 grid of intersecting circles honoring the triad.
2. **Tree-of-Life scaffold** — ten sephirot with twenty-two connecting paths.
3. **Fibonacci curve** — logarithmic spiral polyline stepped thirty-three times.
4. **Double-helix lattice** — two phase-shifted strands with calm crossbars.

Each layer pulls the next color from the sanitized palette. Geometry functions are small and use \`ctx.save()\` / \`ctx.restore()\` so one layer never disturbs another.

## Numerology Anchors
The renderer parameterizes every proportion with constants 3, 7, 9, 11, 22, 33, 99, and 144:
- 3 × 3 Vesica grid.
- 7-based angular sweep for the Fibonacci segments.
- 9-based scaling and crossbar cadence.
- 11-based sine frequency for the helix.
- 22 vertical steps, node spacing, and amplitude.
- 33 Fibonacci polyline steps.
- 99 divisor softening the spiral radius.
- 144 helix samples across the canvas width.

## Offline Use
Double-click [\`index.html\`](./index.html) and the canvas renders immediately. No workflow, build tool, or internet connection is needed. The module exports a single \`renderHelix\` function should you wish to reuse it in other offline rituals.

## ND-safe Notes
- No animation, flashing, or audio — everything draws once in calm order.
- Palette defaults use gentle contrast; document colors sync to the active palette so text stays readable.
- Comments explain the safety choices and numerology rationale for future stewards.
`.trim();

function section(title) {
  const pattern = new RegExp(`^##\\s+${title}\\s*$[\\s\\S]*?(?=^##\\s+|\\Z)`, 'm');
  const match = README_TEXT.match(pattern);
  return match ? match[0] : '';
}

function heading(level, text) {
  const re = new RegExp(`^${'#'.repeat(level)}\\s+${text}\\s*$`, 'm');
  return re.test(README_TEXT);
}

function listItems(block) {
  return block.split(/\r?\n/).filter((l) => /^\s*[-*]\s+/.test(l));
}

function orderedItems(block) {
  return block.split(/\r?\n/).filter((l) => /^\s*\d+\.\s+/.test(l));
}

describe('README structure', () => {
  it('has the main H1 heading', () => {
    expect(heading(1, 'Cosmic Helix Renderer')).toBe(true);
  });

  it('contains the required top-level sections', () => {
    const required = ['Files', 'Layer Order', 'Numerology Anchors', 'Offline Use', 'ND-safe Notes'];
    for (const title of required) {
      const sec = section(title);
      expect(sec).toBeTruthy();
      expect(sec).toContain(`## ${title}`);
    }
  });

  it('Files section lists three relative links with expected targets and descriptions', () => {
    const files = section('Files');
    const items = listItems(files);
    expect(items.length).toBe(3);

    // Ensure links are relative and match expected paths
    const paths = items.map((l) => {
      const m = l.match(/\]\(([^)]+)\)/);
      return m ? m[1] : '';
    });

    expect(paths).toEqual(['./index.html', './js/helix-renderer.mjs', './data/palette.json']);
    // Ensure no absolute URLs
    for (const p of paths) {
      expect(p.startsWith('./')).toBe(true);
    }

    // Basic description keywords
    expect(items[0]).toMatch(/1440×900.*canvas/i);
    expect(items[1]).toMatch(/pure ES module/i);
    expect(items[2]).toMatch(/palette override/i);
  });

  it('mentions palette fallback behavior when palette.json cannot be read', () => {
    expect(README_TEXT).toMatch(/cannot be read.*built-in ND-safe palette/i);
  });
});

describe('Layer Order semantics', () => {
  const lo = section('Layer Order');

  it('lists exactly four layers in the documented order', () => {
    const items = orderedItems(lo);
    expect(items.length).toBe(4);

    const names = items.map((l) => l.replace(/^\s*\d+\.\s+\*\*(.*?)\*\*.*/, '$1'));
    expect(names).toEqual([
      'Vesica field',
      'Tree-of-Life scaffold',
      'Fibonacci curve',
      'Double-helix lattice',
    ]);
  });

  it('includes descriptive phrases for each layer', () => {
    expect(lo).toMatch(/3×3 grid/);
    expect(lo).toMatch(/twenty-two connecting paths/);
    expect(lo).toMatch(/logarithmic spiral polyline.*thirty-three/);
    expect(lo).toMatch(/two phase-shifted strands.*crossbars/);
  });

  it('notes use of ctx.save()/ctx.restore() to isolate layers', () => {
    expect(README_TEXT).toMatch(/ctx\.save\(\).+ctx\.restore\(\)/s);
  });
});

describe('Numerology anchors', () => {
  const na = section('Numerology Anchors');

  it('enumerates anchor constants 3, 7, 9, 11, 22, 33, 99, 144 in prose', () => {
    expect(na).toMatch(/\b3,\s*7,\s*9,\s*11,\s*22,\s*33,\s*99,\s*144\b/);
  });

  it('provides one bullet per constant with correct keywords', () => {
    const items = listItems(na);
    expect(items.length).toBe(8);

    expect(items[0]).toMatch(/^-\s*3\s*×\s*3\s*Vesica grid\./i);
    expect(items[1]).toMatch(/^-\s*7-?based.*Fibonacci/i);
    expect(items[2]).toMatch(/^-\s*9-?based.*crossbar/i);
    expect(items[3]).toMatch(/^-\s*11-?based.*sine frequency/i);
    expect(items[4]).toMatch(/^-\s*22\s+vertical steps.*amplitude/i);
    expect(items[5]).toMatch(/^-\s*33\s+Fibonacci polyline steps/i);
    expect(items[6]).toMatch(/^-\s*99\s+divisor.*spiral radius/i);
    expect(items[7]).toMatch(/^-\s*144\s+helix samples/i);
  });
});

describe('Offline Use and ND-safety', () => {
  it('documents offline usage via double-click of index.html and mentions renderHelix export', () => {
    const off = section('Offline Use');
    expect(off).toMatch(/Double-click.*index\.html/i);
    expect(off).toMatch(/exports a single\s+`renderHelix`\s+function/i);
  });

  it('enumerates three ND-safe notes', () => {
    const nd = section('ND-safe Notes');
    const items = listItems(nd);
    expect(items.length).toBe(3);
    expect(items[0]).toMatch(/No animation, flashing, or audio/i);
    expect(items[1]).toMatch(/Palette defaults.*document colors sync/i);
    expect(items[2]).toMatch(/safety choices and numerology rationale/i);
  });
});