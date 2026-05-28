import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";

export function getDatasetSeriesCount(
  d: DatasetCatalogueEntry,
): number | undefined {
  return d.n_series ?? d.n_images;
}
