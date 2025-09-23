// NOTE: Replaced by tests/interface.guard.* tests using proper test framework. Keeping file for backward compatibility.
import { validateInterface } from "../engines/interface-guard.js";
import { readFile } from "node:fs/promises";

(async () => {
  const schemaText = await readFile(new URL("../assets/data/interface.schema.json", import.meta.url), "utf8");
  const schemaUrl = "data:application/json," + encodeURIComponent(schemaText);
  const sample = JSON.parse(await readFile(new URL("../assets/data/sample_interface.json", import.meta.url), "utf8"));
  const { errors } = await validateInterface(sample, schemaUrl);
  if (errors && errors.length) {
    throw new Error("Interface schema failed: " + JSON.stringify(errors));
  }
  console.log("Interface schema OK");
})();