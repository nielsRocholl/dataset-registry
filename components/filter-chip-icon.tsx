import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Activity,
  Archive,
  Box,
  Building2,
  CheckCircle2,
  Circle,
  CircleOff,
  Dot,
  FileText,
  FlaskConical,
  FolderOpen,
  Globe,
  Layers,
  Lock,
  Microscope,
  MoreHorizontal,
  Move,
  RectangleHorizontal,
  Rotate3d,
  ScanLine,
  ScanSearch,
  Scissors,
  Square,
  Tags,
  Users,
  Waves,
} from "lucide-react";

import type { FilterGroupId } from "@/lib/catalogue/filters";

function chip(Icon: LucideIcon) {
  return (
    <Icon
      aria-hidden
      className="size-3.5 shrink-0 text-current"
      strokeWidth={2}
    />
  );
}

export function getFilterChipIcon(
  groupId: FilterGroupId,
  value: string,
): ReactNode | null {
  switch (groupId) {
    case "bodyRegions":
    case "anatomyTags":
      return null;
    case "modalities": {
      switch (value) {
        case "MRI":
        case "ultrasound":
          return chip(Waves);
        case "PET":
          return chip(Activity);
        case "microscopy":
          return chip(Microscope);
        case "pathology":
          return chip(FlaskConical);
        case "mixed":
          return chip(Layers);
        case "CT":
        case "XRay":
        case "other":
        default:
          return chip(ScanLine);
      }
    }
    case "annotationTypes": {
      switch (value) {
        case "any":
          return chip(Layers);
        case "voxel_mask":
          return chip(Box);
        case "mask_2d":
          return chip(Square);
        case "point":
          return chip(Dot);
        case "bounding_box":
          return chip(RectangleHorizontal);
        case "image_label":
        case "study_label":
        case "text_report":
          return chip(FileText);
        case "none":
          return chip(CircleOff);
        case "other":
          return chip(MoreHorizontal);
        default:
          return chip(FileText);
      }
    }
    case "tasks": {
      switch (value) {
        case "segmentation":
          return chip(Scissors);
        case "detection":
          return chip(ScanSearch);
        case "classification":
          return chip(Tags);
        case "registration":
          return chip(Move);
        case "reconstruction":
          return chip(Rotate3d);
        case "other":
        default:
          return chip(MoreHorizontal);
      }
    }
    case "scale": {
      switch (value) {
        case "patients_100":
        case "patients_500":
          return chip(Users);
        case "studies_100":
          return chip(FolderOpen);
        case "images_1000":
        case "images_10000":
          return chip(Layers);
        default:
          return chip(Layers);
      }
    }
    case "accessLevels": {
      switch (value) {
        case "public":
          return chip(Globe);
        case "internal":
          return chip(Building2);
        case "restricted":
          return chip(Lock);
        default:
          return chip(Lock);
      }
    }
    case "statuses": {
      switch (value) {
        case "draft":
          return chip(Circle);
        case "active":
          return chip(CheckCircle2);
        case "deprecated":
          return chip(Archive);
        default:
          return chip(Circle);
      }
    }
    case "dimensionalities": {
      switch (value) {
        case "2D":
          return chip(Square);
        case "3D":
          return chip(Box);
        case "mixed":
          return chip(Layers);
        default:
          return chip(Box);
      }
    }
    default:
      return null;
  }
}
