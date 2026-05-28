/** Slug/value from vocabulary (see config/classification-vocabulary.json). */
export type Modality = string;
export type Task = string;
export type AccessLevel = string;
export type Dimensionality = string;
export type BodyRegion = string;
export type AnnotationType = string;

export type DownloadStatus = "downloaded" | "not_downloaded" | "partial";

export type RelatedPaper = {
  title: string;
  url: string;
};

export type DatasetCatalogueEntry = {
  id: string;
  name: string;
  short_description: string;
  parent_dataset_id?: string;
  derivative_note?: string;
  /** False when catalogued but files are not on group storage. Omitted means true. */
  storage_on_server?: boolean;
  internal_storage_path?: string;
  modality: Modality[];
  /** @deprecated Legacy free-text; use anatomy_tags. */
  anatomy?: string;
  body_regions: BodyRegion[];
  anatomy_tags?: string[];
  primary_tumor_location?: string;
  task?: Task[];
  is_longitudinal?: boolean;
  /** Contrast/acquisition phase or clinical trial phase (optional free text). */
  phase?: string;
  /** Primary disease or condition focus (optional free text). */
  main_disease_type?: string;
  annotation_types?: AnnotationType[];
  ai_generated_labels?: boolean;
  access_level: AccessLevel;
  download_status?: DownloadStatus;
  created_by: string;
  created_by_user_id?: string;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
  n_patients?: number;
  n_studies?: number;
  n_series?: number;
  /** @deprecated Read fallback; prefer n_series. */
  n_images?: number;
  field_of_view?: string;
  cases_healthy?: number;
  cases_pathological?: number;
  dimensionality?: Dimensionality;
  related_papers?: RelatedPaper[];
  license?: string;
  access_notes?: string;
  /** Creators of the upstream resource (optional). */
  original_authors?: string;
  /** BibTeX or full citation string for the upstream source (optional). */
  bibtex_citation?: string;
  /** Public/open download or project URL (optional). */
  upstream_url?: string;
};

export type CatalogueIndex = {
  generated_at: string;
  datasets: DatasetCatalogueEntry[];
};
