import type { CatalogueIndex, DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { getCatalogueIndex } from "@/lib/catalogue/load-index";
import { assertDatasetSlug, catalogueJsonPath } from "@/lib/catalogue/path";
import {
  defaultBranch,
  getBlobFile,
  listDirectory,
  parseRepository,
} from "@/lib/github/contents";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function asEntry(raw: unknown, stem: string): DatasetCatalogueEntry | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id !== stem) return null;
  const required = [
    "name",
    "short_description",
    "internal_storage_path",
    "modality",
    "anatomy",
    "task",
    "access_level",
    "created_by",
    "created_at",
    "updated_at",
  ] as const;
  for (const k of required) {
    if (!(k in raw) || typeof raw[k] !== "string") return null;
  }
  return raw as unknown as DatasetCatalogueEntry;
}

/**
 * Build catalogue index from GitHub `datasets/*.json`. Falls back to
 * `generated/index.json` when env is missing or GitHub errors.
 */
export async function fetchCatalogueIndexLive(): Promise<CatalogueIndex> {
  if (!process.env.GITHUB_TOKEN?.trim() || !process.env.GITHUB_REPOSITORY?.trim()) {
    return getCatalogueIndex();
  }

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
