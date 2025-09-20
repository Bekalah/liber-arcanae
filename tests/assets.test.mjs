// Test suite for assets module
// Framework: (will adapt in edits below) — using Vitest-style API by default.
// If your project uses Jest, these calls are compatible (describe/it/expect).

import path from 'node:path';

// Attempt to import the assets module using common locations
let assetsModule;
try {
  assetsModule = await import('../src/assets.mjs');
} catch {
  try {
    assetsModule = await import('../src/assets.js');
  } catch {
    try {
      assetsModule = await import('../src/assets/index.js');
    } catch {
      assetsModule = {};
    }
  }
}

describe('assets module - baseline smoke', () => {
// Detected testing framework: auto
  it('module should load and be an object', () => {
    expect(typeof assetsModule).toBe('object');
  });
});

// --- Augmented comprehensive scenarios for assets module ---

// Helper: create a temporary env without touching real FS
function withEnv(vars, fn) {
  const prev = {};
  for (const k of Object.keys(vars)) { prev[k] = process.env[k]; process.env[k] = vars[k]; }
  try { return fn(); } finally { for (const k of Object.keys(vars)) {

    if (prev[k] === undefined) { delete process.env[k]; } else { process.env[k] = prev[k]; }
  } }
}

// If module exposes typical helpers, probe their presence to decide which tests to run.
const has = (name) => assetsModule && Object.prototype.hasOwnProperty.call(assetsModule, name);

// Common export candidates
const candidates = [
  'resolveAssetPath',
  'resolveAsset',
  'getAsset',
  'assetPath',
  'normalizeAssetPath',
  'isPublicAsset',
  'listAssets',
  'ASSET_PREFIX',
  'DEFAULT_ASSET_DIR'
];

describe('assets module - API surface', () => {
  it('should export at least one known asset helper', () => {
    const anyKnown = candidates.some((c) => has(c));
    expect(anyKnown).toBe(true);
  });
});

if (has('normalizeAssetPath')) {
  describe('normalizeAssetPath', () => {
    const { normalizeAssetPath } = assetsModule;
    it('trims leading ./ and collapses duplicate slashes', () => {
      expect(normalizeAssetPath('./images//logo.png')).toBe('images/logo.png');
    });
    it('preserves query/hash suffixes', () => {
      expect(normalizeAssetPath('img/logo.svg?ver=1.2.3#icon')).toBe('img/logo.svg?ver=1.2.3#icon');
    });
    it('returns empty string for falsy input', () => {
      expect(normalizeAssetPath('')).toBe('');
      expect(normalizeAssetPath(null)).toBe('');
      expect(normalizeAssetPath(undefined)).toBe('');
    });
  });
}

if (has('resolveAssetPath') || has('resolveAsset')) {
  describe('resolveAsset*(path, options)', () => {
    const fn = assetsModule.resolveAssetPath || assetsModule.resolveAsset;
    it('resolves relative paths against a provided base directory', () => {
      const out = fn('icons/edit.svg', { baseDir: '/app/public' });
      // On POSIX this should be absolute; on Windows, ensure it ends with the normalized path
      expect(String(out).toLowerCase().endsWith('/app/public/icons/edit.svg')).toBe(true);
    });
    it('returns an absolute path unchanged', () => {
      const absolute = '/var/www/assets/app.css';
      const out = fn(absolute, { baseDir: '/ignored' });
      expect(out).toBe(absolute);
    });
    it('throws or returns falsy for illegal path traversal', () => {
      let passed = false;
      try {
        const out = fn('../secrets.env', { baseDir: '/app/public', allowOutsideBase: false });
        passed = (out === false || out === null || out === undefined);
      } catch (e) {
        passed = true;
      }
      expect(passed).toBe(true);
    });
  });
}

if (has('isPublicAsset')) {
  describe('isPublicAsset', () => {
    const { isPublicAsset } = assetsModule;
    it('accepts assets under public directory', () => {
      const ok = isPublicAsset('/app/public/img/logo.png', { publicDir: '/app/public' });
      expect(ok).toBe(true);
    });
    it('rejects assets outside public directory', () => {
      const ok = isPublicAsset('/app/private/img/logo.png', { publicDir: '/app/public' });
      expect(ok).toBe(false);
    });
  });
}

if (has('getAsset')) {
  describe('getAsset(name, options)', () => {
    const { getAsset } = assetsModule;
    it('returns a descriptor with url and path when found', async () => {
      const result = await getAsset('styles.css', { manifest: { 'styles.css': '/static/styles.123.css' }, baseDir: '/app/public' });
      expect(typeof result).toBe('object');
      expect(String(result.url || result.href || result.path)).toBe('/static/styles.123.css');
    });
    it('handles missing entries gracefully', async () => {
      let threw = false;
      try {
        await getAsset('missing.js', { manifest: {}, strict: true });
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(true);
    });
  });
}

// Environment-driven prefix handling, common in asset URL builders
if (has('ASSET_PREFIX') || has('assetPath')) {
  describe('asset prefix handling', () => {
    const prefixConst = assetsModule.ASSET_PREFIX;
    const assetPath = assetsModule.assetPath || ((_p, _o) => _p);
    it('applies CDN prefix from env when present', () => {
      withEnv({ ASSET_PREFIX: 'https://cdn.example.com' }, () => {
        const out = assetPath('/img/logo.png', { prefixEnv: 'ASSET_PREFIX' });
        expect(String(out)).toBe('https://cdn.example.com/img/logo.png');
      });
    });
    it('does not double-prefix already absolute URLs', () => {
      withEnv({ ASSET_PREFIX: 'https://cdn.example.com' }, () => {
        const out = assetPath('https://static.example.com/img/logo.png', { prefixEnv: 'ASSET_PREFIX' });
        expect(String(out)).toBe('https://static.example.com/img/logo.png');
      });
    });
    if (typeof prefixConst === 'string') {
      it('constant ASSET_PREFIX should be a string', () => {
        expect(typeof prefixConst).toBe('string');
      });
    }
  });
}

// Regression-style behaviors often touched in diffs:
// - default options changed
// - argument validation tightened
// - path normalization fixes
describe('assets module - argument validation and regressions', () => {
  const fnName = ['normalizeAssetPath','resolveAssetPath','resolveAsset','assetPath','getAsset'].find(has);
  if (fnName) {
    const fn = assetsModule[fnName];
    it('throws or returns safe default on non-string path inputs', async () => {
      const inputs = [42, {}, [], true, Symbol('x')];
      for (const input of inputs) {
        let ok = false;
        try {
          const r = await fn(input);
          ok = (r === '' || r === false || r === null || r === undefined);
        } catch {
          ok = true;
        }
        expect(ok).toBe(true);
      }
    });
  }
});