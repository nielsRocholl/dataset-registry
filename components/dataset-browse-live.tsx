"use client";

import { useMemo } from "react";

import {
  DatasetBrowse,
  type DatasetBrowsePagination,
} from "@/components/dataset-browse";
import { useLiveCatalogueIndex } from "@/lib/catalogue/use-live-catalogue-index";
import {
  derivativeCountByParent,
  isDerivative,
} from "@/lib/catalogue/derivatives";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";

type DatasetBrowseLiveProps = {
  canCreate: boolean;
  initialDatasets: DatasetCatalogueEntry[];
  generatedAt: string;
  starredDatasetIds?: string[];
  kicker?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  totalCount?: number;
  pagination?: DatasetBrowsePagination;
  /** Hide derivatives from the list (main catalogue browse). */
  rootsOnly?: boolean;
  /** Keep only datasets created by this user id (My datasets). */
  createdByUserId?: string;
  /** Keep only datasets whose id is in this list (Starred). */
  starredOnlyIds?: string[];
};

export function DatasetBrowseLive({
  initialDatasets,
  generatedAt: initialGeneratedAt,
  createdByUserId,
  starredOnlyIds,
  pagination,
  totalCount: serverTotalCount,
  rootsOnly = false,
  ...rest
}: DatasetBrowseLiveProps) {
  const { datasets: liveDatasets, generatedAt } = useLiveCatalogueIndex(
    initialDatasets,
    initialGeneratedAt,
  );

  const derivativeCounts = useMemo(
    () => derivativeCountByParent(liveDatasets),
    [liveDatasets],
  );

  const { datasets, totalCount } = useMemo(() => {
    let rows = liveDatasets;
    if (createdByUserId) {
      rows = rows.filter((d) => d.created_by_user_id === createdByUserId);
    }
    if (starredOnlyIds) {
      const allow = new Set(starredOnlyIds);
      rows = rows.filter((d) => allow.has(d.id));
    }
    if (rootsOnly) {
      rows = rows.filter((d) => !isDerivative(d));
    }
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));

    const total = rows.length;
    if (pagination) {
      const start = (pagination.page - 1) * pagination.pageSize;
      return {
        datasets: rows.slice(start, start + pagination.pageSize),
        totalCount: total,
      };
    }
    return { datasets: rows, totalCount: serverTotalCount ?? total };
  }, [
    liveDatasets,
    createdByUserId,
    starredOnlyIds,
    rootsOnly,
    pagination,
    serverTotalCount,
  ]);

  return (
    <DatasetBrowse
      {...rest}
      datasets={datasets}
      generatedAt={generatedAt}
      totalCount={totalCount}
      pagination={pagination}
      derivativeCounts={derivativeCounts}
    />
  );
}
