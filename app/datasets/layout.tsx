import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { CatalogueShell } from "@/components/catalogue-shell";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export const dynamic = "force-dynamic";

export default async function DatasetsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentCatalogueUser();
  if (!user) {
    redirect("/unauthorized");
  }

  const [{ datasets, generated_at: generatedAt }, starredDatasetIds] =
    await Promise.all([
      fetchCatalogueIndexLive(),
      getStarredDatasetIds(user.id),
    ]);
  return (
    <CatalogueShell
      datasets={datasets}
      generatedAt={generatedAt}
      starredDatasetIds={starredDatasetIds}
      canCreate
      currentUser={user}
    >
      {children}
    </CatalogueShell>
  );
}
