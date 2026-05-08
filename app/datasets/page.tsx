import { DatasetBrowse } from "@/components/dataset-browse";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";

export default async function DatasetsPage() {
  const { datasets, generated_at: generatedAt } = await fetchCatalogueIndexLive();
  return <DatasetBrowse datasets={datasets} generatedAt={generatedAt} />;
}
