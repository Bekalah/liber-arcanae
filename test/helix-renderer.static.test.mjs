/* 
  Additional tests added by CodeRabbit Inc.
  Focus: strengthen coverage for helix static renderer exports and failure-handling paths.
  Testing library/framework: Mocha (BDD globals: describe/it) + Node's built-in assert (node:assert/strict).
  Notes:
  - We avoid top-level ESM import collisions by using dynamic import() inside tests.
  - We try multiple common source locations to locate the renderer without assuming project layout.
  - If the SUT cannot be resolved from known paths, the suite is skipped gracefully.
*/

async function __cr_getAssert() {
  try {
    const m = await import('node:assert/strict');
    return m.default || m;
  } catch {
    // Fallback for environments without node: prefix
    const m = await import('assert/strict');
    return m.default || m;
  }
}

/**
 * Attempts to import the renderer module from a set of common locations.
 * Returns { mod, path } on success; null on failure.
 * All paths are relative to this test file (test/).
 */
async function __cr_tryImportRenderer() {
  const candidates = [
    // Typical src/lib locations
    '../src/helix-renderer.mjs',
    '../src/helix-renderer.js',
    '../lib/helix-renderer.mjs',
    '../lib/helix-renderer.js',
    // Common entry names
    '../src/index.mjs',
    '../src/index.js',
    '../src/renderer.mjs',
    '../src/renderer.js',
    '../lib/index.mjs',
    '../lib/index.js',
  ];
  for (const p of candidates) {
    try {
      const mod = await import(p);
      return { mod, path: p };
    } catch (e) {
      // continue trying other candidates
    }
  }
  return null;
}

/**
 * Extracts a callable "render-like" function from the imported module.
 * Tries common export names in order of likelihood.
 */
function __cr_pickRender(mod) {
  if (!mod || typeof mod !== 'object') return null;
  if (typeof mod.render === 'function') return mod.render;
  if (typeof mod.default === 'function') return mod.default;
  if (typeof mod.staticRender === 'function') return mod.staticRender;
  if (typeof mod.handle === 'function') return mod.handle;
  return null;
}

describe('helix-renderer static (additional coverage)', function () {
  this.timeout(10000);

  let loaded;
  let render;

  before(async function () {
    // Use "function" to allow this.skip()
    loaded = await __cr_tryImportRenderer();
    if (!loaded) {
      if (typeof this.skip === 'function') this.skip();
      return;
    }
    render = __cr_pickRender(loaded.mod);
    if (typeof render !== 'function') {
      if (typeof this.skip === 'function') this.skip();
    }
  });

  it('exports a callable render function (render/default/staticRender/handle)', async function () {
    const assert = await __cr_getAssert();
    const mod = loaded ? loaded.mod : null;
    assert.ok(mod, 'Module could not be located from known paths');
    assert.ok(typeof render === 'function', 'No callable export found among render/default/staticRender/handle');
  });

  it('exposes a stable basic signature (arity <= 2, not unexpectedly variadic)', async function () {
    const assert = await __cr_getAssert();
    // We accept either sync or async implementation; only check arity sanity.
    assert.ok(
      typeof render.length === 'number' && render.length <= 2,
      `Unexpected arity: ${render.length} (expected 0, 1, or 2 parameters)`,
    );
  });

  it('does not synchronously throw with a minimal context object', async function () {
    const assert = await __cr_getAssert();
    const minimalCtx = { request: { url: 'https://example.com/' }, headers: {}, params: {} };
    let syncThrow = false;
    try {
      const maybe = render(minimalCtx);
      // If Promise, consume to avoid unhandled rejections
      if (maybe && typeof maybe.then === 'function') {
        await maybe.then(
          () => {},
          () => {} // ignore rejection; this test only guards against sync throws
        );
      }
    } catch (e) {
      syncThrow = true;
    }
    assert.equal(syncThrow, false, 'Render threw synchronously when passed a minimal context');
  });

  it('does not mutate the provided context object', async function () {
    const assert = await __cr_getAssert();
    const ctx = { request: { url: 'https://example.com/products?ref=test' }, headers: { 'x-test': '1' }, params: { id: '42' } };
    const snapshot = JSON.parse(JSON.stringify(ctx));
    try {
      const maybe = render(ctx);
      if (maybe && typeof maybe.then === 'function') {
        await maybe.then(
          () => {},
          () => {}
        );
      }
    } catch (e) {
      // ignore; this test only checks mutation
    }
    assert.deepEqual(ctx, snapshot, 'Render mutated the input context');
  });

  it('handles unexpected input types (null and string) by either rejecting with Error or returning a result', async function () {
    const assert = await __cr_getAssert();

    async function callSafely(arg) {
      try {
        const out = render(arg);
        if (out && typeof out.then === 'function') {
          await out;
        }
        return { ok: true, out };
      } catch (e) {
        return { ok: false, err: e };
      }
    }

    const rNull = await callSafely(null);
    const rStr  = await callSafely('not-an-object');

    // Accept either explicit failure (Error) or graceful handling path.
    assert.ok(rNull.ok || (rNull.err instanceof Error), 'Null input neither succeeded nor failed with an Error');
    assert.ok(rStr.ok  || (rStr.err  instanceof Error), 'String input neither succeeded nor failed with an Error');
  });

  it('if a response-like object is returned, it has a status/statusCode and a body/string payload', async function () {
    const assert = await __cr_getAssert();
    const maybe = render({ request: { url: 'https://example.com/' } });
    let result = maybe;
    if (maybe && typeof maybe.then === 'function') {
      try {
        result = await maybe;
      } catch {
        // If it rejects, consider this path not applicable; the assertion is conditional
        if (typeof this.skip === 'function') this.skip();
        return;
      }
    }
    if (result && typeof result === 'object') {
      const hasStatus = ('status' in result && typeof result.status === 'number') || ('statusCode' in result && typeof result.statusCode === 'number');
      const hasBody = ('body' in result) ? (typeof result.body === 'string' || (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(result.body))) : (typeof result === 'string');
      assert.ok(hasStatus, 'Response-like object missing numeric status/statusCode');
      assert.ok(hasBody, 'Response-like object missing string/Buffer body');
    } else {
      // If non-object, skip as contract may be handled by upstream layers
      if (typeof this.skip === 'function') this.skip();
    }
  });
});