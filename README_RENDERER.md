# Cosmic Helix Renderer (Offline, ND-safe)

This renderer replaces the previous Netlify-oriented entry point with a lightweight, offline-first HTML + Canvas composition inspired by the provided cathedral imagery. Everything runs by double-clicking `index.html`; there is no build step, no CDN dependency, and no animation.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Single entry point that boots the renderer module, loads the palette, and communicates fallback status. |
| `js/helix-renderer.mjs` | Pure ES module that paints the four sacred-geometry layers in order. |
| `data/palette.json` | Optional palette override (can be deleted for safe fallback colors). |

## Geometry Layers

1. **Vesica field** – soft intersecting circles derived from numerology units (3, 7, 9, 11, 22, 33, 99, 144) to emulate a breathing lens.
2. **Tree-of-Life scaffold** – 10 sephirot plus 22 connective paths, rendered with gentle halos for depth.
3. **Fibonacci curve** – static golden spiral polyline providing directional flow without motion.
4. **Double-helix lattice** – dual sine strands with 14 cross ties, giving a stable cosmic lattice.

Every layer is static, high-contrast, and documented in the module so the rationale stays clear for future contributors.

## Running Offline

1. Clone or unzip the repository locally.
2. Double-click `index.html` (or open it via `file://` in any modern browser).
3. Optional: tweak `data/palette.json` to adjust colors, then refresh the page.

If the palette file is missing, the header status and an inline canvas notice explain that the safe fallback palette is in use.

## Preparing for Fly.io Hosting

To move this static bundle from Netlify to Fly.io while keeping the offline workflow intact:

1. Install [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) locally.
2. From the repository root, run `fly launch --no-deploy` and choose the static app template. This generates `fly.toml` without changing the existing files.
3. Update the generated `fly.toml` so the `[[statics]]` section points to the repository root (or a dedicated `public` directory if you later reorganize assets).
4. Run `fly deploy` to push the static files when you are ready. No automated workflows are added; deployments stay manual and opt-in.

These manual steps keep the project workflow zen-like: you can continue iterating offline and only push to Fly.io when the geometry feels complete.

## Customizing Further

- **Geometry**: Edit `js/helix-renderer.mjs` and adjust the helper functions for each layer. The functions are small and parameterized to encourage experimentation.
- **Palette**: Duplicate `data/palette.json` to create thematic presets. Update the fetch call in `index.html` if you want to switch files via query strings or manual toggles.
- **Accessibility**: Because motion is avoided, you can safely adjust line weights or alpha values for clarity without altering the ND-safe principles.

Maintain the layered depth, comment on every change, and keep the code dependency-free to preserve the calm baseline experience.
