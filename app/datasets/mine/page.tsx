import { redirect } from "next/navigation";

import { DatasetBrowse } from "@/components/dataset-browse";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export default async function MyDatasetsPage() {
  const user = await getCurrentCatalogueUser();
  if (!user) {
    redirect("/unauthorized");
  }

  const [{ datasets, generated_at: generatedAt }, starredDatasetIds] =
    await Promise.all([
      fetchCatalogueIndexLive(),
      getStarredDatasetIds(user.id),
    ]);
  const mine = datasets.filter(
    (dataset) => dataset.created_by_user_id === user.id,
  );

  return (
    <DatasetBrowse
      canCreate
      datasets={mine}
      generatedAt={generatedAt}
      starredDatasetIds={starredDatasetIds}
      kicker="Account"
      title="My datasets"
      description={`${mine.length} ${
        mine.length === 1 ? "dataset" : "datasets"
      } created by ${user.displayName}.`}
      emptyMessage="You have not created any datasets yet."
    />
  );
}
