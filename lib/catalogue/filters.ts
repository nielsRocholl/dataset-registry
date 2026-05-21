import type { ClassificationVocabularyDoc } from "@/lib/catalogue/classification-vocabulary";
import {
  vocabularyLabel,
  vocabularyToFilterPairs,
} from "@/lib/catalogue/classification-vocabulary";
import type {
  AnnotationType,
  BodyRegion,
  DatasetCatalogueEntry,
} from "@/lib/catalogue/types";

export type FilterGroupId =
  | "modalities"
  | "bodyRegions"
  | "anatomyTags"
  | "annotationTypes"
  | "tasks"
  | "accessLevels"
  | "statuses"
  | "dimensionalities"
  | "longitudinal"
  | "scale";

export type DatasetFilterState = Record<FilterGroupId, string[]>;

/** When true: selected chips exclude matching datasets (empty group = nothing excluded); AND across groups, OR semantics within groups (mirror of inclusion). */
export type FilterMatchOptions = {
  excludeMode?: boolean;
};

export type FilterOption = {
  label: string;
  value: string;
};

export const emptyDatasetFilters: DatasetFilterState = {
  modalities: [],
  bodyRegions: [],
  anatomyTags: [],
  annotationTypes: [],
  tasks: [],
  accessLevels: [],
  statuses: [],
  dimensionalities: [],
  longitudinal: [],
  scale: [],
};

export function modalityFilterPairs(
  vocab: ClassificationVocabularyDoc | undefined,
): FilterOption[] {
  return vocabularyToFilterPairs(vocab, "modality").map(({ value, label }) => ({
    value,
    label,
  }));
}

export function bodyRegionFilterPairs(
  vocab: ClassificationVocabularyDoc | undefined,
): FilterOption[] {
  return vocabularyToFilterPairs(vocab, "body_region");
}

export function annotationFilterPairs(
  vocab: ClassificationVocabularyDoc | undefined,
): FilterOption[] {
  return [
    { label: "Any annotation", value: "any" },
    ...vocabularyToFilterPairs(vocab, "annotation_type"),
  ];
}

export function taskFilterPairs(
  vocab: ClassificationVocabularyDoc | undefined,
): FilterOption[] {
  return vocabularyToFilterPairs(vocab, "task");
}

export function accessFilterPairs(
  vocab: ClassificationVocabularyDoc | undefined,
): FilterOption[] {
  return vocabularyToFilterPairs(vocab, "access_level");
}

export function statusFilterPairs(
  vocab: ClassificationVocabularyDoc | undefined,
): FilterOption[] {
  return vocabularyToFilterPairs(vocab, "status");
}

export function dimensionalityFilterPairs(
  vocab: ClassificationVocabularyDoc | undefined,
): FilterOption[] {
  return vocabularyToFilterPairs(vocab, "dimensionality");
}

export const longitudinalFilterOptions: FilterOption[] = [
  { label: "Longitudinal / follow-up", value: "longitudinal" },
];

export const scaleFilterOptions: FilterOption[] = [
  { label: "100+ patients", value: "patients_100" },
  { label: "500+ patients", value: "patients_500" },
  { label: "100+ studies", value: "studies_100" },
  { label: "1k+ images", value: "images_1000" },
  { label: "10k+ images", value: "images_10000" },
];

/** Static fallback ordering when vocab is omitted (keywords only). */
const DEFAULT_BODY_IDS = [
  "head_neck",
  "thorax",
  "abdomen",
  "pelvis",
  "breast",
  "spine_msk",
  "whole_body",
  "tissue_cell",
  "other",
];

const BODY_REGION_KEYWORDS: Record<string, string[]> = {
  head_neck: [
    "brain",
    "ear",
    "eye",
    "head",
    "neck",
    "nose",
    "skull",
    "thyroid",
  ],
  thorax: ["cardiac", "chest", "heart", "lung", "lungs", "thoracic", "thorax"],
  abdomen: [
    "abdomen",
    "abdominal",
    "bowel",
    "colon",
    "gallbladder",
    "intestine",
    "kidney",
    "kidneys",
    "liver",
    "pancreas",
    "spleen",
    "stomach",
  ],
  pelvis: ["bladder", "pelvis", "pelvic", "prostate", "uterus"],
  breast: ["breast", "mammography"],
  spine_msk: [
    "bone",
    "joint",
    "muscle",
    "musculoskeletal",
    "msk",
    "skeleton",
    "spine",
    "vertebra",
  ],
  whole_body: ["total-body", "total body", "whole-body", "whole body"],
  tissue_cell: ["cell", "histology", "pathology", "slide", "tissue"],
  other: [],
};

