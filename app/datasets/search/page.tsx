import { DatasetList } from "@/components/dataset-list";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export default async function DatasetsSearchPage() {
  const [{ datasets, generated_at: generatedAt }, user] = await Promise.all([
    fetchCatalogueIndexLive(),
    getCurrentCatalogueUser(),
  ]);
  const starredDatasetIds = user ? await getStarredDatasetIds(user.id) : [];
  return (
    <DatasetList
      datasets={datasets}
      generatedAt={generatedAt}
      starredDatasetIds={starredDatasetIds}
    />
  );
}
