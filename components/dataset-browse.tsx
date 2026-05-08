import Link from "next/link";
import { AsteriskIcon, DatabaseIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

type DatasetBrowseProps = {
  datasets: DatasetCatalogueEntry[];
  generatedAt: string;
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

export function DatasetBrowse({ datasets, generatedAt }: DatasetBrowseProps) {
  const generatedLabel = formatGeneratedAt(generatedAt);

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-7 pb-16">
        <header className="rounded-3xl border border-border bg-card px-5 py-5 shadow-[var(--shadow-soft)] sm:px-7 sm:py-7">
          <div className="flex items-start gap-4">
            <AsteriskIcon className="mt-1 size-9 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0">
              <p className="ui-kicker">Browse</p>
              <h1 className="ui-title mt-2 text-[length:var(--text-3xl)]">
                All datasets
              </h1>
              <p className="ui-copy mt-3 text-[length:var(--text-sm)]">
                {datasets.length}{" "}
                {datasets.length === 1 ? "entry" : "entries"} in the catalogue,
                sorted A–Z. Refreshed from the repository when you open this page.
              </p>
              <p className="mt-4 text-[length:var(--text-xs)] text-muted-foreground">
                Index snapshot {generatedLabel}
              </p>
            </div>
          </div>
        </header>

        {datasets.length === 0 ? (
          <div className="w-full rounded-2xl border border-border bg-card px-5 py-10 text-center">
            <p className="text-[length:var(--text-sm)] text-muted-foreground">
              No datasets yet. Add one from the sidebar or run a sync with
              GitHub.
            </p>
          </div>
        ) : (
          <ul className="flex w-full flex-col gap-2">
            {datasets.map((dataset) => (
              <li key={dataset.id}>
                <Link
                  href={`/datasets/${dataset.id}`}
                  className={cn(
                    "group flex flex-col gap-3 rounded-2xl border border-transparent px-4 py-3 outline-none",
                    "transition-[background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)]",
                    "hover:-translate-y-px hover:border-border hover:bg-card hover:shadow-[var(--shadow-soft)]",
                    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                  )}
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
                      <p className="mt-1 line-clamp-2 text-[length:var(--text-sm)] leading-relaxed text-muted-foreground">
                        {dataset.short_description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <Badge variant="secondary">{dataset.modality}</Badge>
                      <Badge variant="outline">{dataset.task}</Badge>
                      <Badge variant="outline">{dataset.access_level}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--text-xs)] text-muted-foreground">
                    <span className="font-mono">{dataset.id}</span>
                    <span>{dataset.anatomy}</span>
                    <span>{scaleLabel(dataset)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
