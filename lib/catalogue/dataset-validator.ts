import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { ErrorObject } from "ajv";

import type { ClassificationVocabularyDoc } from "@/lib/catalogue/classification-vocabulary";
import { vocabularyValidationErrorsForDataset } from "@/lib/catalogue/classification-vocabulary";
import schema from "@/schema/dataset.schema.json";

type DatasetRecord = Record<string, unknown>;

/** Path required unless explicitly catalogued off-server. */
export function storageConsistencyErrors(data: DatasetRecord): string[] {
  const onServer = data.storage_on_server !== false;
  const path = data.internal_storage_path;
  if (onServer) {
    if (typeof path !== "string" || path.trim() === "") {
      return ["internal_storage_path: required when data is on group storage"];
    }
    return [];
  }
  if (typeof path === "string" && path.trim() !== "") {
    return [
      "internal_storage_path: omit when catalogue entry is not on group storage",
    ];
  }
  return [];
}

const SCHEMA_KEYS = new Set(Object.keys(schema.properties));

/** Drop legacy/extra keys before schema validation (e.g. n_images from parent clone). */
export function pickDatasetSchemaFields(data: DatasetRecord): DatasetRecord {
  const o: DatasetRecord = {};
  for (const key of SCHEMA_KEYS) {
    if (key in data && data[key] !== undefined) o[key] = data[key];
  }
  return o;
}

export function formatDatasetValidationError(
  result: DatasetValidationErr,
): string {
  if ("vocabularyErrors" in result) {
    return result.vocabularyErrors.join(" ");
  }
  if ("errors" in result) {
    return result.errors
      .map((e) => {
        const path = e.instancePath ? e.instancePath.slice(1) : "dataset";
        return path ? `${path}: ${e.message}` : e.message ?? "invalid";
      })
      .join(" ");
  }
  if ("idMismatch" in result) {
    return `Dataset id must equal "${result.pathSegmentId}".`;
  }
  return "Validation failed.";
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateAgainstSchema = ajv.compile(schema);

export type DatasetValidationOk = { ok: true; data: DatasetRecord };
export type DatasetValidationErr =
  | { ok: false; errors: ErrorObject[] }
  | { ok: false; idMismatch: true; pathSegmentId: string }
  | { ok: false; vocabularyErrors: string[] };

export type DatasetValidationResult =
  | DatasetValidationOk
  | DatasetValidationErr;

export function validateDatasetPayload(
  data: unknown,
  pathSegmentId: string,
  vocabulary: ClassificationVocabularyDoc,
): DatasetValidationResult {
  if (typeof data !== "object" || data === null) {
    return {
      ok: false,
      errors: [
        {
          instancePath: "",
          schemaPath: "",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        } as ErrorObject,
      ],
    };
  }
  const rec = pickDatasetSchemaFields(data as DatasetRecord);
  if (!validateAgainstSchema(rec)) {
    return {
      ok: false,
      errors: (validateAgainstSchema.errors ?? []) as ErrorObject[],
    };
  }
  if (typeof rec.id !== "string" || rec.id !== pathSegmentId) {
    return { ok: false, idMismatch: true, pathSegmentId };
  }
  const storageErrs = storageConsistencyErrors(rec);
  if (storageErrs.length > 0) {
    return { ok: false, vocabularyErrors: storageErrs };
  }
  const vErrs = vocabularyValidationErrorsForDataset(rec, vocabulary);
  if (vErrs.length > 0) {
    return { ok: false, vocabularyErrors: vErrs };
  }
  return { ok: true, data: rec };
}

export function formatStableJson(payload: DatasetRecord): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}
