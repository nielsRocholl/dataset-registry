"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AsteriskIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCESS_LEVELS,
  DIMENSIONALITIES,
  MODALITIES,
  NONE,
  STATUSES,
  TASKS,
} from "@/lib/catalogue/dataset-form-options";
import { validateDatasetPayload } from "@/lib/catalogue/dataset-validator";
import { assertDatasetSlug } from "@/lib/catalogue/path";
import type {
  AccessLevel,
  DatasetCatalogueEntry,
  DatasetStatus,
  Dimensionality,
  Modality,
  Task,
} from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

type SuccessModalState = {
  id: string;
  kind: "new" | "edit";
  partialNote?: string;
};

type EditorProps =
  | { mode: "new" }
  | { mode: "edit"; initialDataset: DatasetCatalogueEntry };

// Fields that have required inline validation
const TEXT_REQUIRED = [
  "id",
  "name",
  "short_description",
  "internal_storage_path",
  "anatomy",
  "created_by",
] as const;
type RequiredTextField = (typeof TEXT_REQUIRED)[number];

function selectItems<T extends string>(values: T[], mapLabel: (v: T) => string) {
  return values.map((value) => ({ label: mapLabel(value), value }));
}

function buildPayload(
  mode: "new" | "edit",
  values: {
    id: string;
    name: string;
    short_description: string;
    internal_storage_path: string;
    modality: Modality;
    anatomy: string;
    task: Task;
    access_level: AccessLevel;
    created_by: string;
    status: string;
    n_patients: string;
    n_studies: string;
    n_images: string;
    dimensionality: string;
    license: string;
    access_notes: string;
  },
  initial: DatasetCatalogueEntry | undefined,
): Record<string, unknown> {
  const id =
    mode === "edit" && initial
      ? initial.id
      : values.id.trim().toLowerCase();
  const now = new Date().toISOString();
  const o: Record<string, unknown> = {
    id,
    name: values.name.trim(),
    short_description: values.short_description.trim(),
    internal_storage_path: values.internal_storage_path.trim(),
    modality: values.modality,
    anatomy: values.anatomy.trim(),
    task: values.task,
    access_level: values.access_level,
    created_by:
      mode === "edit" && initial
        ? initial.created_by
        : values.created_by.trim(),
    created_at: mode === "edit" && initial ? initial.created_at : now,
    updated_at: now,
  };
  if (values.status && values.status !== NONE) {
    o.status = values.status as DatasetStatus;
  }
  const np = parseCount(values.n_patients);
  if (np !== undefined) o.n_patients = np;
  const ns = parseCount(values.n_studies);
  if (ns !== undefined) o.n_studies = ns;
  const ni = parseCount(values.n_images);
  if (ni !== undefined) o.n_images = ni;
  if (values.dimensionality && values.dimensionality !== NONE) {
    o.dimensionality = values.dimensionality as Dimensionality;
  }
  if (values.license.trim()) o.license = values.license.trim();
  if (values.access_notes.trim()) o.access_notes = values.access_notes.trim();
  return o;
}

