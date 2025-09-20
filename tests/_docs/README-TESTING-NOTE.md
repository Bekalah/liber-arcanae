This repository appears to use an ESM-friendly test runner (e.g., Jest with "type": "module" or Vitest).
The tests added for the Cosmic Helix inline module rely on a jsdom-like environment to provide DOM APIs
and use native dynamic import of a data: URL to evaluate the HTML's inline <script type="module"> after
stubbing the renderHelix import. No new dependencies are introduced.

If your runner is Node's built-in test runner, ensure that a DOM shim is available before running these tests.