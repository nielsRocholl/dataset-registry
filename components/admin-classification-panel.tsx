"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  Loader2Icon,
  PlusIcon,
  Settings2Icon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATALOGUE_FORM_FIELD_SCOPE } from "@/lib/catalogue/catalogue-form-field-scope";
import {
  CATALOGUE_CHIP_CN,
  CATALOGUE_SECTION_CARD_CN,
  CATALOGUE_SECTION_DESC_CN,
  CATALOGUE_SECTION_HEADER_CN,
  CATALOGUE_SECTION_TITLE_ACCENT_CN,
  CATALOGUE_SECTION_TITLE_CN,
} from "@/lib/catalogue/catalogue-surface-styles";
import type { ClassificationFieldId } from "@/lib/catalogue/classification-vocabulary";
import {
  CLASSIFICATION_VOCABULARY_FIELDS,
  classificationFieldHumanTitle,
} from "@/lib/catalogue/classification-vocabulary";
import { cn } from "@/lib/utils";

type AddDialogPhase = "loading" | "success" | "error";

function isOptionsRecord(
  x: unknown,
): x is Record<ClassificationFieldId, ClassificationOptionRow[]> {
  if (!x || typeof x !== "object") return false;
  for (const id of CLASSIFICATION_VOCABULARY_FIELDS) {
    const bucket = (x as Record<string, unknown>)[id];
    if (!Array.isArray(bucket)) return false;
  }
  return true;
}

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
  const router = useRouter();
  const [field, setField] =
    useState<ClassificationFieldId>("modality");
  const [rows, setRows] =
    useState<Record<ClassificationFieldId, ClassificationOptionRow[]>>(
      initialOptions,
    );

  const [valueIn, setValueIn] = useState("");
  const [labelIn, setLabelIn] = useState("");
  const [addPending, setAddPending] = useState(false);
  const [removePending, setRemovePending] = useState(false);
  const [highlightAddRow, setHighlightAddRow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enteredSlug, setEnteredSlug] = useState<string | null>(null);
  const [exitingSlug, setExitingSlug] = useState<string | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogPhase, setAddDialogPhase] =
    useState<AddDialogPhase>("loading");
  const [addDialogError, setAddDialogError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    row: ClassificationOptionRow;
  } | null>(null);

  const sortedRows = useMemo(() => {
    const xs = [...(rows[field] ?? [])];
    xs.sort((a, b) => a.label.localeCompare(b.label));
    return xs;
  }, [rows, field]);

  const reloadOptions = useCallback(async () => {
    const res = await fetch("/api/admin/classification", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body: unknown = await res.json().catch(() => null);
    if (!body || typeof body !== "object" || !("options" in body)) return null;
    const options = (body as { options: unknown }).options;
    if (!isOptionsRecord(options)) return null;
    setRows(options);
    return options;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/admin/classification", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok || cancelled) return;
      const body: unknown = await res.json().catch(() => null);
      if (
        cancelled ||
        !body ||
        typeof body !== "object" ||
        !("options" in body)
      ) {
        return;
      }
      const options = (body as { options: unknown }).options;
      if (isOptionsRecord(options)) setRows(options);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showEmptySkeleton =
    addPending && sortedRows.length === 0 && !exitingSlug;

  async function addTerm() {
    const slugAdded = valueIn.trim();
    const labelAdded = labelIn.trim();
    if (!slugAdded || !labelAdded) {
      setError("Slug and label are required.");
      return;
    }

    setAddPending(true);
    setError(null);
    setAddDialogError(null);
    setAddDialogPhase("loading");
    setAddDialogOpen(true);

    try {
      const res = await fetch("/api/admin/classification", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          value: slugAdded,
          label: labelAdded,
        }),
      });
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Add failed (${res.status})`;
        setAddDialogPhase("error");
        setAddDialogError(msg);
        setError(msg);
        return;
      }

      if (body && typeof body === "object" && "options" in body) {
        const options = (body as { options: unknown }).options;
        if (isOptionsRecord(options)) setRows(options);
      } else {
        await reloadOptions();
      }
      router.refresh();

      setValueIn("");
      setLabelIn("");
      setAddDialogPhase("success");
      if (slugAdded) {
        setEnteredSlug(slugAdded);
        window.setTimeout(() => setEnteredSlug(null), 400);
      }
      window.setTimeout(() => setAddDialogOpen(false), 700);
    } finally {
      setAddPending(false);
    }
  }

  async function removeTermConfirmed() {
    if (!deleteTarget) return;
    setRemovePending(true);
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

      let fresh: Record<ClassificationFieldId, ClassificationOptionRow[]> | null =
        null;
      if (res.ok && body && typeof body === "object" && "options" in body) {
        const options = (body as { options: unknown }).options;
        if (isOptionsRecord(options)) {
          setRows(options);
          fresh = options;
        }
      }
      if (!fresh) fresh = await reloadOptions();

      if (!res.ok) {
        const stillPresent = (fresh ?? rows)[field]?.some(
          (r) => r.value === row.value,
        );
        if (!stillPresent) {
          setError(null);
          router.refresh();
          setExitingSlug(row.value);
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 220);
          });
          setExitingSlug(null);
          return;
        }
        setError(
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Remove failed (${res.status})`,
        );
        return;
      }

      setError(null);
      router.refresh();
      setExitingSlug(row.value);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 220);
      });
      setExitingSlug(null);
    } finally {
      setRemovePending(false);
    }
  }

  return (
    <>
      <section
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_1px_4px_rgba(0,0,0,0.04)]",
          CATALOGUE_SECTION_CARD_CN,
        )}
      >
        <div
          className={cn(
            "border-b border-border/30 p-7 pb-6 pt-7",
            CATALOGUE_SECTION_HEADER_CN,
          )}
        >
          <div
            className={cn(
              "border-l-2 border-[#C4674F]/50 pl-3",
              CATALOGUE_SECTION_TITLE_ACCENT_CN,
            )}
          >
            <div className="flex items-center gap-2">
              <Settings2Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span
                className={cn(
                  "text-[13px] font-semibold tracking-[0.02em] text-foreground/80",
                  CATALOGUE_SECTION_TITLE_CN,
                )}
              >
                Classification vocabulary
              </span>
            </div>
          </div>
          <p
            className={cn(
              "mt-2 text-[12px] italic leading-snug text-muted-foreground/55",
              CATALOGUE_SECTION_DESC_CN,
            )}
          >
            Manage the controlled options available in dataset forms.
          </p>
        </div>

        <div className={cn("flex flex-col p-7", CATALOGUE_FORM_FIELD_SCOPE)}>
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
                      ? "-mb-px border-b-2 border-[#C4674F] bg-transparent font-medium text-foreground dark:border-[#C4674F] dark:text-white/85"
                      : "text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground/80 dark:text-white/45 dark:hover:bg-white/[0.04] dark:hover:text-white/70",
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
                placeholder="Slug — head_neck"
                disabled={addPending}
                className="h-9 w-[180px] max-w-[min(180px,100%)] shrink-0 font-mono text-[13px]"
                aria-label="Stable value slug stored in dataset JSON"
              />
              <Input
                id="class-label"
                value={labelIn}
                onChange={(e) => setLabelIn(e.target.value)}
                placeholder="Label — Head & neck"
                disabled={addPending}
                className="h-9 min-w-0 flex-1 text-[13px]"
                aria-label="Display label shown in forms and filters"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={addPending}
                aria-label="Add option"
                className="size-9 shrink-0 hover:bg-[#C4674F]/8 hover:text-[#C4674F]"
                onClick={() => void addTerm()}
              >
                <PlusIcon className="size-4" aria-hidden />
              </Button>
            </div>
            <p className="mt-2 text-[11px] italic text-muted-foreground/50">
              Slug is the stable ID saved in dataset JSON; label is what
              researchers see in forms and filter chips.
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
                      CATALOGUE_CHIP_CN,
                      enteredSlug === row.value &&
                        "animate-in fade-in duration-300",
                      isExiting && "opacity-0",
                    )}
                  >
                    <span className="truncate font-mono text-foreground/80 dark:text-[#a8c4a2]">
                      {row.value}
                    </span>
                    <span className="shrink-0 text-muted-foreground/50 dark:text-white/30">
                      ·
                    </span>
                    <span className="min-w-0 truncate text-[12px] text-muted-foreground/60 dark:text-white/50">
                      {row.label}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground/45 dark:text-white/38">
                      {row.usageCount}
                    </span>
                    <button
                      type="button"
                      disabled={blocked || addPending || removePending}
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
                        if (blocked || addPending || removePending) return;
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
              <DialogDescription className="text-[length:var(--text-sm)] leading-relaxed text-muted-foreground">
                {deleteTarget
                  ? deleteTarget.row.usageCount > 0
                    ? `Used in ${deleteTarget.row.usageCount} ${deleteTarget.row.usageCount === 1 ? "dataset" : "datasets"}.`
                    : "Not used in any datasets."
                  : ""}
              </DialogDescription>
            </DialogHeader>
            {deleteTarget ? (
              <p className="text-[length:var(--text-sm)] text-muted-foreground">
                Value:{" "}
                <code className="font-mono text-sm text-foreground">
                  {deleteTarget.row.value}
                </code>
              </p>
            ) : null}
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
              disabled={removePending}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                removePending ||
                (deleteTarget !== null && deleteTarget.row.usageCount > 0)
              }
              className="bg-destructive text-white hover:bg-destructive/90 dark:text-white"
              onClick={() => void removeTermConfirmed()}
            >
              {removePending ? "Removing…" : "Remove option"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          if (!addPending) setAddDialogOpen(open);
        }}
      >
        <DialogContent
          showCloseButton={addDialogPhase === "error"}
          className="gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-[var(--shadow-soft)] ring-0 sm:max-w-xs"
        >
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center sm:px-7">
            {addDialogPhase === "loading" ? (
              <Loader2Icon
                className="size-8 animate-spin text-[#C4674F]"
                aria-hidden
              />
            ) : addDialogPhase === "success" ? (
              <CheckCircle2Icon
                className="size-8 text-[#C4674F]"
                aria-hidden
              />
            ) : (
              <XIcon
                className="size-8 text-destructive/80"
                aria-hidden
                strokeWidth={2}
              />
            )}
            <DialogHeader className="items-center gap-1">
              <DialogTitle className="font-display text-[length:var(--text-lg)] text-foreground">
                {addDialogPhase === "loading"
                  ? "Adding option…"
                  : addDialogPhase === "success"
                    ? "Option added"
                    : "Could not add"}
              </DialogTitle>
              {addDialogPhase === "error" && addDialogError ? (
                <DialogDescription className="text-[length:var(--text-sm)] text-muted-foreground">
                  {addDialogError}
                </DialogDescription>
              ) : addDialogPhase === "success" ? (
                <DialogDescription className="text-[length:var(--text-sm)] text-muted-foreground">
                  The list below has been updated.
                </DialogDescription>
              ) : null}
            </DialogHeader>
            {addDialogPhase === "error" ? (
              <Button
                type="button"
                variant="outline"
                className="mt-1"
                onClick={() => setAddDialogOpen(false)}
              >
                Close
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
