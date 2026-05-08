import type { CatalogueIndex, DatasetCatalogueEntry } from "./types";

import rawIndex from "@/generated/index.json";

const catalogueIndex = rawIndex as CatalogueIndex;

export function getCatalogueIndex(): CatalogueIndex {
  return catalogueIndex;
}

export function getDatasetById(id: string): DatasetCatalogueEntry | undefined {
  return catalogueIndex.datasets.find((d) => d.id === id);
}

export function getDatasetIds(): string[] {
  return catalogueIndex.datasets.map((d) => d.id);
}
