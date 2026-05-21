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
  if (!validateAgainstSchema(data)) {
    return {
      ok: false,
      errors: (validateAgainstSchema.errors ?? []) as ErrorObject[],
    };
  }
  const rec = data as DatasetRecord;
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
