"use client";

import { useMemo, useState } from "react";
import { ChevronDown, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react";

import { getFilterChipIcon } from "@/components/filter-chip-icon";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ClassificationVocabularyDoc } from "@/lib/catalogue/classification-vocabulary";
import {
  accessFilterPairs,
  annotationFilterPairs,
  bodyRegionFilterPairs,
  dimensionalityFilterPairs,
  emptyDatasetFilters,
  getActiveFilterCount,
  getAnatomyFilterOptions,
  getFilterOptionCount,
  modalityFilterPairs,
  longitudinalFilterOptions,
  scaleFilterOptions,
  statusFilterPairs,
  taskFilterPairs,
  type DatasetFilterState,
  type FilterGroupId,
  type FilterMatchOptions,
  type FilterOption,
} from "@/lib/catalogue/filters";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

type DatasetFilterAtlasProps = {
  datasets: DatasetCatalogueEntry[];
  filters: DatasetFilterState;
  excludeMode?: boolean;
  query: string;
  resultCount: number;
  totalCount: number;
  classificationVocabulary: ClassificationVocabularyDoc;
  onExcludeModeChange?: (excludeMode: boolean) => void;
  onFiltersChange: (filters: DatasetFilterState) => void;
};

const GROUP_BLUEPRINT = [
  { id: "modalities" as const, title: "Modality", optionsKey: "modality" as const },
  { id: "bodyRegions" as const, title: "Body map", optionsKey: "body_region" as const },
  { id: "annotationTypes" as const, title: "Annotation", optionsKey: null },
  { id: "tasks" as const, title: "Research task", optionsKey: "task" as const },
  { id: "accessLevels" as const, title: "Access", optionsKey: "access_level" as const },
  {
    id: "dimensionalities" as const,
    title: "Shape",
    optionsKey: "dimensionality" as const,
  },
  { id: "statuses" as const, title: "Lifecycle", optionsKey: "status" as const },
  { id: "longitudinal" as const, title: "Study design", optionsKey: null },
  { id: "scale" as const, title: "Scale", optionsKey: null },
];

type FilterGroupSpec = {
  id: FilterGroupId;
  title: string;
  options: FilterOption[];
  /** Vocabulary-driven groups show every term even with zero matching datasets. */
  showAllVocabularyOptions?: boolean;
};

type BlueprintRow = (typeof GROUP_BLUEPRINT)[number];

function resolveBlueprintOptions(
  vocabulary: ClassificationVocabularyDoc | undefined,
  row: BlueprintRow,
): FilterOption[] {
  if (row.id === "scale") return scaleFilterOptions;
  if (row.id === "longitudinal") return longitudinalFilterOptions;
  if (row.id === "annotationTypes") return annotationFilterPairs(vocabulary);
  if (!row.optionsKey) return [];
  switch (row.optionsKey) {
    case "modality":
      return modalityFilterPairs(vocabulary);
    case "body_region":
      return bodyRegionFilterPairs(vocabulary);
    case "task":
      return taskFilterPairs(vocabulary);
    case "access_level":
      return accessFilterPairs(vocabulary);
    case "status":
      return statusFilterPairs(vocabulary);
    case "dimensionality":
      return dimensionalityFilterPairs(vocabulary);
    default:
      return [];
  }
}

function replaceFilterValues(
  filters: DatasetFilterState,
  id: FilterGroupId,
  values: string[],
) {
  return {
    ...filters,
    [id]: values,
  };
}

function normalizeFilterSignature(filters: DatasetFilterState) {
  return (Object.keys(filters) as FilterGroupId[])
    .map((k) => `${k}:${[...filters[k]].slice().sort().join(",")}`)
    .sort()
    .join("|");
}

/**
 * Inclusion: select every rendered chip whose marginal count is > 0 (hypothetical
 * lone selection in group, mirrored by `getFilterOptionCount`).
 *
 * Exclude mode: same marginal semantics — union of exclusions that still narrow the
 * text-matched corpus when hypothetically excluding only that chip; combining them
 * is the user's responsibility (interaction can shrink to zero rows).
 */
function selectAllWithPositiveMargins(
  datasets: DatasetCatalogueEntry[],
  filters: DatasetFilterState,
  query: string,
  opts: FilterMatchOptions,
  groups: FilterGroupSpec[],
  vocabulary: ClassificationVocabularyDoc,
): DatasetFilterState {
  const next = { ...emptyDatasetFilters };

  function pickPositive(groupId: FilterGroupId, options: FilterOption[]) {
    const values: string[] = [];
    for (const opt of options) {
      if (
        getFilterOptionCount(
          datasets,
          filters,
          groupId,
          opt.value,
          query,
          opts,
          vocabulary,
        ) > 0
      ) {
        values.push(opt.value);
      }
    }
    next[groupId] = values;
  }

  for (const g of groups) {
    if (g.options.length > 0) pickPositive(g.id, g.options);
  }

  return next;
}

