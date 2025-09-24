/* 
Testing library and framework:
- Defaulting to Node-based assertions with a tiny expect-like helper
- If the project uses Jest/Vitest, this file is compatible: replace local expect with global expect and remove helper.

Purpose:
- Validate README_RENDERER.md structure and key content introduced/modified in the diff.
*/

const fs = require("fs");
const path = require("path");

// Minimal expect helper to mimic Jest assertions if not available.
function makeExpect() {
  function toBe(received, expected) {
    if (received !== expected) throw new Error(`Expected "${received}" to be "${expected}"`);
  }
  function toBeTruthy(received) {
    if (!received) throw new Error(`Expected value to be truthy but got: ${received}`);
  }
  function toContain(received, substr) {
    if (!received.includes(substr)) throw new Error(`Expected content to contain: ${substr}`);
  }
  function toMatch(received, regex) {
    if (!regex.test(received)) throw new Error(`Expected content to match: ${regex}`);
  }
  return (received) => ({
    toBe: (exp) => toBe(received, exp),
    toBeTruthy: () => toBeTruthy(received),
    toContain: (substr) => toContain(received, substr),
    toMatch: (regex) => toMatch(received, regex),
  });
}
const localExpect = typeof expect === "function" ? expect : makeExpect();

function run(name, fn) {
  try {
    fn();
    console.log('✓ ' + name);
  } catch (e) {
    console.error('✗ ' + name + '\n  ' + e.message);
    process.exitCode = 1;
  }
}

const readmePath = path.join(__dirname, "..", "README_RENDERER.md");
const content = fs.readFileSync(readmePath, "utf8");

// Shared helpers
function hasHeading(h) {
  const pattern = new RegExp("^#\\s+" + h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$", "m");
  return pattern.test(content);
}

run("README contains top-level title 'Cosmic Helix Renderer'", () => {
  localExpected(hasHeading("Cosmic Helix Renderer")).toBe(true);
});

run("README contains 'Structure' section with four specific layers", () => {
  localExpected(/^\s*##\s+Structure\s*$/m.test(content)).toBe(true);
  localExpected(content).toContain("Layer 1 — Vesica Field");
  localExpected(content).toContain("Layer 2 — Tree-of-Life Scaffold");
  localExpected(content).toContain("Layer 3 — Fibonacci Curve");
  localExpected(content).toContain("Layer 4 — Double Helix Lattice");
});

run("Layer 1 details reference 3x7 grid with 21 vessels and mention 33 spine and 21 pillars", () => {
  localExpected(content).toMatch(/3x7\s+grid.*21\s+vessels/i);
  localExpected(content).toMatch(/33\s+spine/i);
  localExpected(content).toMatch(/21\s+pillars/i);
});

run("Layer 2 details ten nodes and 22 paths with parameterized coordinates", () => {
  localExpected(content).toMatch(/Ten\s+numbered\s+nodes/i);
  localExpected(content).toMatch(/22\s+connective\s+paths/i);
  localExpected(content).toMatch(/Coordinates.*parameterized/i);
});

run("Layer 3 details a Fibonacci-based static polyline and explicitly states no animation", () => {
  localExpected(content).toMatch(/Fibonacci\s+Curve/i);
  localExpected(content).toMatch(/Static\s+polyline/i);
  localExpected(content).toMatch(/No\s+animation/i);
});

run("Layer 4 details double helix lattice with 33 segments and eleven crossbars", () => {
  localExpected(content).toMatch(/Double\s+Helix\s+Lattice/i);
  localExpected(content).toMatch(/33\s+segments/i);
  localExpected(content).toMatch(/eleven\s+crossbars/i);
});

run("README contains 'Usage' section with offline instructions and palette fallback", () => {
  localExpected(/^\s*##\s+Usage\s*$/m.test(content)).toBe(true);
  localExpected(content).toContain("Open `index.html` directly");
  localExpected(content).toMatch(/attempts to load `data\/palette\.json`.*falls back/i);
  localExpected(content).toMatch(/All modules are ES modules/i);
});

run("README contains 'Palette' section stressing AA contrast and ND-safe palette", () => {
  localExpected(/^\s*##\s+Palette\s*$/m.test(content)).toBe(true);
  localExpected(content).toMatch(/Each color supports AA contrast/i);
  localExpected(content).toMatch(/ND-safe/i);
});

run("README contains 'Numerology Constants' with required values", () => {
  localExpected(/^\s*##\s+Numerology Constants\s*$/m.test(content)).toBe(true);
  // Validate presence of the specific constants and brief rationale
  ["3, 7, 9", "11, 22, 33", "99, 144"].forEach((group) => {
    localExpected(content).toContain(group);
  });
});

run("README contains 'Offline + Safety Notes' with no motion and fixed canvas dimensions", () => {
  localExpected(/^\s*##\s+Offline \+ Safety Notes\s*$/m.test(content)).toBe(true);
  localExpected(content).toMatch(/Motion is absent/i);
  localExpected(content).toMatch(/reduced-motion users see an identical static composition/i);
  localExpected(content).toMatch(/Canvas dimensions are fixed at 1440×900/i);
});

run("README mentions no external dependencies beyond optional palette", () => {
  localExpected(content).toMatch(/There are no external dependencies or network requests beyond the optional palette/i);
});

run("README uses LF newlines and plain ASCII in modules statement", () => {
  // Statement check
  localExpected(content).toMatch(/All modules are ES modules with plain ASCII characters and LF newlines\./i);
  // Soft validation of LF by ensuring there are newline characters and no CRLF markers
  localExpected(!content.includes('\r\n')).toBe(true);
});

run("README contains no external links (ensuring no broken link risk in this doc)", () => {
  // Detect markdown links or raw http(s) URLs
  const hasLinks = /\[[^\]]+\]\((https?:\/\/|mailto:)[^)]+\)|https?:\/\/\S+/.test(content);
  localExpected(hasLinks).toBe(false);
});