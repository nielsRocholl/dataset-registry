import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DatasetEditorPageHeader } from "@/components/dataset-editor-page-header";
import { DatasetStarButton } from "@/components/dataset-star-button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

const ACTION_LINK_CLASSES =
  "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap outline-none select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 min-h-10 gap-2 px-4 text-sm font-medium rounded-md";

const DATASET_CARD_BADGE =
  "h-6 shrink-0 border-border/60 px-2 text-xs font-medium text-foreground/65 rounded-md border";
const DATASET_CARD_BADGE_AUTHOR = cn(DATASET_CARD_BADGE, "bg-muted/50 italic");

type DatasetBrowsePagination = {
  page: number;
  pageSize: number;
  pathname: string;
};

export type { DatasetBrowsePagination };

type DatasetBrowseProps = {
  canCreate: boolean;
  datasets: DatasetCatalogueEntry[];
  generatedAt: string;
  starredDatasetIds?: string[];
  kicker?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  /** Total entries (use when paginating and `datasets` is only one page slice). */
  totalCount?: number;
  pagination?: DatasetBrowsePagination;
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

function browsePageHref(pathname: string, pageNum: number) {
  return pageNum <= 1 ? pathname : `${pathname}?page=${pageNum}`;
}

type PagePiece = number | "ellipsis";

function paginationPieces(current: number, totalPages: number): PagePiece[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const innerLeft = Math.max(2, current - 1);
  const innerRight = Math.min(totalPages - 1, current + 1);
  const out: PagePiece[] = [1];
  if (innerLeft > 2) out.push("ellipsis");
  for (let p = innerLeft; p <= innerRight; p++) out.push(p);
  if (innerRight < totalPages - 1) out.push("ellipsis");
  if (totalPages > 1) out.push(totalPages);
  return out;
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
  totalCount,
  pagination,
}: DatasetBrowseProps) {
  const generatedLabel = formatGeneratedAt(generatedAt);
  const starred = new Set(starredDatasetIds);
  const indexedTotal = totalCount ?? datasets.length;
  const subtitle =
    description ??
    `${indexedTotal} ${
      indexedTotal === 1 ? "entry" : "entries"
    } sorted A-Z. Refreshed from the repository when you open this page.`;

  let paginationBlock: ReactNode = null;
  if (pagination && indexedTotal > pagination.pageSize) {
    const totalPages = Math.ceil(indexedTotal / pagination.pageSize);
    const clampedPage = Math.min(Math.max(1, pagination.page), Math.max(1, totalPages));
    const pieces = paginationPieces(clampedPage, totalPages);

    paginationBlock = (
      <Pagination className="mt-4">
        <PaginationContent className="flex-wrap justify-center gap-1">
          <PaginationItem>
            {clampedPage > 1 ? (
              <PaginationPrevious
                href={browsePageHref(pagination.pathname, clampedPage - 1)}
              />
            ) : (
              <span
                aria-disabled="true"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "default" }),
                  "pointer-events-none opacity-40 pl-1.5!",
                )}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                <span className="hidden sm:block">Previous</span>
              </span>
            )}
          </PaginationItem>

          {pieces.map((piece, idx) =>
            piece === "ellipsis" ? (
              <PaginationItem key={`e-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={piece}>
                <PaginationLink
                  href={browsePageHref(pagination.pathname, piece)}
                  isActive={piece === clampedPage}
                  size="icon"
                >
                  {piece}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            {clampedPage < totalPages ? (
              <PaginationNext
                href={browsePageHref(pagination.pathname, clampedPage + 1)}
              />
            ) : (
              <span
                aria-disabled="true"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "default" }),
                  "pointer-events-none opacity-40 pr-1.5!",
                )}
              >
                <span className="hidden sm:block">Next</span>
                <ChevronRightIcon data-icon="inline-end" />
              </span>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-7 pb-16">
        <DatasetEditorPageHeader
          kicker={kicker}
          title={title}
          subtitle={subtitle}
          subtitleClassName="max-w-[42rem]"
          footnote={<>Index generated {generatedLabel}</>}
          actions={
            <>
              <Link
                href="/datasets/search"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  ACTION_LINK_CLASSES,
                  "border border-input bg-background hover:bg-muted/60",
                  "h-10 min-h-10",
                )}
              >
                <SearchIcon data-icon="inline-start" aria-hidden />
                Search
              </Link>
              {canCreate ? (
                <Link
                  href="/datasets/new"
                  className={cn(
                    ACTION_LINK_CLASSES,
                    "h-10 min-h-10 border border-transparent font-medium text-white transition-[background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] active:translate-y-px",
                    "bg-[#C4674F] hover:border-transparent hover:bg-[#B85A43] hover:shadow-[0_2px_8px_rgba(196,103,79,0.30)]",
                    "focus-visible:border-[#C4674F] focus-visible:ring-2 focus-visible:ring-[#C4674F]/35",
                  )}
                >
                  <PlusIcon data-icon="inline-start" aria-hidden />
                  New dataset
                </Link>
              ) : null}
            </>
          }
        />

        {datasets.length === 0 ? (
          <div className="w-full rounded-2xl border border-border/40 bg-card px-5 py-10 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[length:var(--text-sm)] text-muted-foreground">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <>
            <ul className="flex w-full flex-col gap-1.5">
              {datasets.map((dataset) => {
                const footerLine = [dataset.id, dataset.anatomy, scaleLabel(dataset)]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={dataset.id}>
                  <div
                    className={cn(
                      "relative rounded-2xl border border-border/40 bg-card outline-none shadow-[0_1px_4px_rgba(0,0,0,0.03)]",
                      "transition-[border-color,box-shadow,transform] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)]",
                      "hover:-translate-y-px hover:border-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                      "group",
                    )}
                  >
                    <Link
                      href={`/datasets/${dataset.id}`}
                      className="flex w-full flex-col gap-3 rounded-2xl py-5 px-5 pr-12 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex min-w-0 grow items-start gap-3">
                          <DatabaseIcon
                            className="mt-0.5 size-4 shrink-0 text-brand"
                            aria-hidden
                          />
                          <h2 className="line-clamp-2 min-w-0 text-base font-medium text-foreground">
                            {dataset.name}
                          </h2>
                        </div>
                        <div className="flex flex-wrap content-start gap-1.5">
                          <Badge variant="outline" className={DATASET_CARD_BADGE}>
                            {dataset.modality}
                          </Badge>
                          <Badge variant="outline" className={DATASET_CARD_BADGE}>
                            {dataset.task}
                          </Badge>
                          <Badge variant="outline" className={DATASET_CARD_BADGE}>
                            {dataset.access_level}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              DATASET_CARD_BADGE_AUTHOR,
                              "max-w-full truncate",
                            )}
                          >
                            By {dataset.created_by}
                          </Badge>
                        </div>
                      </div>
                      {dataset.short_description ? (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/70">
                          {dataset.short_description}
                        </p>
                      ) : null}
                      <div
                        className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground/50"
                        title={footerLine}
                      >
                        <span className="line-clamp-1 min-w-0">{footerLine}</span>
                      </div>
                    </Link>
                    <DatasetStarButton
                      datasetId={dataset.id}
                      initialStarred={starred.has(dataset.id)}
                      className="absolute top-5 right-4 size-8"
                    />
                  </div>
                </li>
                );
              })}
            </ul>
            {paginationBlock}
          </>
        )}
      </section>
    </main>
  );
}
