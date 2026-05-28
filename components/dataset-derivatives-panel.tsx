"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon, GitForkIcon, PlusIcon } from "lucide-react";

import { CopyClipboardButton } from "@/components/copy-clipboard-button";
import { DatasetDeleteButton } from "@/components/dataset-delete-button";
import { DerivativeNoteMarkdown } from "@/components/derivative-note-markdown";
import { buttonVariants } from "@/components/ui/button";
import {
  CATALOGUE_SECTION_CARD_CN,
  CATALOGUE_SECTION_HEADER_CN,
  CATALOGUE_SECTION_TITLE_ACCENT_CN,
  CATALOGUE_SECTION_TITLE_CN,
} from "@/lib/catalogue/catalogue-surface-styles";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import {
  canMutateDataset,
  type CatalogueUser,
} from "@/lib/catalogue/user-profile";
import { cn } from "@/lib/utils";

type DatasetDerivativesPanelProps = {
  parentId: string;
  derivatives: DatasetCatalogueEntry[];
  canEdit: boolean;
  user: CatalogueUser | null;
  /** When set, that derivative row starts expanded (current detail page). */
  activeDatasetId?: string;
};

function DerivativeRow({
  derivative,
  defaultOpen,
  parentId,
  user,
}: {
  derivative: DatasetCatalogueEntry;
  defaultOpen: boolean;
  parentId: string;
  user: CatalogueUser | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const canDelete = user ? canMutateDataset(user, derivative) : false;

  return (
    <div className="border-b border-border/30 last:border-0 dark:border-white/[0.08]">
      <div className="flex w-full items-start gap-3 px-6 py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-0.5 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          aria-expanded={open}
          aria-label={open ? "Collapse derivative" : "Expand derivative"}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 text-muted-foreground/60 transition-transform duration-150",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground dark:text-white/90">
            {derivative.name}
          </p>
          {!open && derivative.derivative_note ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground/70 dark:text-white/45">
              {derivative.derivative_note}
            </p>
          ) : null}
        </div>
        {canDelete ? (
          <DatasetDeleteButton
            datasetId={derivative.id}
            datasetName={derivative.name}
            redirectTo={`/datasets/${parentId}`}
            isDerivative
            compact
          />
        ) : null}
      </div>
      {open ? (
        <div className="space-y-4 border-t border-border/20 px-6 pb-5 pt-4 pl-[3.25rem] dark:border-white/[0.06]">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground/60 dark:text-white/38">
              What changed
            </p>
            {derivative.derivative_note ? (
              <DerivativeNoteMarkdown content={derivative.derivative_note} />
            ) : (
              <p className="text-sm text-muted-foreground/60 dark:text-white/40">
                No change description recorded.
              </p>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground/60 dark:text-white/38">
              Storage path
            </p>
            {derivative.storage_on_server === false ? (
              <p className="text-sm text-muted-foreground/70 dark:text-white/45">
                Not on group storage
              </p>
            ) : derivative.internal_storage_path ? (
              <div className="flex min-w-0 items-start gap-1">
                <code className="min-w-0 flex-1 break-all rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-muted-foreground">
                  {derivative.internal_storage_path}
                </code>
                <CopyClipboardButton
                  text={derivative.internal_storage_path}
                  label="Copy storage path"
                  iconOnly
                  className="mt-px shrink-0"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/60 dark:text-white/40">
                Storage path not recorded.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DatasetDerivativesPanel({
  parentId,
  derivatives,
  canEdit,
  user,
  activeDatasetId,
}: DatasetDerivativesPanelProps) {
  if (derivatives.length === 0 && !canEdit) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_1px_4px_rgba(0,0,0,0.04)]",
        CATALOGUE_SECTION_CARD_CN,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-4 border-b border-border/30 px-6 py-5",
          CATALOGUE_SECTION_HEADER_CN,
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <GitForkIcon className="size-4 shrink-0 text-muted-foreground/70" />
          <div className="min-w-0">
            <h2
              className={cn(
                "text-sm font-semibold tracking-wide text-foreground",
                CATALOGUE_SECTION_TITLE_CN,
              )}
            >
              <span className={CATALOGUE_SECTION_TITLE_ACCENT_CN} aria-hidden />
              Derivatives
              {derivatives.length > 0 ? (
                <span className="ml-2 font-normal text-muted-foreground/60 dark:text-white/40">
                  {derivatives.length}
                </span>
              ) : null}
            </h2>
          </div>
        </div>
        {canEdit ? (
          <Link
            href={`/datasets/new?parent=${encodeURIComponent(parentId)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "shrink-0 text-muted-foreground hover:text-foreground",
            )}
          >
            <PlusIcon className="mr-1.5 size-3.5" aria-hidden />
            Add derivative
          </Link>
        ) : null}
      </div>
      {derivatives.length > 0 ? (
        <div>
          {derivatives.map((d) => (
            <DerivativeRow
              key={d.id}
              derivative={d}
              defaultOpen={d.id === activeDatasetId}
              parentId={parentId}
              user={user}
            />
          ))}
        </div>
      ) : (
        <p className="px-6 py-5 text-sm text-muted-foreground/70 dark:text-white/45">
          No derivatives yet. Add one to record a variant of this dataset.
        </p>
      )}
    </div>
  );
}
