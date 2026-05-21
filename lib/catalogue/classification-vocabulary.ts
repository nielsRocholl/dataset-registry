import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";

export const CLASSIFICATION_VOCABULARY_FIELDS = [
  "modality",
  "task",
  "body_region",
  "annotation_type",
  "access_level",
  "status",
  "dimensionality",
] as const;

export type ClassificationFieldId =
  (typeof CLASSIFICATION_VOCABULARY_FIELDS)[number];

export type VocabularyTerm = { value: string; label: string };

export type ClassificationVocabularyDoc = {
  updated_at: string;
  fields: Record<ClassificationFieldId, VocabularyTerm[]>;
};

/** Legacy tokens that violate lowercase slug convention but remain valid catalog values. */
const LEGACY_VALUE_ALLOWLIST = new Set(["CT", "MRI", "PET", "XRay", "2D", "3D"]);

const VALUE_MAX_LEN = 64;
const LABEL_MAX_LEN = 128;

/** Slug convention for newly added taxonomy values (plus LEGACY_VALUE_ALLOWLIST). */
export function isAllowedClassificationSlug(value: string): boolean {
  const v = value.trim();
  if (v !== value || v === "") return false;
  if (v.length > VALUE_MAX_LEN) return false;
  if (LEGACY_VALUE_ALLOWLIST.has(v)) return true;
  return /^[a-z0-9][a-z0-9_-]*$/.test(v) || /^[a-z0-9]$/.test(v);
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseTerm(x: unknown): VocabularyTerm | null {
  if (!isPlainObject(x)) return null;
  if (typeof x.value !== "string" || typeof x.label !== "string") return null;
  const value = x.value.trim();
  const label = x.label.trim();
  if (
    value === "" ||
    label === "" ||
    value.length > VALUE_MAX_LEN ||
    label.length > LABEL_MAX_LEN
  ) {
    return null;
  }
  return { value, label };
}

export function parseClassificationVocabularyJson(
  raw: unknown,
): ClassificationVocabularyDoc | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.updated_at !== "string") return null;
  const { fields } = raw;
  if (!isPlainObject(fields)) return null;
  const out: Partial<Record<ClassificationFieldId, VocabularyTerm[]>> = {};
  for (const id of CLASSIFICATION_VOCABULARY_FIELDS) {
    const bucket = fields[id];
    if (!Array.isArray(bucket)) return null;
    const terms: VocabularyTerm[] = [];
    const seen = new Set<string>();
    for (const item of bucket) {
      const t = parseTerm(item);
      if (!t) return null;
      if (seen.has(t.value)) return null;
      seen.add(t.value);
      terms.push(t);
    }
    if (terms.length === 0) return null;
    out[id] = terms;
  }
  return {
    updated_at: raw.updated_at,
    fields: out as ClassificationVocabularyDoc["fields"],
  };
}

export function allowedValueSet(
  doc: ClassificationVocabularyDoc,
  field: ClassificationFieldId,
): Set<string> {
  return new Set(doc.fields[field].map((t) => t.value));
}

export function vocabularyLabel(
  doc: ClassificationVocabularyDoc | undefined,
  field: ClassificationFieldId,
  value: string,
): string {
  if (!doc) return value;
  const hit = doc.fields[field].find((t) => t.value === value);
  return hit?.label ?? value;
}

/** Single-string fields validated against vocab. */
const SINGLE_FIELDS: ClassificationFieldId[] = ["access_level"];

export type DatasetPayloadRecord = Record<string, unknown>;

export function vocabularyValidationErrorsForDataset(
  data: DatasetPayloadRecord,
  doc: ClassificationVocabularyDoc,
): string[] {
  const errs: string[] = [];
  for (const f of SINGLE_FIELDS) {
    const v = data[f];
    if (typeof v !== "string") continue;
    const allow = allowedValueSet(doc, f);
    if (!allow.has(v)) errs.push(`${f} "${v}" is not in the catalogue vocabulary`);
  }
  const modalities = data.modality;
  if (Array.isArray(modalities)) {
    const allow = allowedValueSet(doc, "modality");
    for (const item of modalities) {
      if (typeof item === "string" && !allow.has(item)) {
        errs.push(`modality entry "${item}" is not in the catalogue vocabulary`);
      }
    }
  }
  const br = data.body_regions;
  if (!Array.isArray(br) || br.length === 0) {
    errs.push("body_regions: select at least one body region");
  } else {
    const allow = allowedValueSet(doc, "body_region");
    for (const item of br) {
      if (typeof item === "string" && !allow.has(item)) {
        errs.push(`body_regions entry "${item}" is not in the catalogue vocabulary`);
      }
    }
  }
  const tasks = data.task;
  if (Array.isArray(tasks)) {
    const allow = allowedValueSet(doc, "task");
    for (const item of tasks) {
      if (typeof item === "string" && !allow.has(item)) {
        errs.push(`task entry "${item}" is not in the catalogue vocabulary`);
      }
    }
  }
  const at = data.annotation_types;
  if (Array.isArray(at)) {
    const allow = allowedValueSet(doc, "annotation_type");
    for (const item of at) {
      if (typeof item === "string" && !allow.has(item)) {
        errs.push(`annotation_types entry "${item}" is not in the catalogue vocabulary`);
      }
    }
  }
  const st = data.status;
  if (typeof st === "string") {
    const allow = allowedValueSet(doc, "status");
    if (!allow.has(st)) errs.push(`status "${st}" is not in the catalogue vocabulary`);
  }
  const dim = data.dimensionality;
  if (typeof dim === "string") {
    const allow = allowedValueSet(doc, "dimensionality");
    if (!allow.has(dim)) {
      errs.push(`dimensionality "${dim}" is not in the catalogue vocabulary`);
    }
  }
  return errs;
}

