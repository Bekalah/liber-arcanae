/**
 * Interface tests for helix-renderer.mjs (renderHelix).
 *
 * Testing library/framework: Jest-style APIs (describe/test/expect, jest.fn()).
 * If the project uses Vitest, these tests should also run under Vitest since APIs are compatible.
 *
 * Focus:
 *  - Behavior with missing ctx
 *  - Dimension precedence (options vs ctx.canvas)
 *  - Global state reset (setTransform, lineCap/lineJoin)
 *  - Background fill uses palette.bg
 *  - Palette normalization when layers array is shorter than required (uses defaults for missing)
 *  - Sane drawing activity (strokes/fills/beginPath calls above minimal thresholds)
 *  - Balanced save/restore pairing
 */

const path = require('path');

// Try to import ESM module regardless of runner by using dynamic import when available.
// We resolve candidate paths by searching common locations.
async function loadRenderer() {
  // Candidate module paths to try relative to repo root
  const candidates = [
    'helix-renderer.mjs',
    'src/helix-renderer.mjs',
    'lib/helix-renderer.mjs',
    'renderer/helix-renderer.mjs',
    'packages/renderer/helix-renderer.mjs',
  ];

  const fs = require('fs');
  for (const p of candidates) {
    const full = path.resolve(process.cwd(), p);
    if (fs.existsSync(full)) {
      // ESM dynamic import via file URL; Node handles .mjs properly under both Jest and Vitest nowadays.
      const url = require('url').pathToFileURL(full).href;
      const mod = await import(url);
      if (mod && typeof mod.renderHelix === 'function') {
        return mod;
      }
    }
  }
  throw new Error('renderHelix module not found. Expected one of: ' + candidates.join(', '));
}

// Minimal hex color validator
const isHexColor = (v) => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

// Create a robust mock 2D canvas context capturing property assignments and method calls.
function createMockCtx(canvasWidth = 300, canvasHeight = 150) {
  const calls = {
    save: 0,
    restore: 0,
    setTransform: [],
    clearRect: [],
    fillRect: [],
    beginPath: 0,
    moveTo: [],
    lineTo: [],
    arc: [],
    stroke: 0,
    fill: 0,
    // property assignment history
    _strokeStyle: [],
    _fillStyle: [],
    _lineWidth: [],
    _globalAlpha: [],
    _lineCap: [],
    _lineJoin: [],
  };

  const recordProp = (listName) => ({
    get() { return calls[listName].length ? calls[listName][calls[listName].length - 1] : undefined; },
    set(v) { calls[listName].push(v); },
    enumerable: true,
    configurable: true,
  });

  const ctx = {
    canvas: { width: canvasWidth, height: canvasHeight },
    // methods
    save: () => { calls.save += 1; },
    restore: () => { calls.restore += 1; },
    setTransform: (a, b, c, d, e, f) => { calls.setTransform.push([a,b,c,d,e,f]); },
    clearRect: (x, y, w, h) => { calls.clearRect.push([x,y,w,h]); },
    fillRect: (x, y, w, h) => { calls.fillRect.push([x,y,w,h]); },
    beginPath: () => { calls.beginPath += 1; },
    moveTo: (x, y) => { calls.moveTo.push([x,y]); },
    lineTo: (x, y) => { calls.lineTo.push([x,y]); },
    arc: (x, y, r, s, e) => { calls.arc.push([x,y,r,s,e]); },
    stroke: () => { calls.stroke += 1; },
    fill: () => { calls.fill += 1; },
    // property placeholders populated by defineProperty below
  };

  Object.defineProperty(ctx, 'strokeStyle', recordProp('_strokeStyle'));
  Object.defineProperty(ctx, 'fillStyle', recordProp('_fillStyle'));
  Object.defineProperty(ctx, 'lineWidth', recordProp('_lineWidth'));
  Object.defineProperty(ctx, 'globalAlpha', recordProp('_globalAlpha'));
  Object.defineProperty(ctx, 'lineCap', recordProp('_lineCap'));
  Object.defineProperty(ctx, 'lineJoin', recordProp('_lineJoin'));

  return { ctx, calls };
}