function sanitizeSelection(
  nextValues: string[],
  prevSelected: string[],
  datasets: DatasetCatalogueEntry[],
  filters: DatasetFilterState,
  groupId: FilterGroupId,
  query: string,
  matchOpts: FilterMatchOptions,
  vocabulary: ClassificationVocabularyDoc,
  allowZeroCount = false,
) {
  return nextValues.filter((value) => {
    if (prevSelected.includes(value)) return true;
    if (allowZeroCount) return true;
    return (
      getFilterOptionCount(
        datasets,
        filters,
        groupId,
        value,
        query,
        matchOpts,
        vocabulary,
      ) > 0
    );
  });
}

function sameFilters(a: DatasetFilterState, b: DatasetFilterState) {
  return (Object.keys(a) as FilterGroupId[]).every(
    (key) => a[key].length === b[key].length,
  );
}

function ToggleRow({
  datasets,
  filters,
  groupId,
  options,
  query,
  excludeMode,
  ariaLabel,
  onFiltersChange,
  vocabulary,
  showAllVocabularyOptions = false,
}: {
  datasets: DatasetCatalogueEntry[];
  filters: DatasetFilterState;
  groupId: FilterGroupId;
  options: FilterOption[];
  query: string;
  excludeMode: boolean;
  ariaLabel: string;
  onFiltersChange: (filters: DatasetFilterState) => void;
  vocabulary: ClassificationVocabularyDoc;
  showAllVocabularyOptions?: boolean;
}) {
  if (options.length === 0) return null;

  const matchOpts: FilterMatchOptions = { excludeMode };

  return (
    <ToggleGroup
      multiple
      aria-label={ariaLabel}
      className="flex w-full flex-wrap gap-2"
      value={filters[groupId]}
      onValueChange={(values) =>
        onFiltersChange(
          replaceFilterValues(
            filters,
            groupId,
            sanitizeSelection(
              values,
              filters[groupId],
              datasets,
              filters,
              groupId,
              query,
              matchOpts,
              vocabulary,
              showAllVocabularyOptions,
            ),
          ),
        )
      }
    >
      {options.map((option) => {
        const prevSelected = filters[groupId];
        const selected = prevSelected.includes(option.value);
        const count = getFilterOptionCount(
          datasets,
          filters,
          groupId,
          option.value,
          query,
          matchOpts,
          vocabulary,
        );
        const unavailable =
          !showAllVocabularyOptions && count === 0 && !selected;
        const chipAriaDesc = excludeMode
          ? `${count} datasets remain if excluding only this chip in its group (other exclusions unchanged)`
          : `${count} matching datasets`;
        const icon = getFilterChipIcon(groupId, option.value);
        const chipTone = unavailable
          ? "opacity-35 pointer-events-none [&_svg]:text-current"
          : "opacity-100";
        const selectedTone =
          "aria-pressed:bg-[#C4674F]/12 aria-pressed:border-[#C4674F]/40 aria-pressed:text-[#C4674F] aria-pressed:shadow-none data-[pressed]:border-[#C4674F]/40 data-[pressed]:bg-[#C4674F]/12 data-[pressed]:text-[#C4674F] data-[state=on]:border-[#C4674F]/40 data-[state=on]:bg-[#C4674F]/12 data-[state=on]:text-[#C4674F] data-[state=on]:shadow-none";
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            tabIndex={unavailable ? -1 : undefined}
            aria-disabled={unavailable || undefined}
            aria-label={`${option.label}, ${chipAriaDesc}`}
            className={cn(
              "group/chip flex h-[34px] items-center rounded-full border border-border/60 bg-transparent px-3.5 text-[13px] text-foreground/80 shadow-none",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 hover:bg-muted/60",
              "transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 enabled:active:scale-[0.97]",
              selectedTone,
              chipTone,
            )}
          >
            {icon}
            <span>{option.label}</span>
            <span
              className={cn(
                "ml-1 tabular-nums text-[10px] font-normal text-muted-foreground/60",
                selected && "text-[#C4674F]/80",
              )}
            >
              {count}
            </span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

function FilterGroup({
  datasets,
  filters,
  group,
  query,
  excludeMode,
  onFiltersChange,
  vocabulary,
}: {
  datasets: DatasetCatalogueEntry[];
  filters: DatasetFilterState;
  group: FilterGroupSpec;
  query: string;
  excludeMode: boolean;
  onFiltersChange: (filters: DatasetFilterState) => void;
  vocabulary: ClassificationVocabularyDoc;
}) {
  if (group.options.length === 0) return null;

  return (
    <FieldSet className="gap-2.5">
      <FieldLegend
        variant="label"
        className="mb-2.5 w-full min-w-0 px-0"
      >
        <span className="inline-block border-l-2 border-[#C4674F]/60 pl-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
          {group.title}
        </span>
      </FieldLegend>
      <ToggleRow
        ariaLabel={`${group.title} filters`}
        datasets={datasets}
        filters={filters}
        excludeMode={excludeMode}
        groupId={group.id}
        options={group.options}
        query={query}
        vocabulary={vocabulary}
        showAllVocabularyOptions={group.showAllVocabularyOptions}
        onFiltersChange={onFiltersChange}
      />
    </FieldSet>
  );
}

export function DatasetFilterAtlas({
  datasets,
  filters,
  excludeMode = false,
  query,
  resultCount,
  totalCount,
  classificationVocabulary,
  onExcludeModeChange,
  onFiltersChange,
}: DatasetFilterAtlasProps) {
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const open = pinnedOpen || hoverExpanded;

  const primarySpecs = useMemo<FilterGroupSpec[]>(
    () =>
      GROUP_BLUEPRINT.map((row) => ({
        id: row.id,
        title: row.title,
        options: resolveBlueprintOptions(classificationVocabulary, row),
        showAllVocabularyOptions: true,
      })),
    [classificationVocabulary],
  );

  const anatomyOptions = getAnatomyFilterOptions(datasets);
  const activeCount = getActiveFilterCount(filters);

  const groups: FilterGroupSpec[] = useMemo(() => {
    if (anatomyOptions.length === 0) return primarySpecs;
    return [
      ...primarySpecs.slice(0, 2),
      {
        id: "anatomyTags" as const,
        title: "Organs",
        options: anatomyOptions,
      },
      ...primarySpecs.slice(2),
    ];
  }, [anatomyOptions, primarySpecs]);

  const matchOpts: FilterMatchOptions = { excludeMode };

  const selectAllDraft = selectAllWithPositiveMargins(
    datasets,
    filters,
    query,
    matchOpts,
    groups,
    classificationVocabulary,
  );
  const selectAllEmpty = getActiveFilterCount(selectAllDraft) === 0;
  const selectAllUnchanged =
    normalizeFilterSignature(selectAllDraft) === normalizeFilterSignature(filters);

  const filtersAreEmpty =
    activeCount === 0 && sameFilters(filters, emptyDatasetFilters);

  const countWord = resultCount === 1 ? "dataset" : "datasets";

  const countSummary =
    resultCount === totalCount
      ? `${resultCount} ${countWord}`
      : `${resultCount} of ${totalCount} shown`;

  return (
    <div
      className="-mx-1 flex flex-col"
      onMouseEnter={() => setHoverExpanded(true)}
      onMouseLeave={() => setHoverExpanded(false)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          id="filter-atlas-toggle"
          aria-label="Catalogue filters"
          aria-expanded={open}
          aria-controls="filter-atlas-panel"
          onClick={(e) => {
            e.preventDefault();
            setPinnedOpen((p) => !p);
          }}
          title={
            pinnedOpen
              ? "Collapse filters"
              : "Pin filters open (stays expanded without hover)"
          }
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[#C4674F]/55 text-[#C4674F]",
            "bg-[#C4674F]/08",
            "outline-none transition-[transform,background-color,border-color] duration-150",
            "hover:border-[#C4674F]/72 hover:bg-[#C4674F]/12",
            "focus-visible:border-[#C4674F] focus-visible:ring-2 focus-visible:ring-ring/35",
          )}
        >
          <ChevronDown
            aria-hidden
            strokeWidth={2.25}
            className={cn(
              "size-5 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none",
              open ? "rotate-180" : "rotate-0",
            )}
          />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="text-[length:var(--text-sm)] font-medium text-foreground tracking-tight">
            Filters
          </p>
          <span className="text-muted-foreground/40" aria-hidden>
            –
          </span>
          <p className="min-w-0 truncate text-[length:var(--text-sm)] text-muted-foreground">
            {excludeMode ? "Exclude mode · " : ""}
            {activeCount > 0 ? `${activeCount} active · ${countSummary}` : countSummary}
          </p>
        </div>
      </div>

      <div
        id="filter-atlas-panel"
        aria-hidden={!open}
        className={cn(
          "grid overflow-hidden motion-reduce:transition-none motion-reduce:duration-150",
          "transition-[grid-template-rows,margin-top] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
          open ? "mt-6 grid-rows-[1fr]" : "mt-0 grid-rows-[0fr]",
          !open && "pointer-events-none",
        )}
      >
        <div className="min-h-0 overflow-hidden opacity-100">
            <div className="flex flex-col gap-6 pb-px pt-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[length:var(--text-sm)] text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded-full border border-border-subtle bg-secondary text-brand">
                  <SlidersHorizontalIcon className="size-4" aria-hidden />
                </span>
                <span>
                  {resultCount === totalCount ? (
                    <>
                      <span
                        key={resultCount}
                        className="filter-count-fade inline-block animate-in fade-in duration-150"
                      >
                        {resultCount}
                      </span>{" "}
                      {countWord}
                    </>
                  ) : (
                    <>
                      <span
                        key={resultCount}
                        className="filter-count-fade inline-block animate-in fade-in duration-150"
                      >
                        {resultCount}
                      </span>{" "}
                      <span className="font-normal opacity-85">of {totalCount}</span>{" "}
                      shown
                    </>
                  )}
                </span>
                {activeCount > 0 ? (
                  <span className="rounded-full border border-brand/25 bg-brand-soft px-2 py-0.5 text-[length:var(--text-xs)] text-brand-text">
                    {activeCount} active
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={
                    excludeMode
                      ? "Select all exclusion chips with marginal count greater than zero"
                      : "Select all filter chips with marginal count greater than zero"
                  }
                  disabled={selectAllEmpty || selectAllUnchanged}
                  className={cn(
                    "h-8 rounded-md border-border/65 bg-transparent px-2.5 text-xs font-normal text-muted-foreground shadow-none",
                    "hover:border-[#C4674F]/45 hover:bg-[#C4674F]/06 hover:text-foreground",
                    "hover:!translate-y-0 active:!translate-y-0",
                    "disabled:opacity-45",
                  )}
                  onClick={() => onFiltersChange(selectAllDraft)}
                >
                  Select all
                </Button>
                {onExcludeModeChange ? (
                  <button
                    type="button"
                    aria-pressed={excludeMode}
                    aria-label={
                      excludeMode
                        ? "Exclude mode on; selected chips subtract from text-matched results. Click to switch to inclusion mode."
                        : "Exclude mode off; chips include matches. Turn on to exclude selected values instead."
                    }
                    className={cn(
                      "inline-flex h-8 items-center rounded-md border border-border/65 px-2.5 text-xs font-normal text-muted-foreground outline-none transition-colors",
                      "hover:border-[#C4674F]/45 hover:bg-[#C4674F]/06 hover:text-foreground",
                      "focus-visible:ring-2 focus-visible:ring-ring/35",
                      excludeMode &&
                        "border-[#C4674F]/42 bg-[#C4674F]/08 text-foreground",
                    )}
                    onClick={() => onExcludeModeChange(!excludeMode)}
                  >
                    Exclude
                  </button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "group/clear h-8 gap-1.5 rounded-md border-border/65 px-2.5 text-xs font-normal shadow-none",
                    "hover:border-[#C4674F]/45 hover:bg-[#C4674F]/06 hover:text-foreground",
                    "hover:!translate-y-0 active:!translate-y-0",
                  )}
                  disabled={filtersAreEmpty}
                  onClick={() => onFiltersChange({ ...emptyDatasetFilters })}
                >
                  <RotateCcwIcon
                    className="size-3.5 transition-transform duration-300 group-hover/clear:-rotate-[25deg]"
                    data-icon="inline-start"
                  />
                  Clear
                </Button>
              </div>
            </div>
            <FieldGroup className="grid gap-6 md:grid-cols-2">
              {groups.map((group) =>
                group.options.length > 0 ? (
                  <FilterGroup
                    key={group.id}
                    datasets={datasets}
                    filters={filters}
                    excludeMode={excludeMode}
                    group={group}
                    query={query}
                    vocabulary={classificationVocabulary}
                    onFiltersChange={onFiltersChange}
                  />
                ) : null,
              )}
            </FieldGroup>
          </div>
        </div>
      </div>

    </div>
  );
}