export function countClassificationValueUsage(
  datasets: DatasetCatalogueEntry[],
  field: ClassificationFieldId,
  value: string,
): number {
  let n = 0;
  for (const d of datasets) {
    switch (field) {
      case "modality":
        if (Array.isArray(d.modality) && d.modality.includes(value)) n++;
        break;
      case "task":
        if (Array.isArray(d.task) && d.task.includes(value)) n++;
        break;
      case "access_level":
        if (d.access_level === value) n++;
        break;
      case "status":
        if (d.status === value) n++;
        break;
      case "dimensionality":
        if (d.dimensionality === value) n++;
        break;
      case "body_region":
        if (d.body_regions?.includes(value)) n++;
        break;
      case "annotation_type":
        if (d.annotation_types?.includes(value)) n++;
        break;
      default:
        break;
    }
  }
  return n;
}

export function classificationFieldHumanTitle(field: ClassificationFieldId): string {
  switch (field) {
    case "modality":
      return "Modality";
    case "task":
      return "Task";
    case "body_region":
      return "Body region";
    case "annotation_type":
      return "Annotation type";
    case "access_level":
      return "Access level";
    case "status":
      return "Status";
    case "dimensionality":
      return "Dimensionality";
    default: {
      const _x: never = field;
      return _x;
    }
  }
}

export function formatStableVocabularyJson(doc: ClassificationVocabularyDoc): string {
  const sortedFields = Object.fromEntries(
    CLASSIFICATION_VOCABULARY_FIELDS.map((id) => {
      const ts = [...doc.fields[id]].sort((a, b) => a.value.localeCompare(b.value));
      return [id, ts];
    }),
  );
  const ordered: ClassificationVocabularyDoc = {
    updated_at: doc.updated_at,
    fields: sortedFields as ClassificationVocabularyDoc["fields"],
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export function addClassificationTerm(
  doc: ClassificationVocabularyDoc,
  field: ClassificationFieldId,
  value: string,
  label: string,
): ClassificationVocabularyDoc {
  const v = value.trim();
  const l = label.trim();
  if (!isAllowedClassificationSlug(v)) {
    throw new Error(
      `Invalid value slug: use lowercase slug (letters, digits, hyphens; max ${VALUE_MAX_LEN} chars); legacy modality tokens CT, MRI, PET, XRay, 2D, 3D are reserved.`,
    );
  }
  if (l === "" || l.length > LABEL_MAX_LEN) {
    throw new Error("Display label must be non-empty and under 128 characters.");
  }
  const nextTerms = [...doc.fields[field]];
  if (nextTerms.some((t) => t.value === v)) throw new Error("That value already exists.");
  nextTerms.push({ value: v, label: l });
  nextTerms.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return {
    updated_at: new Date().toISOString(),
    fields: { ...doc.fields, [field]: nextTerms },
  };
}

export function removeClassificationTerm(
  doc: ClassificationVocabularyDoc,
  field: ClassificationFieldId,
  value: string,
): ClassificationVocabularyDoc {
  const nextTerms = doc.fields[field].filter((t) => t.value !== value);
  if (nextTerms.length === doc.fields[field].length) {
    throw new Error("That option does not exist.");
  }
  if (nextTerms.length === 0) throw new Error("Cannot remove the last option in this field.");
  return {
    updated_at: new Date().toISOString(),
    fields: { ...doc.fields, [field]: nextTerms },
  };
}

export function vocabularyToFilterPairs(
  doc: ClassificationVocabularyDoc | undefined,
  field: ClassificationFieldId,
): { label: string; value: string }[] {
  if (!doc) return [];
  return doc.fields[field].map((t) => ({ label: t.label, value: t.value }));
}
