"use client";

import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DatasetDeleteButtonProps = {
  datasetId: string;
  datasetName: string;
  /** Defaults to `/datasets`. Use parent detail URL when deleting a derivative. */
  redirectTo?: string;
  isDerivative?: boolean;
  /** Icon-only trigger for dense rows (e.g. derivatives panel). */
  compact?: boolean;
};

export function DatasetDeleteButton({
  datasetId,
  datasetName,
  redirectTo = "/datasets",
  isDerivative = false,
  compact = false,
}: DatasetDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteDataset() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/catalogue/datasets/${datasetId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof body === "object" && body && "error" in body
            ? String((body as { error: unknown }).error)
            : `Delete failed (${res.status})`;
        setError(msg);
        return;
      }
      setOpen(false);
      router.replace(redirectTo);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {compact ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${datasetName}`}
          onClick={() => setOpen(true)}
        >
          <Trash2Icon className="size-3.5" aria-hidden />
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Trash2Icon data-icon="inline-start" />
          Delete
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-[var(--shadow-soft)] ring-0 sm:max-w-[28rem]"
        >
          <div className="flex flex-col gap-4 px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
            <DialogHeader className="gap-3">
              <DialogTitle className="font-display text-[length:var(--text-xl)] leading-tight text-foreground">
                {isDerivative ? "Delete this derivative?" : "Delete this dataset?"}
              </DialogTitle>
              <DialogDescription className="text-[length:var(--text-sm)] leading-relaxed text-muted-foreground">
                {isDerivative
                  ? "This removes only this derivative's catalogue entry from GitHub. The parent dataset is not affected."
                  : "This will remove the catalogue JSON and any Markdown description from GitHub. Git history remains the recovery path."}
              </DialogDescription>
            </DialogHeader>
            <p className="rounded-2xl border border-border bg-muted/50 px-3 py-2 text-[length:var(--text-sm)] font-medium text-foreground">
              {datasetName}
            </p>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not delete</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void deleteDataset()}
            >
              {pending
                ? "Deleting..."
                : isDerivative
                  ? "Delete derivative"
                  : "Delete dataset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
