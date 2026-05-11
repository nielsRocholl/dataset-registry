import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AsteriskIcon,
  ChevronLeftIcon,
} from "lucide-react";

import { DatasetEditorForm } from "@/components/dataset-editor-form";
import {
  getCanMutateDataset,
  getCurrentCatalogueUser,
} from "@/lib/catalogue/editor-session";
import { getDatasetIds } from "@/lib/catalogue/load-index";
import { getDatasetEntryServer } from "@/lib/catalogue/resolve-dataset-server";

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
  const [initialDataset] = await Promise.all([
    getDatasetEntryServer(id),
    getCurrentCatalogueUser(),
  ]);
  if (!initialDataset) {
    notFound();
  }
  const canEdit = await getCanMutateDataset(initialDataset);
  if (!canEdit) {
    redirect("/unauthorized");
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-16">
        <Link
          href={`/datasets/${id}`}
          className="group inline-flex w-fit items-center gap-2 text-[length:var(--text-sm)] font-medium text-muted-foreground outline-none transition-[color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <ChevronLeftIcon
            className="size-4 shrink-0 transition-transform duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to detail
        </Link>

        <header className="rounded-3xl border border-border bg-card px-5 py-5 shadow-[var(--shadow-soft)] sm:px-7 sm:py-7">
          <div className="flex items-start gap-4">
            <AsteriskIcon className="mt-1 size-9 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0">
              <p className="ui-kicker">Edit</p>
              <h1 className="ui-title mt-2 text-[length:var(--text-3xl)]">
                {initialDataset.name}
              </h1>
              <p className="ui-copy mt-3 text-[length:var(--text-sm)]">
                Refine the catalogue metadata without changing the dataset id.
              </p>
            </div>
          </div>
        </header>

        <DatasetEditorForm mode="edit" initialDataset={initialDataset} />
      </section>
    </main>
  );
}
