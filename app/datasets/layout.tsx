import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { CatalogueShell } from "@/components/catalogue-shell";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export default async function DatasetsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentCatalogueUser();
  if (!user) {
    redirect("/unauthorized");
  }

  const [{ datasets }, starredDatasetIds] = await Promise.all([
    fetchCatalogueIndexLive(),
    getStarredDatasetIds(user.id),
  ]);
  const starredDatasetIdSet = new Set(starredDatasetIds);
  const starredDatasets = datasets.filter((dataset) =>
    starredDatasetIdSet.has(dataset.id),
  );
  return (
    <CatalogueShell
      datasets={datasets}
      canCreate
      currentUser={user}
      starredDatasets={starredDatasets}
    >
      {children}
    </CatalogueShell>
  );
}
