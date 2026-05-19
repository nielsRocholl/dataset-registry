"use client";

import { useMemo, useState } from "react";
import { PlusIcon, Settings2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATALOGUE_FORM_FIELD_BODY_SCOPE } from "@/lib/catalogue/catalogue-form-field-scope";
import type { ClassificationFieldId } from "@/lib/catalogue/classification-vocabulary";
import {
  CLASSIFICATION_VOCABULARY_FIELDS,
  classificationFieldHumanTitle,
} from "@/lib/catalogue/classification-vocabulary";
import { cn } from "@/lib/utils";

export type ClassificationOptionRow = {
  value: string;
  label: string;
  usageCount: number;
};

export function AdminClassificationPanel({
  initialOptions,
}: {
  initialOptions: Record<ClassificationFieldId, ClassificationOptionRow[]>;
}) {
  const [field, setField] =
    useState<ClassificationFieldId>("modality");
  const [rows, setRows] =
    useState<Record<ClassificationFieldId, ClassificationOptionRow[]>>(
      initialOptions,
    );

  const [valueIn, setValueIn] = useState("");
  const [labelIn, setLabelIn] = useState("");
  const [pending, setPending] = useState(false);
  const [highlightAddRow, setHighlightAddRow] = useState(false);
  /** Hard errors — inline under the list only; no modal. */
  const [error, setError] = useState<string | null>(null);
  const [enteredSlug, setEnteredSlug] = useState<string | null>(null);
  const [exitingSlug, setExitingSlug] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    row: ClassificationOptionRow;
  } | null>(null);

  const sortedRows = useMemo(() => {
    const xs = [...(rows[field] ?? [])];
    xs.sort((a, b) => a.label.localeCompare(b.label));
    return xs;
  }, [rows, field]);

  async function reload() {
    const res = await fetch("/api/admin/classification", {
      credentials: "include",
    });
    const body: unknown = await res.json().catch(() => ({}));
    if (!res.ok || !body || typeof body !== "object") return false;
    if ("options" in body && typeof (body as { options: unknown }).options === "object") {
      setRows((body as { options: typeof rows }).options);
      return true;
    }
    return false;
  }

  const showEmptySkeleton =
    pending && sortedRows.length === 0 && !exitingSlug;

  async function addTerm() {
    setPending(true);
    setError(null);
    const slugAdded = valueIn.trim();
    try {
      const res = await fetch("/api/admin/classification", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          value: valueIn,
          label: labelIn,
        }),
      });
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Add failed (${res.status})`,
        );
        return;
      }
      setValueIn("");
      setLabelIn("");
      await reload();
      if (slugAdded) {
        setEnteredSlug(slugAdded);
        window.setTimeout(() => setEnteredSlug(null), 400);
      }
    } finally {
      setPending(false);
    }
  }

  async function removeTermConfirmed() {
    if (!deleteTarget) return;
    setPending(true);
    setError(null);
    const { row } = deleteTarget;
    try {
      const params = new URLSearchParams({
        field,
        value: row.value,
      });
      const res = await fetch(
        `/api/admin/classification?${params.toString()}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const body: unknown = await res.json().catch(() => ({}));
      setDeleteTarget(null);
      if (!res.ok) {
        setError(
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Remove failed (${res.status})`,
        );
        return;
      }
      setExitingSlug(row.value);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 220);
      });
      setExitingSlug(null);
      await reload();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-border/30 p-7 pb-6 pt-7">
          <div className="border-l-2 border-[#C4674F]/50 pl-3">
            <div className="flex items-center gap-2">
              <Settings2Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="text-[13px] font-semibold tracking-[0.02em] text-foreground/80">
                Classification vocabulary
              </span>
            </div>
          </div>
          <p className="mt-2 text-[12px] italic leading-snug text-muted-foreground/55">
            Manage the controlled options available in dataset forms.
          </p>
        </div>

        <div className={cn("flex flex-col p-7", CATALOGUE_FORM_FIELD_BODY_SCOPE)}>
          <nav
            className="-mb-px mb-6 flex flex-wrap gap-1 border-b border-border/30 pb-0"
            aria-label="Classification field"
            role="tablist"
          >
            {CLASSIFICATION_VOCABULARY_FIELDS.map((id) => {
              const active = field === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setField(id)}
                  className={cn(
                    "cursor-pointer rounded-t-md px-3 py-2 text-[13px] transition-colors",
                    active
                      ? "-mb-px border-b-2 border-[#C4674F] bg-transparent font-medium text-foreground"
                      : "text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground/80",
                  )}
                >
                  {classificationFieldHumanTitle(id)}
                </button>
              );
            })}
          </nav>

          <div
            className={cn(
              "mb-4 border-b border-border/20 pb-4 transition-[box-shadow] duration-150",
              highlightAddRow && "rounded-lg ring-1 ring-[#C4674F]/15",
            )}
            onFocusCapture={() => setHighlightAddRow(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setHighlightAddRow(false);
              }
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="class-value"
                value={valueIn}
                onChange={(e) => setValueIn(e.target.value)}
                placeholder="e.g. pet-ct"
                disabled={pending}
                className="h-9 w-[180px] max-w-[min(180px,100%)] shrink-0 font-mono text-[13px]"
                aria-label="Value slug"
              />
              <Input
                id="class-label"
                value={labelIn}
                onChange={(e) => setLabelIn(e.target.value)}
                placeholder="e.g. PET-CT"
                disabled={pending}
                className="h-9 min-w-0 flex-1 text-[13px]"
                aria-label="Display label"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={pending}
                aria-label="Add option"
                className="size-9 shrink-0 hover:bg-[#C4674F]/8 hover:text-[#C4674F]"
                onClick={() => void addTerm()}
              >
                <PlusIcon className="size-4" aria-hidden />
              </Button>
            </div>
            <p className="mt-2 text-[11px] italic text-muted-foreground/50">
              Value: lowercase, digits, hyphens. Label: display name shown in
              forms and filters.
            </p>
          </div>

          {showEmptySkeleton ? (
            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-20 animate-pulse rounded-full bg-muted/60" />
              <div className="h-8 w-28 animate-pulse rounded-full bg-muted/60" />
              <div className="h-8 w-24 animate-pulse rounded-full bg-muted/60" />
              <div className="h-8 w-32 animate-pulse rounded-full bg-muted/60" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-muted/60" />
            </div>
          ) : sortedRows.length === 0 ? (
            <p className="py-8 text-center text-[13px] italic text-muted-foreground/45">
              No options yet. Add the first one above.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedRows.map((row) => {
                const blocked = row.usageCount > 0;
                const isExiting = exitingSlug === row.value;
                return (
                  <div
                    key={row.value}
                    className={cn(
                      "flex h-8 max-w-full shrink-0 items-center gap-2 rounded-full border border-border/60 bg-transparent pl-3 pr-1 text-[13px] transition-opacity duration-200",
                      enteredSlug === row.value &&
                        "animate-in fade-in duration-300",
                      isExiting && "opacity-0",
                    )}
                  >
                    <span className="truncate font-mono text-foreground/80">
                      {row.value}
                    </span>
                    <span className="shrink-0 text-muted-foreground/50">
                      ·
                    </span>
                    <span className="min-w-0 truncate text-[12px] text-muted-foreground/60">
                      {row.label}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground/45">
                      {row.usageCount}
                    </span>
                    <button
                      type="button"
                      disabled={blocked || pending}
                      title={
                        blocked
                          ? "Remove datasets using this option first"
                          : undefined
                      }
                      aria-label={
                        blocked
                          ? "Cannot remove — still in use"
                          : "Remove option"
                      }
                      onClick={() => {
                        if (blocked || pending) return;
                        setDeleteTarget({ row });
                      }}
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30",
                      )}
                    >
                      <XIcon className="size-3 shrink-0" aria-hidden strokeWidth={2.25} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {error ? (
            <p className="mt-4 text-[13px] text-destructive/70">{error}</p>
          ) : null}
        </div>
      </section>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent
          showCloseButton
          className="gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-[var(--shadow-soft)] ring-0 sm:max-w-sm"
        >
          <div className="flex flex-col gap-4 px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
            <DialogHeader className="gap-3">
              <DialogTitle className="font-display text-[length:var(--text-xl)] leading-tight text-foreground">
                Remove {deleteTarget ? deleteTarget.row.label : ""}?
              </DialogTitle>
              <DialogDescription>
                <div className="space-y-2 text-[length:var(--text-sm)] leading-relaxed text-muted-foreground">
                  {deleteTarget ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Value:{" "}
                        <code className="font-mono text-sm text-foreground">
                          {deleteTarget.row.value}
                        </code>
                      </p>
                      <p>
                        {deleteTarget.row.usageCount > 0
                          ? `Used in ${deleteTarget.row.usageCount} ${deleteTarget.row.usageCount === 1 ? "dataset" : "datasets"}.`
                          : "Not used in any datasets."}
                      </p>
                    </>
                  ) : null}
                </div>
              </DialogDescription>
            </DialogHeader>
            {deleteTarget !== null && deleteTarget.row.usageCount > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                This option is still used. Edit those datasets before removing.
              </div>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                pending ||
                (deleteTarget !== null && deleteTarget.row.usageCount > 0)
              }
              className="bg-destructive text-white hover:bg-destructive/90 dark:text-white"
              onClick={() => void removeTermConfirmed()}
            >
              {pending ? "Removing…" : "Remove option"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
