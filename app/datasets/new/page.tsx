import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { DatasetEditorPageHeader } from "@/components/dataset-editor-page-header";
import { DatasetEditorForm } from "@/components/dataset-editor-form";
import { loadClassificationVocabularyLive } from "@/lib/catalogue/classification-vocabulary.server";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import {
  CATALOGUE_BACK_LINK_CN,
  CATALOGUE_PAGE_MAIN_CN,
} from "@/lib/catalogue/catalogue-surface-styles";
import { cn } from "@/lib/utils";

export default async function NewDatasetPage() {
  const [user, classificationVocabulary] = await Promise.all([
    getCurrentCatalogueUser(),
    loadClassificationVocabularyLive(),
  ]);
  if (!user) {
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

        <DatasetEditorPageHeader
          kicker="New entry"
          title="Register a dataset"
          subtitle="Add the minimum metadata researchers need to find, judge, and request access to the dataset."
        />

        <DatasetEditorForm
          mode="new"
          classificationVocabulary={classificationVocabulary}
        />
      </section>
    </main>
  );
}
