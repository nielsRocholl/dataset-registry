import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AsteriskIcon,
  BookTextIcon,
  ChevronLeftIcon,
  DatabaseIcon,
  FolderIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { BibtexCitationBlock } from "@/components/bibtex-citation-block";
import { CopyClipboardButton } from "@/components/copy-clipboard-button";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DatasetDeleteButton } from "@/components/dataset-delete-button";
import { DatasetStarButton } from "@/components/dataset-star-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getCanMutateDataset,
  getCurrentCatalogueUser,
} from "@/lib/catalogue/editor-session";
import { vocabularyLabel } from "@/lib/catalogue/classification-vocabulary";
import { loadClassificationVocabularyLive } from "@/lib/catalogue/classification-vocabulary.server";
import {
  formatAnatomyTagLabel,
  getDatasetAnnotationTypes,
  getDatasetAnatomyTags,
  getDatasetBodyRegions,
} from "@/lib/catalogue/filters";
import { getDatasetIds } from "@/lib/catalogue/load-index";
import { getDatasetEntryServer } from "@/lib/catalogue/resolve-dataset-server";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";
import {
  CATALOGUE_BACK_LINK_CN,
  CATALOGUE_CHIP_CN,
  CATALOGUE_DETAIL_LABEL_CN,
  CATALOGUE_DETAIL_VALUE_CN,
  CATALOGUE_DETAIL_VALUE_MONO_CN,
  CATALOGUE_MASTHEAD_CARD_CN,
  CATALOGUE_PAGE_MAIN_CN,
} from "@/lib/catalogue/catalogue-surface-styles";
import { cn } from "@/lib/utils";

export const dynamicParams = true;

export function generateStaticParams() {
  return getDatasetIds().map((id) => ({ id }));
}