describe('renderHelix interface', () => {
  let renderHelix;

  beforeAll(async () => {
    const mod = await loadRenderer();
    renderHelix = mod.renderHelix;
  });

  test('returns silently when ctx is falsy', () => {
    expect(() => renderHelix(undefined, {})).not.toThrow();
    expect(renderHelix(null, {})).toBeUndefined();
  });

  test('uses options width/height over ctx.canvas and clears the rect', () => {
    const { ctx, calls } = createMockCtx(640, 480);
    // Deliberately different
    const opts = { width: 320, height: 200 };
    renderHelix(ctx, opts);

    // First transform reset should be identity
    expect(calls.setTransform.length).toBeGreaterThanOrEqual(1);
    expect(calls.setTransform[0]).toEqual([1,0,0,1,0,0]);

    // clearRect uses the options dimensions
    expect(calls.clearRect.length).toBeGreaterThanOrEqual(1);
    const [x, y, w, h] = calls.clearRect[0];
    expect([x,y]).toEqual([0,0]);
    expect([w,h]).toEqual([opts.width, opts.height]);

    // Line caps and joins are set to "round"
    expect(calls._lineCap.includes('round')).toBe(true);
    expect(calls._lineJoin.includes('round')).toBe(true);
  });

  test('falls back to ctx.canvas width/height when options do not provide them', () => {
    const { ctx, calls } = createMockCtx(500, 400);
    renderHelix(ctx, {}); // no width/height in options
    const [ , , w, h ] = calls.clearRect[0];
    expect([w,h]).toEqual([500, 400]);
  });

  test('fills background with provided palette.bg', () => {
    const { ctx, calls } = createMockCtx(200, 100);
    const palette = { bg: '#123456' };
    renderHelix(ctx, { palette, width: 200, height: 100 });

    // Verify a fillRect happened with the full canvas area
    const fillRectCall = calls.fillRect.find(([x,y,w,h]) => x===0 && y===0 && w===200 && h===100);
    expect(fillRectCall).toBeTruthy();

    // Verify the bg color was assigned at some point
    expect(calls._fillStyle.includes('#123456')).toBe(true);
  });

  test('palette normalization pads missing layer colors with defaults; no undefined styles are used', () => {
    const { ctx, calls } = createMockCtx(300, 200);
    const customLayers = ['#112233']; // only first layer overridden
    const bg = '#0a0a0a';
    renderHelix(ctx, { palette: { layers: customLayers, bg }, width: 300, height: 200 });

    // Assert the overridden first layer is used somewhere
    expect(
      calls._strokeStyle.includes('#112233') || calls._fillStyle.includes('#112233')
    ).toBe(true);

    // Assert defaults also show up for higher indices (e.g., index 5 default "#d0d0e6")
    const defaultTail = '#d0d0e6';
    expect(
      calls._strokeStyle.includes(defaultTail) || calls._fillStyle.includes(defaultTail)
    ).toBe(true);

    // Ensure no style assignment was undefined/null
    const allStyles = [...calls._strokeStyle, ...calls._fillStyle];
    expect(allStyles.every((v) => typeof v === 'string' && v.length > 0)).toBe(true);

    // Basic color sanity (most assigned values are hex colors)
    const hexish = allStyles.filter(isHexColor);
    expect(hexish.length).toBeGreaterThan(0);
  });

  test('draws a reasonable amount of geometry (beginPath, stroke, fill) and balances save/restore', () => {
    const { ctx, calls } = createMockCtx(360, 240);
    renderHelix(ctx, { width: 360, height: 240 });

    // At least 3 polylines (Fibonacci + two helix strands) => >= 3 strokes just from polylines.
    expect(calls.stroke).toBeGreaterThanOrEqual(3);

    // Tree-of-Life has 22 path strokes; total strokes should exceed that
    expect(calls.stroke).toBeGreaterThanOrEqual(22);

    // There should be multiple fills (nodes, markers, anchors)
    expect(calls.fill).toBeGreaterThanOrEqual(10);

    // There must be many beginPath calls due to arcs/segments
    expect(calls.beginPath).toBeGreaterThanOrEqual(20);

    // save/restore should be balanced (renderer + 5 nested saves)
    expect(calls.save).toBeGreaterThanOrEqual(6);
    expect(calls.restore).toBe(calls.save);
  });
});
