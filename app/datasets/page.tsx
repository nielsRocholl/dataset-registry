import { DatasetBrowseLive } from "@/components/dataset-browse-live";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { filterRootDatasets } from "@/lib/catalogue/derivatives";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function parsePositiveInt(raw: string | undefined, fallback: number) {
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default async function DatasetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const [{ datasets, generated_at: generatedAt }, user] = await Promise.all([
    fetchCatalogueIndexLive(),
    getCurrentCatalogueUser(),
  ]);

  const totalCount = filterRootDatasets(datasets).length;
  const totalPages =
    totalCount === 0 ? 1 : Math.ceil(totalCount / PAGE_SIZE);

  let page = parsePositiveInt(sp.page, 1);
  page = Math.max(1, Math.min(page, totalPages));

  const starredDatasetIds = user ? await getStarredDatasetIds(user.id) : [];
  return (
    <DatasetBrowseLive
      canCreate={Boolean(user)}
      initialDatasets={datasets}
      generatedAt={generatedAt}
      starredDatasetIds={starredDatasetIds}
      totalCount={totalCount}
      rootsOnly
      pagination={{ page, pageSize: PAGE_SIZE, pathname: "/datasets" }}
    />
  );
}