function parseCount(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

// Human-readable per-field error messages
function fieldError(field: RequiredTextField, value: string, mode: "new" | "edit"): string | null {
  if (field === "id") {
    if (mode === "edit") return null;
    if (!value.trim()) return "An id is required.";
    if (!assertDatasetSlug(value.trim().toLowerCase()))
      return "Use lowercase letters, digits and hyphens only (e.g. my-dataset-01).";
    return null;
  }
  const labels: Record<RequiredTextField, string> = {
    id: "Id",
    name: "Name",
    short_description: "Description",
    internal_storage_path: "Internal storage path",
    anatomy: "Anatomy",
    created_by: "Created by",
  };
  if (!value.trim()) return `${labels[field]} is required.`;
  return null;
}

// Asterisk required indicator appended to label text
function Req() {
  return (
    <span className="ml-0.5 text-brand" aria-hidden>
      *
    </span>
  );
}

export function DatasetEditorForm(props: EditorProps) {
  const router = useRouter();
  const mode = props.mode;
  const initial = props.mode === "edit" ? props.initialDataset : undefined;
  const lockedId = initial?.id;
  const formRef = useRef<HTMLFormElement>(null);

  const [id, setId] = useState(initial?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [short_description, setShortDescription] = useState(
    initial?.short_description ?? "",
  );
  const [internal_storage_path, setInternalStoragePath] = useState(
    initial?.internal_storage_path ?? "",
  );
  const [modality, setModality] = useState<Modality>(
    initial?.modality ?? "CT",
  );
  const [anatomy, setAnatomy] = useState(initial?.anatomy ?? "");
  const [task, setTask] = useState<Task>(initial?.task ?? "segmentation");
  const [access_level, setAccessLevel] = useState<AccessLevel>(
    initial?.access_level ?? "internal",
  );
  const [created_by, setCreatedBy] = useState(
    mode === "edit" ? (initial?.created_by ?? "") : "",
  );
  const [status, setStatus] = useState(initial?.status ?? NONE);
  const [n_patients, setNPatients] = useState(
    initial?.n_patients != null ? String(initial.n_patients) : "",
  );
  const [n_studies, setNStudies] = useState(
    initial?.n_studies != null ? String(initial.n_studies) : "",
  );
  const [n_images, setNImages] = useState(
    initial?.n_images != null ? String(initial.n_images) : "",
  );
  const [dimensionality, setDimensionality] = useState(
    initial?.dimensionality ?? NONE,
  );
  const [license, setLicense] = useState(initial?.license ?? "");
  const [access_notes, setAccessNotes] = useState(initial?.access_notes ?? "");
  const [markdown, setMarkdown] = useState("");
  const [initialMarkdown, setInitialMarkdown] = useState("");

  // Per-field touched state — errors only show after blur or submit attempt
  const [touched, setTouched] = useState<
    Partial<Record<RequiredTextField, boolean>>
  >({});

  const [pending, setPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalState | null>(
    null,
  );

  function resetNewForm() {
    setId("");
    setName("");
    setShortDescription("");
    setInternalStoragePath("");
    setModality("CT");
    setAnatomy("");
    setTask("segmentation");
    setAccessLevel("internal");
    setCreatedBy("");
    setStatus(NONE);
    setNPatients("");
    setNStudies("");
    setNImages("");
    setDimensionality(NONE);
    setLicense("");
    setAccessNotes("");
    setMarkdown("");
    setInitialMarkdown("");
    setTouched({});
  }

  function touch(field: RequiredTextField) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function touchAll() {
    const all: Partial<Record<RequiredTextField, boolean>> = {};
    for (const f of TEXT_REQUIRED) all[f] = true;
    setTouched(all);
  }

  const fieldValues: Record<RequiredTextField, string> = useMemo(
    () => ({
      id,
      name,
      short_description,
      internal_storage_path,
      anatomy,
      created_by,
    }),
    [id, name, short_description, internal_storage_path, anatomy, created_by],
  );

  // Compute per-field errors only for touched fields
  const errors: Partial<Record<RequiredTextField, string>> = useMemo(() => {
    const result: Partial<Record<RequiredTextField, string>> = {};
    for (const f of TEXT_REQUIRED) {
      if (f === "created_by" && mode === "edit") continue;
      if (!touched[f]) continue;
      const err = fieldError(f, fieldValues[f], mode);
      if (err) result[f] = err;
    }
    return result;
  }, [touched, fieldValues, mode]);

  const hasFieldErrors = Object.keys(errors).length > 0;

  // Count empty required fields (for submit button hint)
  const emptyRequiredCount = useMemo(() => {
    let count = 0;
    for (const f of TEXT_REQUIRED) {
      if (f === "id" && mode === "edit") continue;
      if (f === "created_by" && mode === "edit") continue;
      const err = fieldError(f, fieldValues[f], mode);
      if (err) count++;
    }
    return count;
  }, [fieldValues, mode]);

  useEffect(() => {
    if (mode !== "edit" || !lockedId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/catalogue/datasets/${lockedId}/description`,
        { credentials: "include" },
      );
      if (cancelled) return;
      if (res.ok) {
        const t = await res.text();
        setMarkdown(t);
        setInitialMarkdown(t);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, lockedId]);

  const modalityItems = useMemo(() => selectItems(MODALITIES, (x) => x), []);
  const taskItems = useMemo(() => selectItems(TASKS, (x) => x), []);
  const accessItems = useMemo(() => selectItems(ACCESS_LEVELS, (x) => x), []);
  const statusItems = useMemo(
    () => [
      { label: "Not set", value: NONE },
      ...selectItems(STATUSES, (x) => x),
    ],
    [],
  );
  const dimItems = useMemo(
    () => [
      { label: "Not set", value: NONE },
      ...selectItems(DIMENSIONALITIES, (x) => x),
    ],
    [],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setSuccessModal(null);

    // Touch all required fields to reveal any inline errors
    touchAll();

    // Check for any required field violations first
    const anyEmpty = TEXT_REQUIRED.some((f) => {
      if (f === "id" && mode === "edit") return false;
      if (f === "created_by" && mode === "edit") return false;
      return !!fieldError(f, fieldValues[f], mode);
    });

    if (anyEmpty) {
      // Scroll to the first invalid field
      requestAnimationFrame(() => {
        const firstInvalid = formRef.current?.querySelector<HTMLElement>(
          "[aria-invalid='true'], [data-invalid='true']",
        );
        firstInvalid?.closest("[data-slot='field']")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return;
    }

    const slug =
      mode === "edit" && lockedId ? lockedId : id.trim().toLowerCase();

    if (mode === "new") {
      const probe = await fetch(`/api/catalogue/datasets/${slug}`, {
        credentials: "include",
      });
      if (probe.ok) {
        setApiError("A dataset with this id already exists — edit it instead.");
        return;
      }
    }

    const v = {
      id,
      name,
      short_description,
      internal_storage_path,
      modality,
      anatomy,
      task,
      access_level,
      created_by,
      status,
      n_patients,
      n_studies,
      n_images,
      dimensionality,
      license,
      access_notes,
    };

    const payload = buildPayload(mode, v, initial);
    const validated = validateDatasetPayload(payload, slug);
    if (!validated.ok) {
      // Shouldn't normally reach here if per-field checks pass, but guard anyway
      setApiError("Unexpected validation error — check all required fields.");
      return;
    }

    setPending(true);
    try {
      const putRes = await fetch(`/api/catalogue/datasets/${slug}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });
      const body: unknown = await putRes.json().catch(() => ({}));
      if (!putRes.ok) {
        const msg =
          typeof body === "object" && body && "error" in body
            ? String((body as { error: unknown }).error)
            : `Save failed (${putRes.status})`;
        setApiError(msg);
        return;
      }

      const md = markdown;
      const mdChanged =
        mode === "new" ? md.trim().length > 0 : md !== initialMarkdown;
      if (mdChanged) {
        const mdRes = await fetch(
          `/api/catalogue/datasets/${slug}/description`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
            body: md,
          },
        );
        if (!mdRes.ok) {
          const mb: unknown = await mdRes.json().catch(() => ({}));
          const msg =
            typeof mb === "object" && mb && "error" in mb
              ? String((mb as { error: unknown }).error)
              : `Description save failed (${mdRes.status})`;
          setSuccessModal({
            id: slug,
            kind: mode,
            partialNote: `The dataset file was saved, but the long description could not be saved: ${msg}`,
          });
          router.refresh();
          setInitialMarkdown(md);
          return;
        }
        setInitialMarkdown(md);
      }

      if (mode === "new") {
        resetNewForm();
        requestAnimationFrame(() => {
          formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
      router.refresh();
      setSuccessModal({ id: slug, kind: mode });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form
      ref={formRef}
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-5"
    >
      {/* API / network errors only — field errors appear inline */}
      {apiError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      ) : null}

      {/* ── Required fields ─────────────────────────────── */}
      <Card size="sm">
        <CardHeader className="border-b border-border">
          <CardTitle>
            Required fields
            {emptyRequiredCount > 0 ? (
              <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[length:var(--text-xs)] font-normal text-destructive">
                {emptyRequiredCount} missing
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <FieldGroup className="gap-6">
            {/* Id */}
            {mode === "edit" ? (
              <Field>
                <FieldLabel htmlFor="dataset-id">
                  Id
                </FieldLabel>
                <Input
                  id="dataset-id"
                  value={lockedId}
                  readOnly
                  disabled
                  className="font-mono"
                />
                <FieldDescription>
                  The id is permanent and cannot be changed after creation.
                </FieldDescription>
              </Field>
            ) : (
              <Field data-invalid={!!errors.id || undefined}>
                <FieldLabel htmlFor="dataset-id">
                  Id <Req />
                </FieldLabel>
                <Input
                  id="dataset-id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  onBlur={() => touch("id")}
                  className="font-mono"
                  autoComplete="off"
                  placeholder="e.g. lidc-idri-2024"
                  aria-invalid={!!errors.id}
                  aria-describedby={errors.id ? "dataset-id-error" : undefined}
                />
                {errors.id ? (
                  <FieldError id="dataset-id-error">{errors.id}</FieldError>
                ) : (
                  <FieldDescription>
                    Lowercase letters, digits, hyphens — matches the JSON
                    filename.
                  </FieldDescription>
                )}
              </Field>
            )}

            {/* Name */}
            <Field data-invalid={!!errors.name || undefined}>
              <FieldLabel htmlFor="dataset-name">
                Name <Req />
              </FieldLabel>
              <Input
                id="dataset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => touch("name")}
                placeholder="e.g. LIDC-IDRI Lung Nodule Dataset"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "dataset-name-error" : undefined}
              />
              {errors.name ? (
                <FieldError id="dataset-name-error">{errors.name}</FieldError>
              ) : null}
            </Field>

            {/* Description (JSON field: short_description) */}
            <Field data-invalid={!!errors.short_description || undefined}>
              <FieldLabel htmlFor="dataset-desc">
                Description <Req />
              </FieldLabel>
              <Textarea
                id="dataset-desc"
                value={short_description}
                onChange={(e) => setShortDescription(e.target.value)}
                onBlur={() => touch("short_description")}
                rows={4}
                placeholder="What the dataset is, what it contains, and typical uses — as long as needed (up to about 2000 characters)."
                aria-invalid={!!errors.short_description}
                aria-describedby={
                  errors.short_description ? "dataset-desc-error" : undefined
                }
              />
              {errors.short_description ? (
                <FieldError id="dataset-desc-error">
                  {errors.short_description}
                </FieldError>
              ) : null}
            </Field>

            {/* Internal storage path */}
            <Field
              data-invalid={!!errors.internal_storage_path || undefined}
            >
              <FieldLabel htmlFor="dataset-path">
                Internal storage path <Req />
              </FieldLabel>
              <Input
                id="dataset-path"
                value={internal_storage_path}
                onChange={(e) => setInternalStoragePath(e.target.value)}
                onBlur={() => touch("internal_storage_path")}
                className="font-mono text-sm"
                placeholder="/mnt/diag-data/datasets/lidc-idri"
                aria-invalid={!!errors.internal_storage_path}
                aria-describedby={
                  errors.internal_storage_path
                    ? "dataset-path-error"
                    : "dataset-path-desc"
                }
              />
              {errors.internal_storage_path ? (
                <FieldError id="dataset-path-error">
                  {errors.internal_storage_path}
                </FieldError>
              ) : (
                <FieldDescription id="dataset-path-desc">
                  Canonical path on the group storage server. See{" "}
                  <code className="font-mono text-xs">
                    docs/metadata_guidelines.md
                  </code>
                  .
                </FieldDescription>
              )}
            </Field>

            {/* Modality — always has a value, no empty state */}
            <Field>
              <FieldLabel>
                Modality <Req />
              </FieldLabel>
              <Select
                items={modalityItems}
                value={modality}
                onValueChange={(val) =>
                  setModality((val ?? modality) as Modality)
                }
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {modalityItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Anatomy */}
            <Field data-invalid={!!errors.anatomy || undefined}>
              <FieldLabel htmlFor="dataset-anatomy">
                Anatomy <Req />
              </FieldLabel>
              <Input
                id="dataset-anatomy"
                value={anatomy}
                onChange={(e) => setAnatomy(e.target.value)}
                onBlur={() => touch("anatomy")}
                placeholder="e.g. lung, liver, brain, whole-body"
                aria-invalid={!!errors.anatomy}
                aria-describedby={
                  errors.anatomy ? "dataset-anatomy-error" : undefined
                }
              />
              {errors.anatomy ? (
                <FieldError id="dataset-anatomy-error">
                  {errors.anatomy}
                </FieldError>
              ) : null}
            </Field>

            {/* Task */}
            <Field>
              <FieldLabel>
                Task <Req />
              </FieldLabel>
              <Select
                items={taskItems}
                value={task}
                onValueChange={(val) => setTask((val ?? task) as Task)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {taskItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Access level */}
            <Field>
              <FieldLabel>
                Access level <Req />
              </FieldLabel>
              <Select
                items={accessItems}
                value={access_level}
                onValueChange={(val) =>
                  setAccessLevel((val ?? access_level) as AccessLevel)
                }
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {accessItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                <span className="font-medium">internal</span> — visible only
                within the group.{" "}
                <span className="font-medium">restricted</span> — requires
                explicit approval.
              </FieldDescription>
            </Field>

            {/* Created by — new mode only */}
            {mode === "new" ? (
              <Field data-invalid={!!errors.created_by || undefined}>
                <FieldLabel htmlFor="dataset-created-by">
                  Created by <Req />
                </FieldLabel>
                <Input
                  id="dataset-created-by"
                  value={created_by}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  onBlur={() => touch("created_by")}
                  placeholder="e.g. j.smith or 0000-0001-2345-6789"
                  aria-invalid={!!errors.created_by}
                  aria-describedby={
                    errors.created_by
                      ? "created-by-error"
                      : "created-by-desc"
                  }
                />
                {errors.created_by ? (
                  <FieldError id="created-by-error">
                    {errors.created_by}
                  </FieldError>
                ) : (
                  <FieldDescription id="created-by-desc">
                    Handle, email fragment, or ORCID per group convention.
                  </FieldDescription>
                )}
              </Field>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ── Optional fields ──────────────────────────────── */}
      <Card size="sm">
        <CardHeader className="border-b border-border">
          <CardTitle>
            Optional details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <FieldGroup className="gap-6">
            {/* Status */}
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                items={statusItems}
                value={status}
                onValueChange={(val) => setStatus(val ?? NONE)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {statusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Scale counts */}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-[length:var(--text-sm)] font-medium text-muted-foreground">
                Scale
              </legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="n-patients">Patients</FieldLabel>
                  <Input
                    id="n-patients"
                    inputMode="numeric"
                    value={n_patients}
                    onChange={(e) => setNPatients(e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="n-studies">Studies</FieldLabel>
                  <Input
                    id="n-studies"
                    inputMode="numeric"
                    value={n_studies}
                    onChange={(e) => setNStudies(e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="n-images">Images</FieldLabel>
                  <Input
                    id="n-images"
                    inputMode="numeric"
                    value={n_images}
                    onChange={(e) => setNImages(e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>
            </fieldset>

            {/* Dimensionality */}
            <Field>
              <FieldLabel>Dimensionality</FieldLabel>
              <Select
                items={dimItems}
                value={dimensionality}
                onValueChange={(val) => setDimensionality(val ?? NONE)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {dimItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* License */}
            <Field>
              <FieldLabel htmlFor="license">License</FieldLabel>
              <Input
                id="license"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="e.g. CC-BY-4.0, TCIA, or proprietary"
                className="max-w-sm"
              />
            </Field>

            {/* Access notes */}
            <Field>
              <FieldLabel htmlFor="access-notes">Access notes</FieldLabel>
              <Textarea
                id="access-notes"
                value={access_notes}
                onChange={(e) => setAccessNotes(e.target.value)}
                rows={3}
                placeholder="How to obtain access, any caveats, links to request forms, etc."
              />
            </Field>

            {/* Long description (Markdown) */}
            <Field>
              <FieldLabel htmlFor="long-md">
                Long description (Markdown)
              </FieldLabel>
              <Textarea
                id="long-md"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                placeholder="# Dataset overview&#10;&#10;Longer free-form notes, preprocessing steps, known issues, etc."
              />
              <FieldDescription>
                Stored as{" "}
                <code className="font-mono text-xs">
                  datasets/&lt;id&gt;.md
                </code>{" "}
                alongside the JSON.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 pb-2">
        <Button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
        >
          {pending
            ? "Saving…"
            : mode === "new"
              ? "Create dataset"
              : "Save changes"}
        </Button>
        <Link
          href={
            mode === "edit" && lockedId
              ? `/datasets/${lockedId}`
              : "/datasets/search"
          }
          className={cn(
            buttonVariants({ variant: "outline" }),
            pending && "pointer-events-none opacity-55",
          )}
        >
          Cancel
        </Link>
        {hasFieldErrors && !pending ? (
          <p className="text-[length:var(--text-xs)] text-destructive" role="status">
            Fill in the highlighted fields above before saving.
          </p>
        ) : emptyRequiredCount > 0 && !pending ? (
          <p className="text-[length:var(--text-xs)] text-muted-foreground" role="status">
            {emptyRequiredCount} required{" "}
            {emptyRequiredCount === 1 ? "field" : "fields"} left.
          </p>
        ) : null}
      </div>
      </form>

      <Dialog
        open={successModal !== null}
        onOpenChange={(open) => {
          if (!open) setSuccessModal(null);
        }}
      >
        <DialogContent
          showCloseButton
          className="gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-[var(--shadow-soft)] ring-0 sm:max-w-[26rem]"
        >
          <div className="flex flex-col gap-5 px-6 pb-2 pt-6 sm:px-7 sm:pt-7">
            <div className="flex gap-4">
              <AsteriskIcon
                className="mt-0.5 size-9 shrink-0 text-brand"
                aria-hidden
              />
              <DialogHeader className="gap-3 sm:pr-6">
                <DialogTitle className="font-display text-[length:var(--text-xl)] leading-tight tracking-[-0.02em] text-foreground">
                  {successModal?.partialNote
                    ? "Saved with one issue"
                    : successModal?.kind === "new"
                      ? "Added to the catalogue"
                      : "Changes saved"}
                </DialogTitle>
                <DialogDescription className="text-[length:var(--text-sm)] leading-relaxed text-muted-foreground">
                  {successModal?.partialNote ? (
                    <span className="block text-destructive">
                      {successModal.partialNote}
                    </span>
                  ) : null}
                  <span className={successModal?.partialNote ? "mt-3 block" : "block"}>
                    Committed to the default branch. With{" "}
                    <code className="rounded-md border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[length:var(--text-xs)]">
                      GITHUB_TOKEN
                    </code>{" "}
                    and{" "}
                    <code className="rounded-md border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[length:var(--text-xs)]">
                      GITHUB_REPOSITORY
                    </code>
                    , browse and search load from GitHub each visit; without them
                    the app uses the last built index. This page was refreshed so
                    recents can update.
                  </span>
                </DialogDescription>
              </DialogHeader>
            </div>

            {successModal ? (
              <p className="text-[length:var(--text-xs)] text-muted-foreground">
                Id ·{" "}
                <span className="font-mono text-foreground">{successModal.id}</span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
            {successModal?.kind === "new" && !successModal.partialNote ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setSuccessModal(null)}
              >
                Add another dataset
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setSuccessModal(null)}
              >
                {successModal?.partialNote ? "Close" : "Done"}
              </Button>
            )}
            {successModal ? (
              <Link
                href={`/datasets/${successModal.id}`}
                className={cn(
                  buttonVariants(),
                  "w-full justify-center sm:w-auto",
                )}
              >
                Open in catalogue
              </Link>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
