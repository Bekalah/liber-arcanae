/* NOTE: Testing library/framework: Jest (jsdom). Auto-detected by script.
   These tests focus on the inline module logic and static structure in index.html.
*/
(() => {
  const fs = require("fs");
  const path = require("path");

  const INDEX_HTML_PATH = 'index.html'; // repo-relative path

  function readHtml() {
    const p = path.isAbsolute(INDEX_HTML_PATH) ? INDEX_HTML_PATH : path.resolve(process.cwd(), INDEX_HTML_PATH);
    return fs.readFileSync(p, "utf8");
  }

  function parseDocument(html) {
    if (typeof globalThis !== "undefined" && typeof globalThis.DOMParser !== "undefined") {
      return new globalThis.DOMParser().parseFromString(html, "text/html");
    }
    // Attempt to fall back to jsdom if available
    try {
      const { JSDOM } = require("jsdom");
      return new JSDOM(html).window.document;
    } catch (e) {
      throw new Error("No DOM available. Configure Jest with testEnvironment: 'jsdom'.");
    }
  }

  function getInlineModuleScript(doc) {
    const s = doc.querySelector('script[type="module"]');
    return s ? s.textContent : "";
  }

  function stripModuleScript(html) {
    const doc = parseDocument(html);
    const s = doc.querySelector('script[type="module"]');
    if (!s) return html;
    s.parentNode.removeChild(s);
    return doc.documentElement.innerHTML;
  }

  function buildEvalCode(original) {
    // Replace ESM import with a stubbed renderHelix that captures calls
    const withoutImport = original.replace(
      /^\s*import\s+\{\s*renderHelix\s*\}\s+from\s+["']\.\/js\/helix-renderer\.mjs["'];?\s*$/m,
      'const renderHelix = (globalThis.__renderHelixMock = (globalThis.__renderHelixMock || (globalThis.jest?.fn?.() || (globalThis.vi?.fn?.()) || (()=>{ const fn=(...args)=>{ fn.mock = fn.mock || { calls: [] }; fn.mock.calls.push(args); }; fn.mock={ calls: [] }; return fn; })())));'
    );
    return `(async () => {\n${withoutImport}\n})();`;
  }

  async function runModuleWithFetch(responseFactory) {
    const html = readHtml();
    const parsed = parseDocument(html);

    // Stash and install globals so inline module logic sees them
    const prevDoc = global.document;
    const prevWin = global.window;
    const prevFetch = global.fetch;

    global.window = parsed.defaultView || global.window;
    global.document = parsed;

    // Render DOM without executing inline script
    document.documentElement.innerHTML = stripModuleScript(html);

    // Stub canvas getContext
    const CanvasProto = (parsed.defaultView && parsed.defaultView.HTMLCanvasElement && parsed.defaultView.HTMLCanvasElement.prototype)
      || (global.HTMLCanvasElement && global.HTMLCanvasElement.prototype);
    const origGetContext = CanvasProto && CanvasProto.getContext;
    const ctxStub = {};
    if (CanvasProto) {
      CanvasProto.getContext = (global.jest && jest.fn(() => ctxStub)) || (() => ctxStub);
    }

    // Stub fetch (spy if jest/vitest present)
    const baseFetch = async (url, opts) => {
      if (typeof responseFactory === "function") return await responseFactory(url, opts);
      return responseFactory;
    };
    const spyFetch = (global.jest && jest.fn(baseFetch)) || (global.vi && vi.fn(baseFetch)) || baseFetch;
    global.fetch = spyFetch;

    // Evaluate transformed module without using eval()
    const code = buildEvalCode(getInlineModuleScript(parsed));
    const vm = require('vm');
    const script = new vm.Script(code, { filename: "inline-module.js" });
    await script.runInThisContext();

    const calls = global.__renderHelixMock && global.__renderHelixMock.mock ? global.__renderHelixMock.mock.calls : [];
    const firstCall = calls && calls[0] ? calls[0] : null;
    const options = firstCall ? firstCall[1] : null;
    const statusText = document.getElementById("status") ? document.getElementById("status").textContent : "";

    // Restore
    if (CanvasProto && origGetContext) CanvasProto.getContext = origGetContext;
    global.fetch = prevFetch;
    global.document = prevDoc;
    global.window = prevWin;

    return { spyFetch, ctxStub, options, statusText, firstCall };
  }

  describe("index.html (Cosmic Helix Renderer) — structure", () => {
    it("includes title, meta tags, header/status, and canvas with expected attributes", () => {
      const html = readHtml();
      const doc = parseDocument(html);

      expect(doc.querySelector("title")?.textContent).toBe("Cosmic Helix Renderer (ND-safe, Offline)");

      const metaViewport = doc.querySelector('meta[name="viewport"]');
      expect(metaViewport?.getAttribute("content")).toBe("width=device-width,initial-scale=1,viewport-fit=cover");

      const metaScheme = doc.querySelector('meta[name="color-scheme"]');
      expect(metaScheme?.getAttribute("content")).toBe("light dark");

      const headerText = doc.querySelector("header strong")?.textContent || "";
      expect(headerText).toBe("Cosmic Helix Renderer");

      const statusEl = doc.getElementById("status");

      expect(statusEl?.textContent).toBe("Loading palette…");

      const canvas = doc.getElementById("stage");
      expect(canvas).toBeTruthy();
      expect(canvas?.getAttribute("width")).toBe("1440");
      expect(canvas?.getAttribute("height")).toBe("900");
      expect(canvas?.getAttribute("aria-label")).toBe("Layered sacred geometry canvas");

      const styleEl = doc.querySelector("style");
      const css = styleEl?.textContent || "";
      expect(css).toContain("ND-safe");
      expect(css).toContain(":root");
      expect(css).toContain("--bg:#0b0b12");
      expect(css).toContain("--ink:#e8e8f0");
    });
    
    it("module script imports renderer and declares NUM constants", () => {
      const html = readHtml();
      const doc = parseDocument(html);
      const code = getInlineModuleScript(doc);

      expect(code).toMatch(/import\s+\{\s*renderHelix\s*\}\s+from\s+["']\.\/js\/helix-renderer\.mjs["']/);
      expect(code).toMatch(/const\s+NUM\s*=\s*\{[\s\S]*THREE:3[\s\S]*SEVEN:7[\s\S]*NINE:9[\s\S]*ELEVEN:11[\s\S]*TWENTYTWO:22[\s\S]*THIRTYTHREE:33[\s\S]*NINETYNINE:99[\s\S]*ONEFORTYFOUR:144[\s\S]*\}/);
    });
  });

  describe("index.html — inline module behavior (palette loading and render invocation)", () => {
    it("loads palette.json (ok) and calls renderHelix with custom palette; updates status", async () => {
      const custom = { bg: "#101010", ink: "#fafafa", layers: ["#1","#2","#3","#4","#5","#6"] };
      const { spyFetch, options, statusText, firstCall } = await runModuleWithFetch(async () => ({
        ok: true,
        json: async () => custom
      }));

      expect(statusText).toBe("Palette loaded.");
      expect(options).toBeTruthy();
      expect(options?.palette).toEqual(custom);
      expect(options?.width).toBe(1440);
      expect(options?.height).toBe(900);
      expect(options?.NUM).toMatchObject({ THREE:3, SEVEN:7, NINE:9, ELEVEN:11, TWENTYTWO:22, THIRTYTHREE:33, NINETYNINE:99, ONEFORTYFOUR:144 });

      const call = (spyFetch.mock && spyFetch.mock.calls && spyFetch.mock.calls[0]) || null;
      if (call) {
        const [url, opts] = call;
        expect(url).toBe("./data/palette.json");
        expect(opts?.cache).toBe("no-store");
      }
      expect(firstCall?.length).toBe(2); // ctx, options
    });

    it("handles non-ok response (404) by using safe fallback and updating status", async () => {
      const { options, statusText } = await runModuleWithFetch(async () => ({
        ok: false,
        status: 404,
        json: async () => ({})
      }));

      expect(statusText).toBe("Palette missing; using safe fallback.");
      expect(options?.palette).toEqual({
        bg:"#0b0b12",
        ink:"#e8e8f0",
        layers:["#b1c7ff","#89f7fe","#a0ffa1","#ffd27f","#f5a3ff","#d0d0e6"]
      });
    });

    it("handles fetch throwing (network error) by using safe fallback and updating status", async () => {
      const { options, statusText } = await runModuleWithFetch(async () => { throw new Error("Network"); });

      expect(statusText).toBe("Palette missing; using safe fallback.");
      expect(options?.palette).toEqual({
        bg:"#0b0b12",
        ink:"#e8e8f0",
        layers:["#b1c7ff","#89f7fe","#a0ffa1","#ffd27f","#f5a3ff","#d0d0e6"]
      });
    });

    it("passes through invalid palette shape when JSON is ok (no validation in module)", async () => {
      const weird = { foo: "bar" };
      const { options, statusText } = await runModuleWithFetch(async () => ({
        ok: true,
        json: async () => weird
      }));
      expect(statusText).toBe("Palette loaded.");
      expect(options?.palette).toEqual(weird);
    });
  });
})();