function formatWhen(iso: string) {
  const time = new Date(iso);
  return Number.isNaN(time.getTime())
    ? iso
    : `${time.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt
        className={cn(
          "text-[length:var(--text-xs)] font-medium text-muted-foreground",
          CATALOGUE_DETAIL_LABEL_CN,
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          mono
            ? "break-all font-mono text-[length:var(--text-sm)]"
            : "text-[length:var(--text-sm)]",
          mono ? CATALOGUE_DETAIL_VALUE_MONO_CN : CATALOGUE_DETAIL_VALUE_CN,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dataset, user, vocab] = await Promise.all([
    getDatasetEntryServer(id),
    getCurrentCatalogueUser(),
    loadClassificationVocabularyLive(),
  ]);
  if (!dataset) {
    notFound();
  }

  const [canEdit, starredDatasetIds] = await Promise.all([
    getCanMutateDataset(dataset),
    user ? getStarredDatasetIds(user.id) : Promise.resolve([]),
  ]);
  const isStarred = starredDatasetIds.includes(dataset.id);
  const bodyRegions = getDatasetBodyRegions(dataset, vocab);
  const anatomyTags = getDatasetAnatomyTags(dataset);
  const annotationTypes = getDatasetAnnotationTypes(dataset);
  const hasProvenance =
    Boolean(dataset.original_authors?.trim()) ||
    Boolean(dataset.bibtex_citation?.trim()) ||
    Boolean(dataset.upstream_url?.trim());

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
          <ChevronLeftIcon className="size-4 shrink-0 transition-transform duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] group-hover:-translate-x-0.5" aria-hidden />
          Back to datasets
        </Link>

        <header
          className={cn(
            "rounded-3xl border border-border bg-card px-5 py-5 shadow-[var(--shadow-soft)] sm:px-7 sm:py-7",
            CATALOGUE_MASTHEAD_CARD_CN,
          )}
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <AsteriskIcon className="mt-1 size-9 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <p className="ui-kicker dark:text-white/35">Dataset</p>
                  <h1 className="ui-title mt-2 text-[length:var(--text-3xl)] dark:text-white/85">
                    {dataset.name}
                  </h1>
                  <p className="ui-copy mt-3 text-[length:var(--text-sm)] dark:text-white/40">
                    {dataset.short_description}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 self-start sm:mt-1">
                {user ? (
                  <DatasetStarButton
                    datasetId={dataset.id}
                    initialStarred={isStarred}
                    label="Star"
                  />
                ) : null}
                {canEdit ? (
                  <Link
                    href={`/datasets/${dataset.id}/edit`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Edit
                  </Link>
                ) : null}
                {canEdit ? (
                  <DatasetDeleteButton
                    datasetId={dataset.id}
                    datasetName={dataset.name}
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className={CATALOGUE_CHIP_CN}>
                {vocabularyLabel(vocab, "modality", dataset.modality)}
              </Badge>
              {bodyRegions.map((region) => (
                <Badge key={region} variant="outline" className={CATALOGUE_CHIP_CN}>
                  {vocabularyLabel(vocab, "body_region", region)}
                </Badge>
              ))}
              <Badge variant="outline" className={CATALOGUE_CHIP_CN}>
                {vocabularyLabel(vocab, "task", dataset.task)}
              </Badge>
              {annotationTypes.map((annotation) => (
                <Badge key={annotation} variant="outline" className={CATALOGUE_CHIP_CN}>
                  {vocabularyLabel(vocab, "annotation_type", annotation)}
                </Badge>
              ))}
              <Badge variant="outline" className={CATALOGUE_CHIP_CN}>
                {vocabularyLabel(vocab, "access_level", dataset.access_level)}
              </Badge>
              <Badge variant="outline" className={CATALOGUE_CHIP_CN}>
                Created by {dataset.created_by}
              </Badge>
              {dataset.status ? (
                <Badge variant="secondary" className={CATALOGUE_CHIP_CN}>
                  {vocabularyLabel(vocab, "status", dataset.status)}
                </Badge>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid gap-3 dark:gap-5">
          <Card size="sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FolderIcon aria-hidden />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="grid gap-3">
                <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt
                    className={cn(
                      "text-[length:var(--text-xs)] font-medium text-muted-foreground",
                      CATALOGUE_DETAIL_LABEL_CN,
                    )}
                  >
                    Storage path
                  </dt>
                  <dd className="flex min-w-0 items-start gap-0.5">
                    <span
                      className={cn(
                        "min-w-0 flex-1 break-all font-mono text-[length:var(--text-sm)]",
                        CATALOGUE_DETAIL_VALUE_MONO_CN,
                      )}
                    >
                      {dataset.internal_storage_path}
                    </span>
                    <CopyClipboardButton
                      text={dataset.internal_storage_path}
                      label="Copy storage path"
                      iconOnly
                      className="mt-px"
                    />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon aria-hidden />
                Access
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <dl className="grid gap-3">
                <DetailRow label="Level" value={dataset.access_level} />
                {dataset.license ? (
                  <DetailRow label="License" value={dataset.license} />
                ) : null}
              </dl>
              {dataset.access_notes ? (
                <>
                  <Separator />
                  <p className="ui-copy whitespace-pre-wrap text-[length:var(--text-sm)] dark:text-white/40">
                    {dataset.access_notes}
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>

          {hasProvenance ? (
            <Card size="sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <BookTextIcon aria-hidden />
                  Provenance
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-4">
                {dataset.original_authors?.trim() ? (
                  <dl>
                    <DetailRow
                      label="Original author(s)"
                      value={dataset.original_authors.trim()}
                    />
                  </dl>
                ) : null}
                {dataset.bibtex_citation?.trim() ? (
                  <BibtexCitationBlock text={dataset.bibtex_citation.trim()} />
                ) : null}
                {dataset.upstream_url?.trim() ? (
                  <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
                    <dt
                      className={cn(
                        "text-[length:var(--text-xs)] font-medium text-muted-foreground",
                        CATALOGUE_DETAIL_LABEL_CN,
                      )}
                    >
                      Upstream URL
                    </dt>
                    <dd className="flex min-w-0 items-start gap-0.5">
                      <a
                        href={dataset.upstream_url.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "min-w-0 flex-1 break-all font-mono text-[length:var(--text-sm)] text-brand underline-offset-2 hover:underline",
                          CATALOGUE_DETAIL_VALUE_MONO_CN,
                        )}
                      >
                        {dataset.upstream_url.trim()}
                      </a>
                      <CopyClipboardButton
                        text={dataset.upstream_url.trim()}
                        label="Copy upstream URL"
                        iconOnly
                        className="mt-px"
                      />
                    </dd>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card size="sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon aria-hidden />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="grid gap-3">
                <DetailRow label="Id" value={dataset.id} mono />
                <DetailRow
                  label="Anatomy tags"
                  value={anatomyTags.map(formatAnatomyTagLabel).join(", ")}
                />
                <DetailRow
                  label="Body regions"
                  value={bodyRegions
                    .map((region) => vocabularyLabel(vocab, "body_region", region))
                    .join(", ")}
                />
                <DetailRow
                  label="Annotations"
                  value={annotationTypes
                    .map((annotation) =>
                      vocabularyLabel(vocab, "annotation_type", annotation),
                    )
                    .join(", ")}
                />
                <DetailRow label="Created by" value={dataset.created_by} />
                <DetailRow label="Created" value={formatWhen(dataset.created_at)} />
                <DetailRow label="Updated" value={formatWhen(dataset.updated_at)} />
                {dataset.n_patients != null ? (
                  <DetailRow label="Patients" value={dataset.n_patients} />
                ) : null}
                {dataset.n_studies != null ? (
                  <DetailRow label="Studies" value={dataset.n_studies} />
                ) : null}
                {dataset.n_images != null ? (
                  <DetailRow label="Images" value={dataset.n_images} />
                ) : null}
                {dataset.dimensionality ? (
                  <DetailRow
                    label="Dimensions"
                    value={vocabularyLabel(
                      vocab,
                      "dimensionality",
                      dataset.dimensionality,
                    )}
                  />
                ) : null}
              </dl>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
