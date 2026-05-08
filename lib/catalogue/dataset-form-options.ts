import type {
  AccessLevel,
  DatasetStatus,
  Dimensionality,
  Modality,
  Task,
} from "@/lib/catalogue/types";

export const MODALITIES: Modality[] = [
  "CT",
  "MRI",
  "PET",
  "XRay",
  "ultrasound",
  "microscopy",
  "pathology",
  "mixed",
  "other",
];

export const TASKS: Task[] = [
  "segmentation",
  "detection",
  "classification",
  "registration",
  "reconstruction",
  "other",
];

export const ACCESS_LEVELS: AccessLevel[] = ["public", "internal", "restricted"];

export const STATUSES: DatasetStatus[] = ["draft", "active", "deprecated"];

export const DIMENSIONALITIES: Dimensionality[] = ["2D", "3D", "mixed"];

export const NONE = "__none__";
