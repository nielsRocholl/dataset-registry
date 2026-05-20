import { DatasetList } from "@/components/dataset-list";
import { loadClassificationVocabularyUncached } from "@/lib/catalogue/classification-vocabulary.server";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export const dynamic = "force-dynamic";

export default async function DatasetsSearchPage() {
  const [vocabulary, catalogue, user] = await Promise.all([
    loadClassificationVocabularyUncached(),
    fetchCatalogueIndexLive(),
    getCurrentCatalogueUser(),
  ]);
  const { datasets, generated_at: generatedAt } = catalogue;
  const starredDatasetIds = user ? await getStarredDatasetIds(user.id) : [];
  return (
    <DatasetList
      key={vocabulary.updated_at}
      datasets={datasets}
      generatedAt={generatedAt}
      classificationVocabulary={vocabulary}
      starredDatasetIds={starredDatasetIds}
    />
  );
}
