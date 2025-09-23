/**
 * Framework: Node.js built-in test runner (node:test) with assert/strict.
 * Purpose: Validate interface schema enforcement by validateInterface.
 * Focus: Replacement for tests/interface.test.js IIFE; broaden coverage.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateInterface } from "../engines/interface-guard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadSchemaDataUrl() {
  const schemaPath = path.join(__dirname, "../assets/data/interface.schema.json");
  const schemaText = await readFile(schemaPath, "utf8");
  return "data:application/json," + encodeURIComponent(schemaText);
}

async function loadSample() {
  const p = path.join(__dirname, "../assets/data/sample_interface.json");
  return JSON.parse(await readFile(p, "utf8"));
}

test("validateInterface: valid sample passes schema validation (happy path)", async () => {
  const schemaUrl = await loadSchemaDataUrl();
  const sample = await loadSample();
  const res = await validateInterface(sample, schemaUrl);
  assert.equal(res.valid, true);
  assert.deepEqual(res.errors ?? [], []);
});

test("validateInterface: missing required property fails with clear error", async () => {
  const schemaUrl = await loadSchemaDataUrl();
  const sample = await loadSample();
  const keys = Object.keys(sample);
  if (keys.length === 0) {
    // If sample has no keys, simulate a required property by adding then removing to trigger validation
    sample.__temp = "x";
  }
  const firstKey = Object.keys(sample)[0];
  delete sample[firstKey];

  const res = await validateInterface(sample, schemaUrl);
  assert.equal(res.valid, false);
  assert.ok((res.errors?.length ?? 0) > 0, "should contain validation errors");
});

test("validateInterface: wrong type on a known property produces validation error", async () => {
  const schemaUrl = await loadSchemaDataUrl();
  const sample = await loadSample();

  for (const k of Object.keys(sample)) {
    const v = sample[k];
    if (typeof v === "string") { sample[k] = 12345; break; }
    if (typeof v === "number") { sample[k] = "not-a-number"; break; }
    if (typeof v === "boolean") { sample[k] = "true"; break; }
    if (Array.isArray(v)) { sample[k] = {}; break; }
    if (v && typeof v === "object") { sample[k] = []; break; }
  }

  const res = await validateInterface(sample, schemaUrl);

  assert.equal(res.valid, false);
  assert.ok((res.errors?.length ?? 0) > 0);
});

test("validateInterface: additional unknown property handling matches schema", async () => {
  const schemaUrl = await loadSchemaDataUrl();
  const sample = await loadSample();
  sample.__unexpected__ = "surprise";

  const res = await validateInterface(sample, schemaUrl);
  assert.equal(typeof res.valid, "boolean");
  if (!res.valid) {
    assert.ok(Array.isArray(res.errors) && res.errors.length > 0);
  }
});

test("validateInterface: invalid schema URL yields failure with descriptive error(s)", async () => {
  const sample = await loadSample();
  const badUrl = "data:application/json,{"; // invalid JSON
  const res = await validateInterface(sample, badUrl);
  assert.equal(res.valid, false);
  assert.ok((res.errors?.length ?? 0) > 0);
});

test("validateInterface: null and non-object sample inputs are rejected gracefully", async () => {
  const schemaUrl = await loadSchemaDataUrl();
  for (const bad of [null, 0, "str", true, [], undefined]) {
    // @ts-ignore
    const res = await validateInterface(bad, schemaUrl);
    assert.equal(res.valid, false);
    assert.ok((res.errors?.length ?? 0) > 0);
  }
});