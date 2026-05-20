import { redirect } from "next/navigation";

import { DatasetBrowseLive } from "@/components/dataset-browse-live";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export const dynamic = "force-dynamic";

export default async function StarredDatasetsPage() {
  const user = await getCurrentCatalogueUser();
  if (!user) {
    redirect("/unauthorized");
  }

  const [{ datasets, generated_at: generatedAt }, starredDatasetIds] =
    await Promise.all([
      fetchCatalogueIndexLive(),
      getStarredDatasetIds(user.id),
    ]);
  const starredSet = new Set(starredDatasetIds);

  return (
    <DatasetBrowseLive
      canCreate
      initialDatasets={datasets}
      generatedAt={generatedAt}
      starredDatasetIds={starredDatasetIds}
      starredOnlyIds={starredDatasetIds}
      kicker="Starred"
      title="Starred datasets"
      description={`${starredSet.size} ${
        starredSet.size === 1 ? "dataset" : "datasets"
      } saved for quick access.`}
      emptyMessage="No starred datasets yet."
    />
  );
}
