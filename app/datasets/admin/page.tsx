import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import {
  AdminClassificationPanel,
  type ClassificationOptionRow,
} from "@/components/admin-classification-panel";
import { AdminMembersPanel } from "@/components/admin-members-panel";
import { DatasetEditorPageHeader } from "@/components/dataset-editor-page-header";
import { getCurrentCatalogueUser } from "@/lib/catalogue/editor-session";
import { listAdminMembers } from "@/lib/catalogue/admin-members";
import type { ClassificationFieldId } from "@/lib/catalogue/classification-vocabulary";
import {
  CLASSIFICATION_VOCABULARY_FIELDS,
  countClassificationValueUsage,
} from "@/lib/catalogue/classification-vocabulary";
import { loadClassificationVocabularyLive } from "@/lib/catalogue/classification-vocabulary.server";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";

export default async function AdminPage() {
  const user = await getCurrentCatalogueUser();
  if (!user?.isAdmin) {
    redirect("/unauthorized");
  }

  const members = await listAdminMembers();
  const [vocab, { datasets }] = await Promise.all([
    loadClassificationVocabularyLive(),
    fetchCatalogueIndexLive(),
  ]);

  const emptyOptions = (): Record<ClassificationFieldId, ClassificationOptionRow[]> => ({
    modality: [],
    task: [],
    body_region: [],
    annotation_type: [],
    status: [],
    access_level: [],
    dimensionality: [],
  });

  const initialOptions = emptyOptions();
  for (const id of CLASSIFICATION_VOCABULARY_FIELDS) {
    for (const term of vocab.fields[id]) {
      initialOptions[id].push({
        ...term,
        usageCount: countClassificationValueUsage(datasets, id, term.value),
      });
    }
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-7 pb-16">
        <Link
          href="/datasets"
          className="group inline-flex w-fit items-center gap-2 text-[length:var(--text-sm)] font-medium text-muted-foreground outline-none transition-[color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <ChevronLeftIcon
            className="size-4 shrink-0 transition-transform duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to datasets
        </Link>

        <DatasetEditorPageHeader
          kicker="Admin"
          title="Administration"
          subtitle="Manage catalogue membership and editable classification taxonomy (modality, task, anatomy regions, annotation types, access, lifecycle, dimensionality)."
          subtitleClassName="max-w-[42rem]"
        />

        <AdminMembersPanel initialMembers={members} />
        <AdminClassificationPanel initialOptions={initialOptions} />
      </section>
    </main>
  );
}
