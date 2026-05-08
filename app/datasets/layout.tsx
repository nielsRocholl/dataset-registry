import type { ReactNode } from "react";

import { CatalogueShell } from "@/components/catalogue-shell";
import { getCatalogueIndex } from "@/lib/catalogue/load-index";

export default function DatasetsLayout({ children }: { children: ReactNode }) {
  const { datasets } = getCatalogueIndex();
  return <CatalogueShell datasets={datasets}>{children}</CatalogueShell>;
}
