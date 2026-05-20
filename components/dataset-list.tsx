"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AsteriskIcon, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DatasetFilterAtlas } from "@/components/dataset-filter-atlas";
import { DatasetStarButton } from "@/components/dataset-star-button";
import { MedicalIcon, type MedicalIconName } from "@/components/medical-icon";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ClassificationVocabularyDoc } from "@/lib/catalogue/classification-vocabulary";
import { vocabularyLabel } from "@/lib/catalogue/classification-vocabulary";
import {
  datasetMatchesFilters,
  emptyDatasetFilters,
  formatAnatomyTagLabel,
  getActiveFilterCount,
  getDatasetAnnotationTypes,
  getDatasetAnatomyTags,
  getDatasetBodyRegions,
  type DatasetFilterState,
} from "@/lib/catalogue/filters";
import { useLiveCatalogueIndex } from "@/lib/catalogue/use-live-catalogue-index";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

const TYPING_WORDS = ["segmentation", "classification", "detection"] as const;

type DatasetListProps = {
  datasets: DatasetCatalogueEntry[];
  generatedAt: string;
  classificationVocabulary: ClassificationVocabularyDoc;
  starredDatasetIds?: string[];
};

function scaleLabel(dataset: DatasetCatalogueEntry) {
  const parts = [
    dataset.n_patients != null ? `${dataset.n_patients} patients` : null,
    dataset.n_studies != null ? `${dataset.n_studies} studies` : null,
    dataset.n_images != null ? `${dataset.n_images} images` : null,
    dataset.dimensionality,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Metadata entry";
}

function formatGeneratedAt(iso: string) {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) {
    return iso;
  }

  return `${time.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

function modalityIcon(dataset: DatasetCatalogueEntry): MedicalIconName {
  switch (dataset.modality) {
    case "XRay":
      return "xray";
    case "ultrasound":
      return "ultrasound";
    case "microscopy":
      return "microscope";
    case "pathology":
      return "tissue";
    case "mixed":
      return "integratedResearch";
    default:
      return "radiology";
  }
}

function primaryBodyLabel(
  dataset: DatasetCatalogueEntry,
  vocabulary: ClassificationVocabularyDoc,
) {
  const [region] = getDatasetBodyRegions(dataset, vocabulary);
  return region ? vocabularyLabel(vocabulary, "body_region", region) : "Anatomy";
}

function primaryAnnotationLabel(
  dataset: DatasetCatalogueEntry,
  vocabulary: ClassificationVocabularyDoc,
) {
  const [annotation] = getDatasetAnnotationTypes(dataset);
  return annotation
    ? vocabularyLabel(vocabulary, "annotation_type", annotation)
    : "Annotation";
}

function metadataBadges(
  dataset: DatasetCatalogueEntry,
  vocabulary: ClassificationVocabularyDoc,
) {
  return [
    vocabularyLabel(vocabulary, "modality", dataset.modality),
    vocabularyLabel(vocabulary, "task", dataset.task),
    primaryAnnotationLabel(dataset, vocabulary),
    primaryBodyLabel(dataset, vocabulary),
    vocabularyLabel(vocabulary, "access_level", dataset.access_level),
    dataset.dimensionality
      ? vocabularyLabel(vocabulary, "dimensionality", dataset.dimensionality)
      : null,
    dataset.status
      ? vocabularyLabel(vocabulary, "status", dataset.status)
      : null,
  ].filter((value): value is string => Boolean(value));
}

function TypingDatasetTitle() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(TYPING_WORDS[0].length);
  const [deleting, setDeleting] = useState(true);
  const [done, setDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || done) {
      return;
    }

    const word = TYPING_WORDS[wordIndex];
    const atFullWord = !deleting && visibleLength === word.length;
    const atEmptyWord = deleting && visibleLength === 0;
    const delay = atFullWord ? 1200 : atEmptyWord ? 260 : deleting ? 45 : 88;

    const timeout = window.setTimeout(() => {
      if (atFullWord) {
        setDeleting(true);
        return;
      }

      if (atEmptyWord) {
        if (wordIndex === TYPING_WORDS.length - 1) {
          setDone(true);
          return;
        }

        setWordIndex((current) => current + 1);
        setDeleting(false);
        return;
      }

      setVisibleLength((length) => length + (deleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [deleting, done, reducedMotion, visibleLength, wordIndex]);

  const word = reducedMotion || done
    ? ""
    : TYPING_WORDS[wordIndex].slice(0, visibleLength);
  const showTyping = !reducedMotion && !done;

  return (
    <h1
      className="ui-hero-title inline-flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 whitespace-normal sm:flex-nowrap sm:whitespace-nowrap"
      aria-label="Find a dataset"
    >
      <span aria-hidden>Find a</span>
      {showTyping ? (
        <span className="inline-flex items-baseline text-brand-text" aria-hidden>
          <span>{word}</span>
          <span className="typing-caret ml-1 inline-block h-[0.82em] w-px translate-y-[0.08em] bg-brand" />
        </span>
      ) : null}
      <span aria-hidden>dataset</span>
    </h1>
  );
}

export function DatasetList({
  datasets: initialDatasets,
  generatedAt: initialGeneratedAt,
  classificationVocabulary: initialVocabulary,
  starredDatasetIds = [],
}: DatasetListProps) {
  const { datasets, generatedAt } = useLiveCatalogueIndex(
    initialDatasets,
    initialGeneratedAt,
  );
  const [query, setQuery] = useState("");
  const [filterExcludeMode, setFilterExcludeMode] = useState(false);
  const [filters, setFilters] = useState<DatasetFilterState>({
    ...emptyDatasetFilters,
  });
  const [vocabulary, setVocabulary] =
    useState<ClassificationVocabularyDoc>(initialVocabulary);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/datasets/search") return;

    let cancelled = false;
    router.refresh();

    void (async () => {
      const res = await fetch("/api/catalogue/classification", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok || cancelled) return;
      const body: unknown = await res.json().catch(() => null);
      if (
        cancelled ||
        !body ||
        typeof body !== "object" ||
        !("vocabulary" in body)
      ) {
        return;
      }
      const next = (body as { vocabulary: ClassificationVocabularyDoc })
        .vocabulary;
      if (next?.fields) setVocabulary(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  function handleExcludeModeChange(next: boolean) {
    setFilterExcludeMode(next);
    setFilters({ ...emptyDatasetFilters });
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#catalogue-search") return;
    document.getElementById("catalogue-search")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    window.setTimeout(() => {
      document.getElementById("dataset-search")?.focus();
    }, 180);
  }, []);

  const filtered = useMemo(() => {
    return datasets.filter((dataset) =>
      datasetMatchesFilters(
        dataset,
        filters,
        query,
        {
          excludeMode: filterExcludeMode,
        },
        vocabulary,
      ),
    );
  }, [
    datasets,
    filters,
    query,
    filterExcludeMode,
    vocabulary,
  ]);

  const trimmedQuery = query.trim();
  const showResults =
    trimmedQuery.length > 0 || getActiveFilterCount(filters) > 0;

  const generatedLabel = useMemo(() => formatGeneratedAt(generatedAt), [generatedAt]);
  const starred = useMemo(
    () => new Set(starredDatasetIds),
    [starredDatasetIds],
  );

  return (
    <main className="flex flex-1 flex-col px-4 py-10 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center">
        <div className="flex min-h-[32vh] w-full flex-col items-center justify-end gap-9 pb-8 pt-8">
          <div className="flex w-full items-center justify-center text-center">
            <div className="relative inline-block">
              <AsteriskIcon
                className="absolute top-1/2 right-full mr-5 size-12 -translate-y-1/2 text-brand sm:size-14"
                aria-hidden
              />
              <TypingDatasetTitle />
            </div>
          </div>

          <FieldGroup
            id="catalogue-search"
            className="claude-composer w-full max-w-[72rem] gap-6 p-7"
          >
            <Field className="gap-0 border-b border-border/40 pb-6">
              <FieldLabel htmlFor="dataset-search" className="sr-only">
                Search datasets
              </FieldLabel>
              <div className="-ml-3 flex min-h-[3.25rem] items-center gap-3 border-l-2 border-transparent pl-3 transition-[border-color] duration-150 focus-within:border-[#C4674F]">
                <Search
                  aria-hidden
                  className="size-[1.2rem] shrink-0 translate-y-[0.04em] text-muted-foreground"
                  strokeWidth={1.75}
                />
                <Input
                  id="dataset-search"
                  type="search"
                  placeholder="Search CT abdomen voxel masks, brain MRI labels, public lung datasets..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  className="h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-[length:var(--text-lg)] leading-snug shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-[length:var(--text-lg)]"
                />
              </div>
            </Field>

            <DatasetFilterAtlas
              datasets={datasets}
              filters={filters}
              excludeMode={filterExcludeMode}
              query={query}
              resultCount={filtered.length}
              totalCount={datasets.length}
              classificationVocabulary={vocabulary}
              onExcludeModeChange={handleExcludeModeChange}
              onFiltersChange={setFilters}
            />
          </FieldGroup>
        </div>

        <div className="w-full max-w-[72rem] pb-16">
          {showResults ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-4 px-1">
                <p className="text-[length:var(--text-sm)] text-muted-foreground">
                  Catalogue results
                </p>
                <p className="hidden text-[length:var(--text-xs)] text-muted-foreground sm:block">
                  Index generated {generatedLabel}
                </p>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
                  <p className="text-[length:var(--text-sm)] text-muted-foreground">
                    No datasets match the current search or filters.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filtered.map((dataset, index) => (
                    <li
                      key={dataset.id}
                      className="dataset-row-enter"
                      style={{ "--row-index": index } as CSSProperties}
                    >
                      <div
                        className={cn(
                          "group relative rounded-2xl border border-transparent bg-transparent outline-none",
                          "transition-[background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)]",
                          "hover:-translate-y-px hover:border-border hover:bg-card hover:shadow-[var(--shadow-soft)]",
                        )}
                      >
                        <Link
                          href={`/datasets/${dataset.id}`}
                          className="flex flex-col gap-3 rounded-2xl px-4 py-3.5 pr-12 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-3">
                              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border border-border-subtle bg-secondary text-brand">
                                <MedicalIcon name={modalityIcon(dataset)} />
                              </span>
                              <div className="min-w-0">
                                <h2 className="truncate text-[length:var(--text-base)] font-medium text-foreground">
                                  {dataset.name}
                                </h2>
                                <p className="mt-1 line-clamp-2 text-[length:var(--text-sm)] leading-relaxed text-muted-foreground">
                                  {dataset.short_description}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-1.5 sm:max-w-[20rem] sm:justify-end">
                              {metadataBadges(dataset, vocabulary).map((label, badgeIndex) => (
                                <Badge
                                  key={`${dataset.id}-${label}`}
                                  variant={badgeIndex === 0 ? "secondary" : "outline"}
                                >
                                  {label}
                                </Badge>
                              ))}
                              <Badge variant="outline">By {dataset.created_by}</Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 text-[length:var(--text-xs)] text-muted-foreground">
                            <span className="font-mono text-foreground/80">{dataset.id}</span>
                            <span>
                              {getDatasetAnatomyTags(dataset)
                                .map(formatAnatomyTagLabel)
                                .join(", ")}
                            </span>
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
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
