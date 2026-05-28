import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { DatasetEditorPageHeader } from "@/components/dataset-editor-page-header";
import { DatasetEditorForm } from "@/components/dataset-editor-form";
import {
  getCanMutateDataset,
  getCurrentCatalogueUser,
} from "@/lib/catalogue/editor-session";
import { getDatasetIds } from "@/lib/catalogue/load-index";
import { getDatasetEntryServer } from "@/lib/catalogue/resolve-dataset-server";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { loadClassificationVocabularyLive } from "@/lib/catalogue/classification-vocabulary.server";
import {
  CATALOGUE_BACK_LINK_CN,
  CATALOGUE_PAGE_MAIN_CN,
} from "@/lib/catalogue/catalogue-surface-styles";
import { cn } from "@/lib/utils";

export const dynamicParams = true;

export function generateStaticParams() {
  return getDatasetIds().map((id) => ({ id }));
}

export default async function EditDatasetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [initialDataset, , classificationVocabulary, index] = await Promise.all([
    getDatasetEntryServer(id),
    getCurrentCatalogueUser(),
    loadClassificationVocabularyLive(),
    fetchCatalogueIndexLive(),
  ]);
  if (!initialDataset) {
    notFound();
  }
  const canEdit = await getCanMutateDataset(initialDataset);
  if (!canEdit) {
    redirect("/unauthorized");
  }

  return (
    <main
      className={cn(
        "flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12",
        CATALOGUE_PAGE_MAIN_CN,
      )}
    >
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-16">
        <Link
          href={`/datasets/${id}`}
          className={cn(
            "group inline-flex w-fit items-center gap-2 text-[length:var(--text-sm)] font-medium text-muted-foreground outline-none transition-[color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
            CATALOGUE_BACK_LINK_CN,
          )}
        >
          <ChevronLeftIcon
            className="size-4 shrink-0 transition-transform duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to detail
        </Link>

        <DatasetEditorPageHeader
          kicker={
            initialDataset.parent_dataset_id ? "Edit derivative" : "Edit"
          }
          title={initialDataset.name}
          subtitle={
            initialDataset.parent_dataset_id
              ? "Edit the change description and storage path; inherited metadata is fixed."
              : "Refine the catalogue metadata without changing the dataset id."
          }
        />

        <DatasetEditorForm
          mode="edit"
          initialDataset={initialDataset}
          classificationVocabulary={classificationVocabulary}
          allDatasets={index.datasets}
        />
      </section>
    </main>
  );
}
