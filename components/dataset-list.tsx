"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AsteriskIcon,
  DatabaseIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DatasetStarButton } from "@/components/dataset-star-button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AccessLevel,
  DatasetCatalogueEntry,
  Modality,
  Task,
} from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const TYPING_WORDS = ["segmentation", "classification", "detection"] as const;

type DatasetListProps = {
  datasets: DatasetCatalogueEntry[];
  generatedAt: string;
  starredDatasetIds?: string[];
};

type SelectOption = {
  label: string;
  value: string;
};

function selectOptions<T extends string>(values: T[], allLabel: string): SelectOption[] {
  return [
    { label: allLabel, value: ALL },
    ...values.map((value) => ({ label: value, value })),
  ];
}

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
  if (Number.isNaN(time.getTime())) {
    return iso;
  }

  return `${time.toISOString().slice(0, 19).replace("T", " ")} UTC`;
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
  datasets,
  generatedAt,
  starredDatasetIds = [],
}: DatasetListProps) {
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState<string>(ALL);
  const [task, setTask] = useState<string>(ALL);
  const [access, setAccess] = useState<string>(ALL);

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

  const modalityOptions = useMemo(
    () =>
      Array.from(new Set(datasets.map((d) => d.modality))).sort() as Modality[],
    [datasets],
  );
  const taskOptions = useMemo(
    () => Array.from(new Set(datasets.map((d) => d.task))).sort() as Task[],
    [datasets],
  );
  const accessOptions = useMemo(
    () =>
      Array.from(new Set(datasets.map((d) => d.access_level))).sort() as AccessLevel[],
    [datasets],
  );

  const modalityItems = useMemo(
    () => selectOptions(modalityOptions, "All modalities"),
    [modalityOptions],
  );
  const taskItems = useMemo(
    () => selectOptions(taskOptions, "All tasks"),
    [taskOptions],
  );
  const accessItems = useMemo(
    () => selectOptions(accessOptions, "All access"),
    [accessOptions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return datasets.filter((dataset) => {
      if (modality !== ALL && dataset.modality !== modality) return false;
      if (task !== ALL && dataset.task !== task) return false;
      if (access !== ALL && dataset.access_level !== access) return false;
      if (!q) return true;
      const blob =
        `${dataset.id} ${dataset.name} ${dataset.short_description} ${dataset.anatomy} ${dataset.task}`.toLowerCase();
      return blob.includes(q);
    });
  }, [datasets, query, modality, task, access]);

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
            className="claude-composer w-full max-w-[55rem] gap-0 p-5 sm:p-6"
          >
            <Field className="gap-0">
              <FieldLabel htmlFor="dataset-search" className="sr-only">
                Search datasets
              </FieldLabel>
              <div className="flex min-h-20 items-start gap-4 pt-0.5">
                <SearchIcon className="mt-0.5 size-6 shrink-0 text-muted-foreground" aria-hidden />
                <Input
                  id="dataset-search"
                  type="search"
                  placeholder="Search datasets by name, anatomy, task..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  className="h-auto border-0 bg-transparent px-0 py-0 text-[length:var(--text-lg)] leading-[1.25] shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-[length:var(--text-lg)]"
                />
              </div>
            </Field>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[length:var(--text-sm)] text-muted-foreground">
                <PlusIcon className="size-5" aria-hidden />
                <span>
                  {filtered.length === datasets.length
                    ? `${datasets.length} datasets`
                    : `${filtered.length} of ${datasets.length} shown`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SlidersHorizontalIcon className="hidden size-5 text-muted-foreground sm:block" aria-hidden />
                <Select
                  items={modalityItems}
                  value={modality}
                  onValueChange={(value) => setModality(value ?? ALL)}
                >
                  <SelectTrigger aria-label="Filter by modality" className="w-[10rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {modalityItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  items={taskItems}
                  value={task}
                  onValueChange={(value) => setTask(value ?? ALL)}
                >
                  <SelectTrigger aria-label="Filter by task" className="w-[8.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {taskItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  items={accessItems}
                  value={access}
                  onValueChange={(value) => setAccess(value ?? ALL)}
                >
                  <SelectTrigger aria-label="Filter by access level" className="w-[8.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {accessItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FieldGroup>
        </div>

        <div className="w-full max-w-[55rem] pb-16">
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
              {filtered.map((dataset) => (
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
                      className="flex flex-col gap-3 rounded-2xl px-4 py-3 pr-12 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <DatabaseIcon className="size-4 shrink-0 text-brand" aria-hidden />
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
                          <Badge variant="outline">By {dataset.created_by}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--text-xs)] text-muted-foreground">
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
        </div>
      </section>
    </main>
  );
}
