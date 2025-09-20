This test suite (helix-renderer.test.mjs) defaults to Node's built-in test runner (node:test) with ESM.
If your project uses Jest/Vitest/Mocha, adjust the imports at the top of the test file to match the existing framework.

- Verified behaviors:
  - Full-canvas clear/fill and palette usage
  - Layer stroke styles applied
  - Stable call counts for arcs/lines across layers given provided NUM constants
  - ND-safe stroke widths and caps
  - Graceful handling of zero-size canvas and incomplete palettes

To run with Node's test runner:
  node --test

If your package.json already defines a test script, use that instead.