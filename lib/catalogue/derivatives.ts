import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";

export function isDerivative(d: Pick<DatasetCatalogueEntry, "parent_dataset_id">) {
  return Boolean(d.parent_dataset_id?.trim());
}

export function filterRootDatasets(datasets: DatasetCatalogueEntry[]) {
  return datasets.filter((d) => !isDerivative(d));
}

export function getDerivatives(
  datasets: DatasetCatalogueEntry[],
  parentId: string,
) {
  return datasets.filter((d) => d.parent_dataset_id === parentId);
}

export function derivativeCountByParent(datasets: DatasetCatalogueEntry[]) {
  const counts = new Map<string, number>();
  for (const d of datasets) {
    const parentId = d.parent_dataset_id?.trim();
    if (!parentId) continue;
    counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
  }
  return counts;
}

const IDENTITY_KEYS = new Set([
  "id",
  "parent_dataset_id",
  "derivative_note",
  "created_by",
  "created_by_user_id",
  "created_by_email",
  "created_at",
  "updated_at",
]);

/** Storage is set per derivative, not inherited from parent. */
const DERIVATIVE_OWNED_KEYS = new Set([
  "internal_storage_path",
  "storage_on_server",
]);

export type CloneDerivativeInput = {
  id: string;
  derivative_note: string;
  created_by: string;
  created_by_user_id?: string;
  created_by_email?: string;
  internal_storage_path?: string;
  storage_on_server: boolean;
};

export function cloneParentEntry(
  parent: DatasetCatalogueEntry,
  input: CloneDerivativeInput,
): Record<string, unknown> {
  const now = new Date().toISOString();
  const o: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parent)) {
    if (IDENTITY_KEYS.has(key) || DERIVATIVE_OWNED_KEYS.has(key)) continue;
    if (value !== undefined) o[key] = value;
  }
  o.id = input.id.trim().toLowerCase();
  o.name = parent.name;
  o.short_description = parent.short_description;
  o.parent_dataset_id = parent.id;
  o.derivative_note = input.derivative_note.trim();
  o.created_by = input.created_by;
  if (input.created_by_user_id) o.created_by_user_id = input.created_by_user_id;
  if (input.created_by_email) o.created_by_email = input.created_by_email;
  if (input.storage_on_server === false) {
    o.storage_on_server = false;
  } else {
    o.internal_storage_path = input.internal_storage_path?.trim() ?? "";
  }
  o.created_at = now;
  o.updated_at = now;
  return o;
}

export function parentChainErrors(
  data: Record<string, unknown>,
  parentById: Map<string, DatasetCatalogueEntry>,
): string[] {
  const parentId = data.parent_dataset_id;
  if (typeof parentId !== "string" || parentId.trim() === "") return [];
  const parent = parentById.get(parentId);
  if (!parent) {
    return [`parent_dataset_id: parent "${parentId}" not found in catalogue`];
  }
  if (isDerivative(parent)) {
    return [
      "parent_dataset_id: cannot derive from a derivative (one level only)",
    ];
  }
  if (typeof data.id === "string" && data.id === parentId) {
    return ["parent_dataset_id: cannot be the same as dataset id"];
  }
  return [];
}