function orderedBodyRegionIds(
  vocab: ClassificationVocabularyDoc | undefined,
): string[] {
  if (!vocab) return [...DEFAULT_BODY_IDS];
  const known = new Set(vocab.fields.body_region.map((t) => t.value));
  return vocab.fields.body_region.map((t) => t.value).concat(
    DEFAULT_BODY_IDS.filter((id) => !known.has(id)),
  );
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function textForMatching(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeAnatomyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatAnatomyTagLabel(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizedExplicitTags(dataset: DatasetCatalogueEntry) {
  return unique((dataset.anatomy_tags ?? []).map(normalizeAnatomyTag));
}

export function getDatasetAnatomyTags(dataset: DatasetCatalogueEntry) {
  const explicit = normalizedExplicitTags(dataset);
  if (explicit.length > 0) return explicit;
  const fallback = normalizeAnatomyTag(dataset.anatomy);
  return fallback ? [fallback] : [];
}

export function getDatasetModalities(dataset: DatasetCatalogueEntry): string[] {
  if (Array.isArray(dataset.modality)) {
    return dataset.modality.filter((m) => typeof m === "string" && m.length > 0);
  }
  return [];
}

export function getDatasetBodyRegions(
  dataset: DatasetCatalogueEntry,
  vocab?: ClassificationVocabularyDoc,
): BodyRegion[] {
  if (dataset.body_regions?.length) return dataset.body_regions;

  const haystack = textForMatching(
    [
      dataset.anatomy,
      dataset.name,
      dataset.short_description,
      ...getDatasetModalities(dataset),
      ...getDatasetAnatomyTags(dataset),
    ].join(" "),
  );
  const ids = orderedBodyRegionIds(vocab);
  const regions = ids.filter((region) =>
    (BODY_REGION_KEYWORDS[region] ?? []).some((keyword) =>
      haystack.includes(keyword),
    ),
  );

  if (
    regions.length === 0 &&
    getDatasetModalities(dataset).some(
      (m) => m === "microscopy" || m === "pathology",
    )
  ) {
    regions.push("tissue_cell");
  }

  const allowed = vocab
    ? new Set(vocab.fields.body_region.map((t) => t.value))
    : new Set(DEFAULT_BODY_IDS);
  const filtered = regions.filter((r) => allowed.has(r));
  if (filtered.length > 0) return filtered;
  const fallback =
    vocab?.fields.body_region.find((t) => t.value === "other")?.value ??
    vocab?.fields.body_region[0]?.value ??
    "other";
  return [fallback] as BodyRegion[];
}

export function getDatasetTasks(dataset: DatasetCatalogueEntry): string[] {
  if (Array.isArray(dataset.task)) {
    return dataset.task.filter((t) => typeof t === "string" && t.length > 0);
  }
  return [];
}

function inferAnnotationTypesForTask(
  task: string,
  dimensionality: DatasetCatalogueEntry["dimensionality"],
): AnnotationType[] {
  if (task === "segmentation") {
    if (dimensionality === "2D") return ["mask_2d"];
    if (dimensionality === "3D") return ["voxel_mask"];
    return ["voxel_mask", "mask_2d"];
  }
  if (task === "detection") return ["bounding_box"];
  if (task === "classification") return ["image_label", "study_label"];
  if (task === "registration" || task === "reconstruction") return ["none"];
  return ["other"];
}

export function getDatasetAnnotationTypes(
  dataset: DatasetCatalogueEntry,
): AnnotationType[] {
  if (dataset.annotation_types?.length) return dataset.annotation_types;

  const tasks = getDatasetTasks(dataset);
  if (tasks.length === 0) return ["other"];

  return unique(
    tasks.flatMap((task) =>
      inferAnnotationTypesForTask(task, dataset.dimensionality),
    ),
  );
}

function hasAnyAnnotation(dataset: DatasetCatalogueEntry) {
  return getDatasetAnnotationTypes(dataset).some((type) => type !== "none");
}

function matchesScaleValue(dataset: DatasetCatalogueEntry, value: string) {
  switch (value) {
    case "patients_100":
      return (dataset.n_patients ?? 0) >= 100;
    case "patients_500":
      return (dataset.n_patients ?? 0) >= 500;
    case "studies_100":
      return (dataset.n_studies ?? 0) >= 100;
    case "images_1000":
      return (dataset.n_images ?? 0) >= 1000;
    case "images_10000":
      return (dataset.n_images ?? 0) >= 10000;
    default:
      return false;
  }
}

function intersects(values: string[], selected: string[]) {
  return selected.length === 0 || selected.some((value) => values.includes(value));
}

function datasetMatchesGroup(
  dataset: DatasetCatalogueEntry,
  groupId: FilterGroupId,
  selected: string[],
  vocab?: ClassificationVocabularyDoc,
) {
  if (selected.length === 0) return true;

  switch (groupId) {
    case "modalities":
      return intersects(getDatasetModalities(dataset), selected);
    case "bodyRegions":
      return intersects(getDatasetBodyRegions(dataset, vocab), selected);
    case "anatomyTags":
      return intersects(getDatasetAnatomyTags(dataset), selected);
    case "annotationTypes": {
      const annotationTypes = getDatasetAnnotationTypes(dataset);
      return selected.some((value) => {
        if (value === "any") return hasAnyAnnotation(dataset);
        return annotationTypes.includes(value);
      });
    }
    case "tasks":
      return intersects(getDatasetTasks(dataset), selected);
    case "accessLevels":
      return selected.includes(dataset.access_level);
    case "statuses":
      return dataset.status ? selected.includes(dataset.status) : false;
    case "dimensionalities":
      return dataset.dimensionality
        ? selected.includes(dataset.dimensionality)
        : false;
    case "scale":
      return selected.some((value) => matchesScaleValue(dataset, value));
    case "longitudinal":
      return selected.includes("longitudinal") && dataset.is_longitudinal === true;
  }
}

export function datasetMatchesText(
  dataset: DatasetCatalogueEntry,
  query: string,
  vocab?: ClassificationVocabularyDoc,
) {
  const q = textForMatching(query);
  if (!q) return true;

  const annotationTypes = getDatasetAnnotationTypes(dataset);
  const bodyRegions = getDatasetBodyRegions(dataset, vocab);
  const anatomyTags = getDatasetAnatomyTags(dataset);
  const tasks = getDatasetTasks(dataset);
  const modalities = getDatasetModalities(dataset);
  const blob = [
    dataset.id,
    dataset.name,
    dataset.short_description,
    dataset.original_authors,
    dataset.anatomy,
    ...modalities,
    ...modalities.map((value) => vocabularyLabel(vocab, "modality", value)),
    ...tasks,
    ...tasks.map((value) => vocabularyLabel(vocab, "task", value)),
    dataset.is_longitudinal ? "longitudinal" : "",
    dataset.access_level,
    vocabularyLabel(vocab, "access_level", dataset.access_level),
    dataset.dimensionality,
    dataset.dimensionality
      ? vocabularyLabel(vocab, "dimensionality", dataset.dimensionality)
      : "",
    dataset.status,
    dataset.status
      ? vocabularyLabel(vocab, "status", dataset.status)
      : "",
    dataset.license,
    ...annotationTypes,
    ...annotationTypes.map((value) =>
      vocabularyLabel(vocab, "annotation_type", value),
    ),
    ...bodyRegions,
    ...bodyRegions.map((value) => vocabularyLabel(vocab, "body_region", value)),
    ...anatomyTags,
    ...anatomyTags.map(formatAnatomyTagLabel),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return blob.includes(q);
}

function datasetPassesGroupForMode(
  dataset: DatasetCatalogueEntry,
  groupId: FilterGroupId,
  selected: string[],
  excludeMode: boolean,
  vocab?: ClassificationVocabularyDoc,
) {
  if (!excludeMode) return datasetMatchesGroup(dataset, groupId, selected, vocab);
  if (selected.length === 0) return true;
  return !datasetMatchesGroup(dataset, groupId, selected, vocab);
}

export function datasetMatchesFilters(
  dataset: DatasetCatalogueEntry,
  filters: DatasetFilterState,
  query = "",
  opts?: FilterMatchOptions,
  vocab?: ClassificationVocabularyDoc,
) {
  const excludeMode = opts?.excludeMode ?? false;
  if (!datasetMatchesText(dataset, query, vocab)) return false;
  return (Object.keys(filters) as FilterGroupId[]).every((groupId) =>
    datasetPassesGroupForMode(
      dataset,
      groupId,
      filters[groupId],
      excludeMode,
      vocab,
    ),
  );
}

export function getFilterOptionCount(
  datasets: DatasetCatalogueEntry[],
  filters: DatasetFilterState,
  groupId: FilterGroupId,
  value: string,
  query = "",
  opts?: FilterMatchOptions,
  vocab?: ClassificationVocabularyDoc,
) {
  const excludeMode = opts?.excludeMode ?? false;
  return datasets.filter((dataset) => {
    if (!datasetMatchesText(dataset, query, vocab)) return false;
    return (Object.keys(filters) as FilterGroupId[]).every((candidateGroupId) => {
      const selected =
        candidateGroupId === groupId ? [value] : filters[candidateGroupId];
      return datasetPassesGroupForMode(
        dataset,
        candidateGroupId,
        selected,
        excludeMode,
        vocab,
      );
    });
  }).length;
}

export function getAnatomyFilterOptions(datasets: DatasetCatalogueEntry[]) {
  const counts = new Map<string, number>();
  for (const dataset of datasets) {
    for (const tag of getDatasetAnatomyTags(dataset)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value]) => ({
      label: formatAnatomyTagLabel(value),
      value,
    }));
}

export function getActiveFilterCount(filters: DatasetFilterState) {
  return Object.values(filters).reduce((sum, values) => sum + values.length, 0);
}
