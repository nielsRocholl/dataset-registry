import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { DatasetNewWorkspace } from "@/components/dataset-new-workspace";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { loadClassificationVocabularyLive } from "@/lib/catalogue/classification-vocabulary.server";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { isDerivative } from "@/lib/catalogue/derivatives";
import {
  CATALOGUE_BACK_LINK_CN,
  CATALOGUE_PAGE_MAIN_CN,
} from "@/lib/catalogue/catalogue-surface-styles";
import { cn } from "@/lib/utils";

export default async function NewDatasetPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const [user, classificationVocabulary, index, sp] = await Promise.all([
    getCurrentCatalogueUser(),
    loadClassificationVocabularyLive(),
    fetchCatalogueIndexLive(),
    searchParams,
  ]);
  if (!user) {
    redirect("/unauthorized");
  }

  const parentQuery = sp.parent?.trim() ?? "";
  const parentEntry = parentQuery
    ? index.datasets.find((d) => d.id === parentQuery)
    : undefined;
  const validParent =
    parentEntry && !isDerivative(parentEntry) ? parentEntry.id : undefined;

  return (
    <main
      className={cn(
        "flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12",
        CATALOGUE_PAGE_MAIN_CN,
      )}
    >
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-16">
        <Link
          href="/datasets"
          className={cn(
            "group inline-flex w-fit items-center gap-2 text-[length:var(--text-sm)] font-medium text-muted-foreground outline-none transition-[color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
            CATALOGUE_BACK_LINK_CN,
          )}
        >
          <ChevronLeftIcon
            className="size-4 shrink-0 transition-transform duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to datasets
        </Link>

        <DatasetNewWorkspace
          classificationVocabulary={classificationVocabulary}
          allDatasets={index.datasets}
          initialParentId={validParent}
          lockParent={Boolean(validParent)}
        />
      </section>
    </main>
  );
}
