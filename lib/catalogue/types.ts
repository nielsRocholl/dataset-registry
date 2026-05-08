export type Modality =
  | "CT"
  | "MRI"
  | "PET"
  | "XRay"
  | "ultrasound"
  | "microscopy"
  | "pathology"
  | "mixed"
  | "other";

export type Task =
  | "segmentation"
  | "detection"
  | "classification"
  | "registration"
  | "reconstruction"
  | "other";

export type AccessLevel = "public" | "internal" | "restricted";

export type DatasetStatus = "draft" | "active" | "deprecated";

export type Dimensionality = "2D" | "3D" | "mixed";

export type DatasetCatalogueEntry = {
  id: string;
  name: string;
  short_description: string;
  internal_storage_path: string;
  modality: Modality;
  anatomy: string;
  task: Task;
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
  license?: string;
  access_notes?: string;
};

export type CatalogueIndex = {
  generated_at: string;
  datasets: DatasetCatalogueEntry[];
};
