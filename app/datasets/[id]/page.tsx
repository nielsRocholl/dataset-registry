import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AsteriskIcon,
  ChevronLeftIcon,
  DatabaseIcon,
  FolderIcon,
  ShieldCheckIcon,
} from "lucide-react";

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
import { getDatasetIds } from "@/lib/catalogue/load-index";
import { getDatasetEntryServer } from "@/lib/catalogue/resolve-dataset-server";
import { getStarredDatasetIds } from "@/lib/catalogue/stars";
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
      <dt className="text-[length:var(--text-xs)] font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className={mono ? "break-all font-mono text-[length:var(--text-sm)]" : "text-[length:var(--text-sm)]"}>
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
  const dataset = await getDatasetEntryServer(id);
  if (!dataset) {
    notFound();
  }

  const user = await getCurrentCatalogueUser();
  const canEdit = await getCanMutateDataset(dataset);
  const starredDatasetIds = user ? await getStarredDatasetIds(user.id) : [];
  const isStarred = starredDatasetIds.includes(dataset.id);

  return (
    <main className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-7 pb-16">
        <Link
          href="/datasets"
          className="group inline-flex w-fit items-center gap-2 text-[length:var(--text-sm)] font-medium text-muted-foreground outline-none transition-[color] duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <ChevronLeftIcon className="size-4 shrink-0 transition-transform duration-[var(--duration-fast)] [transition-timing-function:var(--ease-out-quart)] group-hover:-translate-x-0.5" aria-hidden />
          Back to datasets
        </Link>

        <header className="rounded-3xl border border-border bg-card px-5 py-5 shadow-[var(--shadow-soft)] sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <AsteriskIcon className="mt-1 size-9 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <p className="ui-kicker">Dataset</p>
                  <h1 className="ui-title mt-2 text-[length:var(--text-3xl)]">
                    {dataset.name}
                  </h1>
                  <p className="ui-copy mt-3 text-[length:var(--text-sm)]">
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
              <Badge variant="secondary">{dataset.modality}</Badge>
              <Badge variant="outline">{dataset.anatomy}</Badge>
              <Badge variant="outline">{dataset.task}</Badge>
              <Badge variant="outline">{dataset.access_level}</Badge>
              <Badge variant="outline">Created by {dataset.created_by}</Badge>
              {dataset.status ? <Badge variant="secondary">{dataset.status}</Badge> : null}
            </div>
          </div>
        </header>

        <div className="grid gap-3">
          <Card size="sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FolderIcon aria-hidden />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="grid gap-3">
                <DetailRow
                  label="Storage path"
                  value={dataset.internal_storage_path}
                  mono
                />
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
                  <p className="ui-copy whitespace-pre-wrap text-[length:var(--text-sm)]">
                    {dataset.access_notes}
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>

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
                  <DetailRow label="Dimensions" value={dataset.dimensionality} />
                ) : null}
              </dl>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
