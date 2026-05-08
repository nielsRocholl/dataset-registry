import Link from "next/link";
import {
  AsteriskIcon,
  DatabaseIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DatasetStarButton } from "@/components/dataset-star-button";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

type DatasetBrowseProps = {
  canCreate: boolean;
  datasets: DatasetCatalogueEntry[];
  generatedAt: string;
  starredDatasetIds?: string[];
  kicker?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
};

function scaleLabel(dataset: DatasetCatalogueEntry) {
  const parts = [
    dataset.n_patients != null ? `${dataset.n_patients} patients` : null,
    dataset.n_studies != null ? `${dataset.n_studies} studies` : null,
    dataset.dimensionality,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Metadata entry";
}

function formatGeneratedAt(iso: string) {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return iso;
  return `${time.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

export function DatasetBrowse({
  canCreate,
  datasets,
  generatedAt,
  starredDatasetIds = [],
  kicker = "Browse",
  title = "All datasets",
  description,
  emptyMessage = "No datasets yet. Add one from the sidebar or run a sync with GitHub.",
}: DatasetBrowseProps) {
  const generatedLabel = formatGeneratedAt(generatedAt);
  const starred = new Set(starredDatasetIds);

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 pb-16">
        <header className="flex flex-col gap-5 px-1 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <AsteriskIcon className="mt-1 size-8 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0">
              <p className="ui-kicker">{kicker}</p>
              <h1 className="ui-title mt-2 text-[length:var(--text-3xl)]">
                {title}
              </h1>
              <p className="ui-copy mt-3 text-[length:var(--text-sm)]">
                {description ??
                  `${datasets.length} ${
                    datasets.length === 1 ? "entry" : "entries"
                  } sorted A-Z. Refreshed from the repository when you open this page.`}
              </p>
              <p className="mt-3 text-[length:var(--text-xs)] text-muted-foreground">
                Index generated {generatedLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href="/datasets/search"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <SearchIcon data-icon="inline-start" />
              Search
            </Link>
            {canCreate ? (
              <Link
                href="/datasets/new"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                <PlusIcon data-icon="inline-start" />
                New dataset
              </Link>
            ) : null}
          </div>
        </header>

        {datasets.length === 0 ? (
          <div className="w-full rounded-2xl border border-border bg-card px-5 py-10 text-center">
            <p className="text-[length:var(--text-sm)] text-muted-foreground">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <ul className="flex w-full flex-col gap-1.5">
            {datasets.map((dataset) => (
              <li key={dataset.id}>
                <div
                  className={cn(
                    "group relative rounded-2xl border border-transparent outline-none",
                    "transition-[background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)]",
                    "hover:-translate-y-px hover:border-border hover:bg-card hover:shadow-[var(--shadow-soft)]",
                  )}
                >
                  <Link
                    href={`/datasets/${dataset.id}`}
                    className="flex flex-col gap-2.5 rounded-2xl px-3.5 py-3 pr-12 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <DatabaseIcon
                            className="size-4 shrink-0 text-brand"
                            aria-hidden
                          />
                          <h2 className="truncate text-[length:var(--text-base)] font-medium text-foreground">
                            {dataset.name}
                          </h2>
                        </div>
                        <p className="mt-1 line-clamp-2 max-w-[62ch] text-[length:var(--text-sm)] leading-relaxed text-muted-foreground">
                          {dataset.short_description}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        <Badge variant="secondary">{dataset.modality}</Badge>
                        <Badge variant="outline">{dataset.task}</Badge>
                        <Badge variant="outline">{dataset.access_level}</Badge>
                        <Badge variant="outline">By {dataset.created_by}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-[length:var(--text-xs)] text-muted-foreground">
                      <span className="font-mono">{dataset.id}</span>
                      <span>{dataset.anatomy}</span>
                      <span>{scaleLabel(dataset)}</span>
                    </div>
                  </Link>
                  <DatasetStarButton
                    datasetId={dataset.id}
                    initialStarred={starred.has(dataset.id)}
                    className="absolute right-2 top-2"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
