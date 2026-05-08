import { redirect } from "next/navigation";

import { DatasetBrowse } from "@/components/dataset-browse";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export default async function StarredDatasetsPage() {
  const user = await getCurrentCatalogueUser();
  if (!user) {
    redirect("/unauthorized");
  }

  const { datasets, generated_at: generatedAt } = await fetchCatalogueIndexLive();
  const starredDatasetIds = await getStarredDatasetIds(user.id);
  const starredSet = new Set(starredDatasetIds);
  const starredDatasets = datasets.filter((dataset) => starredSet.has(dataset.id));

  return (
    <DatasetBrowse
      canCreate
      datasets={starredDatasets}
      generatedAt={generatedAt}
      starredDatasetIds={starredDatasetIds}
      kicker="Starred"
      title="Starred datasets"
      description={`${starredDatasets.length} ${
        starredDatasets.length === 1 ? "dataset" : "datasets"
      } saved for quick access.`}
      emptyMessage="No starred datasets yet."
    />
  );
}
