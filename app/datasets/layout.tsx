import type { ReactNode } from "react";

import { CatalogueShell } from "@/components/catalogue-shell";
import { getCanEdit } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";

export default async function DatasetsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { datasets } = await fetchCatalogueIndexLive();
  const canEdit = await getCanEdit();
  return (
    <CatalogueShell datasets={datasets} canEdit={canEdit}>
      {children}
    </CatalogueShell>
  );
}
