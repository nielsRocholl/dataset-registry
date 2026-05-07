import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "schema/dataset.schema.json"), "utf8"),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const datasetsDir = path.join(root, "datasets");
const files = fs.readdirSync(datasetsDir).filter((f) => f.endsWith(".json"));
let failed = false;

if (files.length === 0) {
  console.error("validate-datasets: no JSON files in datasets/");
  process.exit(1);
}

for (const f of files.sort()) {
  const p = path.join(datasetsDir, f);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error(`${f}: invalid JSON`, e.message);
    failed = true;
    continue;
  }
  const stem = path.basename(f, ".json");
  if (data.id !== stem) {
    console.error(`${f}: id "${data.id}" must equal filename stem "${stem}"`);
    failed = true;
    continue;
  }
  if (!validate(data)) {
    console.error(`${f}:`, JSON.stringify(validate.errors, null, 2));
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
