import { DatasetBrowse } from "@/components/dataset-browse";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export default async function DatasetsPage() {
  const { datasets, generated_at: generatedAt } = await fetchCatalogueIndexLive();
  const user = await getCurrentCatalogueUser();
  const starredDatasetIds = user ? await getStarredDatasetIds(user.id) : [];
  return (
    <DatasetBrowse
      canCreate={Boolean(user)}
      datasets={datasets}
      generatedAt={generatedAt}
      starredDatasetIds={starredDatasetIds}
    />
  );
}
