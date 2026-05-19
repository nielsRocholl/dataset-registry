import type { ComponentType, SVGProps } from "react";
import {
  ArtificialIntelligence,
  Body,
  Breasts,
  Colon,
  Database,
  Head,
  HealthDataSecurity,
  IntegratedDataAndResearch,
  Kidneys,
  Liver,
  Lungs,
  MedicalRecords,
  MedicalSearch,
  Microscope,
  Neurology,
  Radiology,
  Skeleton,
  Spine,
  Tissue,
  UltrasoundScanner,
  Xray,
} from "healthicons-react";

import { cn } from "@/lib/utils";

const medicalIcons = {
  ai: ArtificialIntelligence,
  body: Body,
  brain: Neurology,
  breast: Breasts,
  clinicalRecord: MedicalRecords,
  colon: Colon,
  database: Database,
  head: Head,
  healthSecurity: HealthDataSecurity,
  integratedResearch: IntegratedDataAndResearch,
  kidney: Kidneys,
  liver: Liver,
  lungs: Lungs,
  medicalSearch: MedicalSearch,
  microscope: Microscope,
  radiology: Radiology,
  skeleton: Skeleton,
  spine: Spine,
  tissue: Tissue,
  ultrasound: UltrasoundScanner,
  xray: Xray,
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export type MedicalIconName = keyof typeof medicalIcons;

export function MedicalIcon({
  name,
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: SVGProps<SVGSVGElement> & { name: MedicalIconName }) {
  const Icon = medicalIcons[name];

  return (
    <Icon
      aria-hidden={ariaHidden}
      className={cn("size-4 shrink-0", className)}
      height="1em"
      width="1em"
      {...props}
    />
  );
}
