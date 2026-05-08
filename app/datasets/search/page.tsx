import { DatasetList } from "@/components/dataset-list";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";

export default async function DatasetsSearchPage() {
  const { datasets, generated_at: generatedAt } = await fetchCatalogueIndexLive();
  return <DatasetList datasets={datasets} generatedAt={generatedAt} />;
}
