import { DatasetList } from "@/components/dataset-list";
import { getCatalogueIndex } from "@/lib/catalogue/load-index";

export default function DatasetsPage() {
  const { datasets, generated_at: generatedAt } = getCatalogueIndex();
  return <DatasetList datasets={datasets} generatedAt={generatedAt} />;
}
