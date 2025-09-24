This folder contains Jest (jsdom) tests for cosmic-helix-renderer/index.html.

- Testing library and framework: Jest with jsdom.
- The tests extract the inline ES module script, remove the import of renderHelix, inject a stub, and execute the code within an async IIFE to handle top-level await.
- Both the palette fallback path and the palette-loaded path are validated, along with canvas context absence behavior and accessibility attributes.