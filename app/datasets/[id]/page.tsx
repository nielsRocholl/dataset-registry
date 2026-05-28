import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  AsteriskIcon,
  BookOpenIcon,
  BookTextIcon,
  ChevronLeftIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FolderIcon,
  GitForkIcon,
  InfoIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { BibtexCitationBlock } from "@/components/bibtex-citation-block";
import { CopyClipboardButton } from "@/components/copy-clipboard-button";
import { DatasetDerivativesPanel } from "@/components/dataset-derivatives-panel";
import { DerivativeNoteMarkdown } from "@/components/derivative-note-markdown";

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
  getDatasetModalities,
  getDatasetTasks,
} from "@/lib/catalogue/filters";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import { getDerivatives } from "@/lib/catalogue/derivatives";
import { getDatasetIds } from "@/lib/catalogue/load-index";
import { getDatasetSeriesCount } from "@/lib/catalogue/scale";
import {
  getDatasetDescriptionServer,
  getDatasetEntryServer,
} from "@/lib/catalogue/resolve-dataset-server";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";
import {
  CATALOGUE_BACK_LINK_CN,
  CATALOGUE_CHIP_CN,
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
  if (Number.isNaN(time.getTime())) return iso;
  const day = time.getUTCDate();
  const month = time.toLocaleString("en-GB", {
    month: "short",
    timeZone: "UTC",
  });
  const year = time.getUTCFullYear();
  const hours = String(time.getUTCHours()).padStart(2, "0");
  const mins = String(time.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${mins} UTC`;
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 border-b py-3 last:border-0">
      <span className="w-36 shrink-0 pt-0.5 text-xs text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}

function BadgeList({ values }: { values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <Badge key={v} variant="outline" className="font-normal">
          {v}
        </Badge>
      ))}
    </div>
  );
}

function AccessLevelBadge({ level, label }: { level: string; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        level === "internal" &&
          "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
        level === "public" &&
          "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
      )}
    >
      {label}
    </Badge>
  );
}

function downloadStatusLabel(status: string) {
  switch (status) {
    case "downloaded":
      return "Downloaded";
    case "not_downloaded":
      return "Not downloaded";
    case "partial":
      return "Partial";
    default:
      return status;
  }
}

function SectionCardHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 border-b py-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <CardTitle className="text-sm font-semibold tracking-wide">
        {title}
      </CardTitle>
    </CardHeader>
  );
}

export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dataset, user, vocab, markdown, index] = await Promise.all([
    getDatasetEntryServer(id),
    getCurrentCatalogueUser(),
    loadClassificationVocabularyLive(),
    getDatasetDescriptionServer(id),
    fetchCatalogueIndexLive(),
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
  const tasks = getDatasetTasks(dataset);
  const modalities = getDatasetModalities(dataset);
  const hasProvenance =
    Boolean(dataset.original_authors?.trim()) ||
    Boolean(dataset.bibtex_citation?.trim()) ||
    Boolean(dataset.upstream_url?.trim());
  const parentDataset = dataset.parent_dataset_id
    ? index.datasets.find((d) => d.id === dataset.parent_dataset_id)
    : undefined;
  const derivatives = dataset.parent_dataset_id
    ? getDerivatives(index.datasets, dataset.parent_dataset_id)
    : getDerivatives(index.datasets, dataset.id);
  const derivativesPanelParentId =
    dataset.parent_dataset_id ?? dataset.id;
  const seriesCount = getDatasetSeriesCount(dataset);
  const showCaseRatio =
    dataset.cases_healthy != null || dataset.cases_pathological != null;

  const modalityLabels = modalities.map((mod) =>
    vocabularyLabel(vocab, "modality", mod),
  );
  const taskLabels = tasks.map((task) =>
    vocabularyLabel(vocab, "task", task),
  );
  const bodyRegionLabels = bodyRegions.map((region) =>
    vocabularyLabel(vocab, "body_region", region),
  );
  const anatomyTagLabels = anatomyTags.map(formatAnatomyTagLabel);
  const annotationLabels = annotationTypes.map((annotation) =>
    vocabularyLabel(vocab, "annotation_type", annotation),
  );

  const stats = [
    dataset.n_patients != null
      ? { value: dataset.n_patients, label: "patients" }
      : null,
    dataset.n_studies != null
      ? { value: dataset.n_studies, label: "studies" }
      : null,
    seriesCount != null
      ? { value: seriesCount, label: "series" }
      : null,
  ].filter((s): s is { value: number; label: string } => s != null);

  const markdownContent = markdown?.trim();

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
                    redirectTo={
                      dataset.parent_dataset_id
                        ? `/datasets/${dataset.parent_dataset_id}`
                        : "/datasets"
                    }
                    isDerivative={Boolean(dataset.parent_dataset_id)}
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {modalities.map((mod) => (
                <Badge key={mod} variant="secondary" className={CATALOGUE_CHIP_CN}>
                  {vocabularyLabel(vocab, "modality", mod)}
                </Badge>
              ))}
              {bodyRegions.map((region) => (
                <Badge key={region} variant="outline" className={CATALOGUE_CHIP_CN}>
                  {vocabularyLabel(vocab, "body_region", region)}
                </Badge>
              ))}
              {tasks.map((task) => (
                <Badge key={task} variant="outline" className={CATALOGUE_CHIP_CN}>
                  {vocabularyLabel(vocab, "task", task)}
                </Badge>
              ))}
              {dataset.is_longitudinal ? (
                <Badge variant="outline" className={CATALOGUE_CHIP_CN}>
                  Longitudinal
                </Badge>
              ) : null}
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
            </div>
          </div>
        </header>

        {(derivatives.length > 0 || (!dataset.parent_dataset_id && canEdit)) ? (
          <DatasetDerivativesPanel
            parentId={derivativesPanelParentId}
            derivatives={derivatives}
            canEdit={canEdit && !dataset.parent_dataset_id}
            user={user}
            activeDatasetId={dataset.parent_dataset_id ? dataset.id : undefined}
          />
        ) : null}

        <div
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-900/15"
        >
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium">Treat the data as read-only.</span>{" "}
            This catalogue entry describes where it lives and how to access
            it—data is not stored in or served from this application. If you
            want to process or reshape it, create a derivative and keep the
            original untouched.
          </p>
        </div>

        {dataset.parent_dataset_id ? (
          <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/40 px-4 py-3">
            <GitForkIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="text-muted-foreground">
                Derived from{" "}
                <Link
                  href={`/datasets/${dataset.parent_dataset_id}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {parentDataset?.name ?? dataset.parent_dataset_id}
                </Link>
              </p>
              {dataset.derivative_note ? (
                <div className="mt-2">
                  <DerivativeNoteMarkdown content={dataset.derivative_note} />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          {markdownContent ? (
            <Card>
              <SectionCardHeader icon={BookOpenIcon} title="Description" />
              <CardContent className="prose prose-sm dark:prose-invert max-w-none px-6 py-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdownContent}
                </ReactMarkdown>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <SectionCardHeader icon={FolderIcon} title="Storage" />
            <CardContent className="px-6 py-5">
              {dataset.storage_on_server === false ? (
                <p className="text-sm text-muted-foreground">
                  Not on group storage — catalogue reference only.
                </p>
              ) : dataset.internal_storage_path ? (
                <MetaRow label="Storage path">
                  <div className="flex min-w-0 items-start gap-1">
                    <code className="min-w-0 flex-1 break-all rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-muted-foreground">
                      {dataset.internal_storage_path}
                    </code>
                    <CopyClipboardButton
                      text={dataset.internal_storage_path}
                      label="Copy storage path"
                      iconOnly
                      className="mt-px shrink-0"
                    />
                  </div>
                </MetaRow>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Storage path not recorded.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <SectionCardHeader icon={ShieldCheckIcon} title="Access" />
            <CardContent className="px-6 py-5">
              <MetaRow label="Level">
                <AccessLevelBadge
                  level={dataset.access_level}
                  label={vocabularyLabel(
                    vocab,
                    "access_level",
                    dataset.access_level,
                  )}
                />
              </MetaRow>
              {dataset.license ? (
                <MetaRow label="License">{dataset.license}</MetaRow>
              ) : null}
              {dataset.access_notes ? (
                <p className="mt-4 text-sm italic text-muted-foreground">
                  {dataset.access_notes}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {hasProvenance ? (
            <Card>
              <SectionCardHeader icon={BookTextIcon} title="Provenance" />
              <CardContent className="flex flex-col gap-4 px-6 py-5">
                {dataset.original_authors?.trim() ? (
                  <MetaRow label="Original author(s)">
                    {dataset.original_authors.trim()}
                  </MetaRow>
                ) : null}
                {dataset.bibtex_citation?.trim() ? (
                  <BibtexCitationBlock text={dataset.bibtex_citation.trim()} />
                ) : null}
                {dataset.upstream_url?.trim() ? (
                  <MetaRow label="Upstream URL">
                    <a
                      href={dataset.upstream_url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {dataset.upstream_url.trim()}
                      <ExternalLinkIcon className="h-3 w-3 opacity-60" />
                    </a>
                  </MetaRow>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {dataset.related_papers && dataset.related_papers.length > 0 ? (
            <Card>
              <SectionCardHeader icon={BookTextIcon} title="Related work" />
              <CardContent className="flex flex-col gap-2 px-6 py-5">
                {dataset.related_papers.map((paper) => (
                  <a
                    key={`${paper.title}-${paper.url}`}
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
                  >
                    {paper.title}
                    <ExternalLinkIcon className="size-3 opacity-50" />
                  </a>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <SectionCardHeader icon={DatabaseIcon} title="Metadata" />
            <CardContent className="px-6 py-5">
              {(stats.length > 0 || showCaseRatio) ? (
                <div className="mb-2 flex flex-wrap gap-8 border-b pb-5">
                  {stats.map(({ value, label }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-2xl font-medium tabular-nums">
                        {value.toLocaleString()}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  ))}
                  {showCaseRatio ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-2xl font-medium tabular-nums">
                        {dataset.cases_healthy ?? "—"} /{" "}
                        {dataset.cases_pathological ?? "—"}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        healthy / pathological
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {stats.length > 0 || showCaseRatio ? (
                <Separator className="my-5" />
              ) : null}

              {modalityLabels.length > 0 ? (
                <MetaRow label="Modalities">
                  <BadgeList values={modalityLabels} />
                </MetaRow>
              ) : null}
              {taskLabels.length > 0 ? (
                <MetaRow label="Tasks">
                  <BadgeList values={taskLabels} />
                </MetaRow>
              ) : null}
              {bodyRegionLabels.length > 0 ? (
                <MetaRow label="Body regions">
                  <BadgeList values={bodyRegionLabels} />
                </MetaRow>
              ) : null}
              {anatomyTagLabels.length > 0 ? (
                <MetaRow label="Anatomy tags">
                  <BadgeList values={anatomyTagLabels} />
                </MetaRow>
              ) : null}
              {annotationLabels.length > 0 || dataset.ai_generated_labels ? (
                <MetaRow label="Annotations">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {annotationLabels.length > 0 ? (
                      <BadgeList values={annotationLabels} />
                    ) : null}
                    {dataset.ai_generated_labels ? (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <SparklesIcon className="size-3" />
                        AI generated labels
                      </Badge>
                    ) : null}
                  </div>
                </MetaRow>
              ) : null}
              {dataset.dimensionality ? (
                <MetaRow label="Dimensions">
                  <Badge variant="secondary">
                    {vocabularyLabel(
                      vocab,
                      "dimensionality",
                      dataset.dimensionality,
                    )}
                  </Badge>
                </MetaRow>
              ) : null}
              <MetaRow label="Longitudinal">
                <Badge variant={dataset.is_longitudinal ? "secondary" : "outline"}>
                  {dataset.is_longitudinal ? "Yes" : "No"}
                </Badge>
              </MetaRow>
              {dataset.primary_tumor_location?.trim() ? (
                <MetaRow label="Primary tumor location">
                  {dataset.primary_tumor_location.trim()}
                </MetaRow>
              ) : null}
              {dataset.field_of_view?.trim() ? (
                <MetaRow label="Field of view">
                  {dataset.field_of_view.trim()}
                </MetaRow>
              ) : null}
              {dataset.download_status ? (
                <MetaRow label="Download status">
                  {downloadStatusLabel(dataset.download_status)}
                </MetaRow>
              ) : null}
              {dataset.phase?.trim() ? (
                <MetaRow label="Phase">{dataset.phase.trim()}</MetaRow>
              ) : null}
              {dataset.main_disease_type?.trim() ? (
                <MetaRow label="Main disease type">
                  {dataset.main_disease_type.trim()}
                </MetaRow>
              ) : null}

              <MetaRow label="Id">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-muted-foreground">
                  {dataset.id}
                </code>
              </MetaRow>
              <MetaRow label="Created by">{dataset.created_by}</MetaRow>
              <MetaRow label="Created">
                <span className="font-mono text-sm text-muted-foreground">
                  {formatWhen(dataset.created_at)}
                </span>
              </MetaRow>
              <MetaRow label="Updated">
                <span className="font-mono text-sm text-muted-foreground">
                  {formatWhen(dataset.updated_at)}
                </span>
              </MetaRow>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
