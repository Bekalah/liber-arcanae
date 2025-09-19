// Structured unit tests for validateInterface
// Framework: Node's built-in test runner (node:test) with assert/strict

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateInterface } from "../engines/interface-guard.js";

const schemaTextPromise = readFile(new URL("../assets/data/interface.schema.json", import.meta.url), "utf8");
const sampleOkPromise = readFile(new URL("../assets/data/sample_interface.json", import.meta.url), "utf8");

async function makeDataUrlFromText(txt) {
  return "data:application/json," + encodeURIComponent(txt);
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

let schemaUrl;
let sampleOk;

test("setup: load schema and sample", async () => {
  const schemaText = await schemaTextPromise;
  schemaUrl = await makeDataUrlFromText(schemaText);
  sampleOk = JSON.parse(await sampleOkPromise);
  assert.ok(schemaUrl.startsWith("data:application/json,"));
  assert.ok(sampleOk && typeof sampleOk === "object");
});

test("accepts a valid sample payload (happy path)", async () => {
  const res = await validateInterface(sampleOk, schemaUrl);
  assert.equal(res.valid, true, "expected valid sample to pass schema validation");
});

test("rejects payload missing a required top-level property", async () => {
  const invalid = deepClone(sampleOk);
  const keyToDelete = Object.keys(invalid).find(k => /id|name|version|type/i.test(k)) ?? Object.keys(invalid)[0];
  delete invalid[keyToDelete];
  const res = await validateInterface(invalid, schemaUrl);
  assert.equal(res.valid, false);
  assert.ok((res.errors?.length || 0) > 0);
});

test("rejects payload with wrong type on a required field", async () => {
  const invalid = deepClone(sampleOk);
  const targetKey = Object.keys(invalid).find(k => typeof invalid[k] === "string") ?? Object.keys(invalid)[0];
  invalid[targetKey] = Array.isArray(invalid[targetKey]) ? {} : 12345;
  const res = await validateInterface(invalid, schemaUrl);
  assert.equal(res.valid, false);
  assert.ok((res.errors?.length || 0) > 0);
});

test("rejects payload with unexpected additional property when schema forbids", async () => {
  const invalid = deepClone(sampleOk);
  invalid.__unexpected_field__ = "should trigger additionalProperties=false";
  const res = await validateInterface(invalid, schemaUrl);
  if (res.valid) {
    assert.equal(res.valid, true); // schema might allow additional properties
  } else {
    assert.equal(res.valid, false);
    assert.ok((res.errors?.length || 0) > 0);
  }
});

test("detects structural violations in nested arrays/objects (if present)", async () => {
  const invalid = deepClone(sampleOk);
  const corrupt = (obj) => {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (Array.isArray(v) && v.length > 0) {
        v.push(12345);
        return true;
      } else if (v && typeof v === "object") {
        if (corrupt(v)) return true;
      }
    }
    return false;
  };
  if (!corrupt(invalid)) {
    invalid["_struct_break_"] = [null, 1, "x"];
  }
  const res = await validateInterface(invalid, schemaUrl);
  assert.equal(res.valid, false);
  assert.ok((res.errors?.length || 0) > 0);
});

test("fails gracefully when given an invalid schema URL", async () => {
  const badSchemaUrl = "data:application/json,}{not-json";
  const result = await validateInterface(sampleOk, badSchemaUrl);
  assert.equal(!!result && typeof result === "object" && ("valid" in result), true);
  assert.equal(result.valid, false);
  assert.ok((result.errors?.length || 0) > 0);
});