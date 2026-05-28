import { unstable_cache } from "next/cache";

import type { CatalogueIndex, DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { getCatalogueIndex } from "@/lib/catalogue/load-index";
import { assertDatasetSlug, catalogueJsonPath } from "@/lib/catalogue/path";
import {
  defaultBranch,
  getBlobFile,
  listDirectory,
  parseRepository,
} from "@/lib/github/contents";

export const CATALOGUE_INDEX_CACHE_TAG = "catalogue-index-live";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function asEntry(raw: unknown, stem: string): DatasetCatalogueEntry | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id !== stem) return null;
  const required = [
    "name",
    "short_description",
    "access_level",
    "created_by",
    "created_at",
    "updated_at",
  ] as const;
  for (const k of required) {
    if (!(k in raw) || typeof raw[k] !== "string") return null;
  }
  if (
    raw.storage_on_server !== undefined &&
    typeof raw.storage_on_server !== "boolean"
  ) {
    return null;
  }
  const onServer = raw.storage_on_server !== false;
  if (onServer) {
    if (
      typeof raw.internal_storage_path !== "string" ||
      raw.internal_storage_path.trim() === ""
    ) {
      return null;
    }
  } else if (
    typeof raw.internal_storage_path === "string" &&
    raw.internal_storage_path.trim() !== ""
  ) {
    return null;
  }
  const modality = raw.modality;
  if (
    !Array.isArray(modality) ||
    modality.length === 0 ||
    modality.some((m) => typeof m !== "string" || m.length === 0)
  ) {
    return null;
  }
  const task = raw.task;
  if (task !== undefined) {
    if (
      !Array.isArray(task) ||
      task.length === 0 ||
      task.some((t) => typeof t !== "string" || t.length === 0)
    ) {
      return null;
    }
  }
  if (
    raw.is_longitudinal !== undefined &&
    typeof raw.is_longitudinal !== "boolean"
  ) {
    return null;
  }
  if (raw.phase !== undefined && typeof raw.phase !== "string") {
    return null;
  }
  if (
    raw.main_disease_type !== undefined &&
    typeof raw.main_disease_type !== "string"
  ) {
    return null;
  }
  const bodyRegions = raw.body_regions;
  if (
    !Array.isArray(bodyRegions) ||
    bodyRegions.length === 0 ||
    bodyRegions.some((r) => typeof r !== "string" || r.length === 0)
  ) {
    return null;
  }
  return raw as unknown as DatasetCatalogueEntry;
}

async function fetchCatalogueIndexFromGitHub(): Promise<CatalogueIndex> {
  try {
    const repo = parseRepository();
    const branch = defaultBranch();
    const entries = await listDirectory(repo, "datasets", branch);
    const jsonFiles = entries.filter(
      (e) => e.type === "file" && e.name.endsWith(".json"),
    );

    const results = await Promise.all(
      jsonFiles.map(async (file) => {
        const stem = file.name.replace(/\.json$/i, "");
        if (!assertDatasetSlug(stem)) return null;
        const path = catalogueJsonPath(stem);
        const blob = await getBlobFile(repo, path, branch);
        if (!blob) return null;
        let parsed: unknown;
        try {
          parsed = JSON.parse(blob.text);
        } catch {
          return null;
        }
        return asEntry(parsed, stem);
      }),
    );

    const datasets = results.filter(
      (x): x is DatasetCatalogueEntry => x != null,
    );
    return {
      generated_at: new Date().toISOString(),
      datasets,
    };
  } catch {
    return getCatalogueIndex();
  }
}

const fetchCatalogueIndexFromGitHubCached = unstable_cache(
  fetchCatalogueIndexFromGitHub,
  ["catalogue-index-blob"],
  { revalidate: 30, tags: [CATALOGUE_INDEX_CACHE_TAG] },
);

/** Bypass Next data cache — use after catalogue writes or client refresh. */
export async function fetchCatalogueIndexUncached(): Promise<CatalogueIndex> {
  if (!process.env.GITHUB_TOKEN?.trim() || !process.env.GITHUB_REPOSITORY?.trim()) {
    return getCatalogueIndex();
  }
  return fetchCatalogueIndexFromGitHub();
}

/**
 * Build catalogue index from GitHub `datasets/*.json`. Falls back to
 * `generated/index.json` when env is missing or GitHub errors.
 * GitHub-backed results are cached briefly to avoid refetching on every navigation.
 */
export async function fetchCatalogueIndexLive(): Promise<CatalogueIndex> {
  if (!process.env.GITHUB_TOKEN?.trim() || !process.env.GITHUB_REPOSITORY?.trim()) {
    return getCatalogueIndex();
  }
  return fetchCatalogueIndexFromGitHubCached();
}
