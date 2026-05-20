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

const VOCAB_PATH = path.join(root, "config/classification-vocabulary.json");
/** @typedef {{updated_at:string, fields: Record<string, Array<{value:string,label:string}>>}} VocabDoc */
/** @returns {VocabDoc} */
function readVocabulary() {
  const raw = JSON.parse(fs.readFileSync(VOCAB_PATH, "utf8"));
  if (!raw || typeof raw !== "object" || typeof raw.updated_at !== "string") {
    throw new Error("Invalid classification vocabulary file");
  }
  return raw;
}

const vocabDoc = readVocabulary();
const VOCAB_FIELDS = [
  "modality",
  "task",
  "body_region",
  "annotation_type",
  "access_level",
  "status",
  "dimensionality",
];

/** @param {string} field */
function vocabAllow(field) {
  const arr = vocabDoc.fields[field];
  return new Set((arr ?? []).map((x) => x.value));
}

/**
 * @param {Record<string, unknown>} data
 * @returns {string[]}
 */
function vocabErrors(data) {
  /** @type {string[]} */
  const out = [];
  for (const f of ["access_level"]) {
    const v = data[f];
    if (typeof v !== "string") continue;
    if (!vocabAllow(f).has(v)) out.push(`${f}: unknown value`);
  }
  const modalities = data.modality;
  if (Array.isArray(modalities)) {
    const ok = vocabAllow("modality");
    for (const item of modalities) {
      if (typeof item === "string" && !ok.has(item)) {
        out.push("modality: unknown value");
        break;
      }
    }
  }
  const tasks = data.task;
  if (Array.isArray(tasks)) {
    const ok = vocabAllow("task");
    for (const item of tasks) {
      if (typeof item === "string" && !ok.has(item)) {
        out.push("task: unknown value");
        break;
      }
    }
  }
  const br = data.body_regions;
  if (Array.isArray(br)) {
    const ok = vocabAllow("body_region");
    for (const item of br) {
      if (typeof item === "string" && !ok.has(item)) {
        out.push("body_regions: unknown value");
        break;
      }
    }
  }
  const at = data.annotation_types;
  if (Array.isArray(at)) {
    const ok = vocabAllow("annotation_type");
    for (const item of at) {
      if (typeof item === "string" && !ok.has(item)) {
        out.push("annotation_types: unknown value");
        break;
      }
    }
  }
  const st = data.status;
  if (typeof st === "string" && !vocabAllow("status").has(st)) out.push(`status: unknown`);
  const dim = data.dimensionality;
  if (
    typeof dim === "string" &&
    !vocabAllow("dimensionality").has(dim)
  )
    out.push(`dimensionality: unknown`);
  return out;
}

for (const key of VOCAB_FIELDS) {
  if (!Array.isArray(vocabDoc.fields[key]) || vocabDoc.fields[key].length === 0) {
    console.error(`validate-datasets: vocabulary missing field bucket ${key}`);
    process.exit(1);
  }
}

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
    continue;
  }
  const vocabBad = vocabErrors(data);
  if (vocabBad.length) {
    console.error(`${f}: vocabulary mismatch:`, vocabBad);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
