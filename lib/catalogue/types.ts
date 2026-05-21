/** Slug/value from vocabulary (see config/classification-vocabulary.json). */
export type Modality = string;
export type Task = string;
export type AccessLevel = string;
export type DatasetStatus = string;
export type Dimensionality = string;
export type BodyRegion = string;
export type AnnotationType = string;

export type DatasetCatalogueEntry = {
  id: string;
  name: string;
  short_description: string;
  /** False when catalogued but files are not on group storage. Omitted means true. */
  storage_on_server?: boolean;
  internal_storage_path?: string;
  modality: Modality[];
  /** @deprecated Legacy free-text; use anatomy_tags. */
  anatomy?: string;
  body_regions: BodyRegion[];
  anatomy_tags?: string[];
  task: Task[];
  is_longitudinal?: boolean;
  /** Contrast/acquisition phase or clinical trial phase (optional free text). */
  phase?: string;
  /** Primary disease or condition focus (optional free text). */
  main_disease_type?: string;
  annotation_types?: AnnotationType[];
  access_level: AccessLevel;
  created_by: string;
  created_by_user_id?: string;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
  status?: DatasetStatus;
  n_patients?: number;
  n_studies?: number;
  n_images?: number;
  dimensionality?: Dimensionality;
  /** Scanner or acquisition device label (optional). */
  scanner_type?: string;
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
