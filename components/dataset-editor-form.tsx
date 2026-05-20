"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AsteriskIcon, FolderIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { NONE } from "@/lib/catalogue/dataset-form-options";
import type { ClassificationVocabularyDoc } from "@/lib/catalogue/classification-vocabulary";
import { normalizeAnatomyTag } from "@/lib/catalogue/filters";
import { CopyClipboardButton } from "@/components/copy-clipboard-button";
import {
  CATALOGUE_SECTION_CARD_CN,
  CATALOGUE_SECTION_DESC_CN,
  CATALOGUE_SECTION_HEADER_CN,
  CATALOGUE_SECTION_TITLE_ACCENT_CN,
  CATALOGUE_SECTION_TITLE_CN,
  FORM_TOGGLE_CHIP_CN,
} from "@/lib/catalogue/catalogue-surface-styles";
import { DATASET_EDITOR_FORM_SCOPE } from "@/lib/catalogue/catalogue-form-field-scope";
import { validateDatasetPayload } from "@/lib/catalogue/dataset-validator";
import { assertDatasetSlug } from "@/lib/catalogue/path";
import type {
  AccessLevel,
  AnnotationType,
  BodyRegion,
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
  | { mode: "new"; classificationVocabulary: ClassificationVocabularyDoc }
  | {
      mode: "edit";
      initialDataset: DatasetCatalogueEntry;
      classificationVocabulary: ClassificationVocabularyDoc;
    };

// Fields that have required inline validation
const TEXT_REQUIRED = [
  "id",
  "name",
  "short_description",
  "internal_storage_path",
  "anatomy",
] as const;
type RequiredTextField = (typeof TEXT_REQUIRED)[number];

function normalizeModalities(raw: unknown): Modality[] {
  if (Array.isArray(raw)) {
    return raw.filter((m): m is Modality => typeof m === "string" && m.length > 0);
  }
  if (typeof raw === "string" && raw.length > 0) return [raw];
  return [];
}

function normalizeTasks(raw: unknown): Task[] {
  if (Array.isArray(raw)) {
    return raw.filter((t): t is Task => typeof t === "string" && t.length > 0);
  }
  if (typeof raw === "string" && raw.length > 0) return [raw];
  return [];
}

function buildPayload(
  mode: "new" | "edit",
  values: {
    id: string;
    name: string;
    short_description: string;
    internal_storage_path: string;
    modality: Modality[];
    anatomy: string;
    body_regions: BodyRegion[];
    anatomy_tags: string;
    task: Task[];
    is_longitudinal: boolean;
    annotation_types: AnnotationType[];
    access_level: AccessLevel;
    status: string;
    n_patients: string;
    n_studies: string;
    n_images: string;
    dimensionality: string;
    license: string;
    access_notes: string;
    original_authors: string;
    bibtex_citation: string;
    upstream_url: string;
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
    created_by: initial?.created_by ?? "Current user",
    created_at: mode === "edit" && initial ? initial.created_at : now,
    updated_at: now,
  };
  if (values.body_regions.length > 0) {
    o.body_regions = values.body_regions;
  }
  const anatomyTags = parseAnatomyTags(values.anatomy_tags);
  if (anatomyTags.length > 0) {
    o.anatomy_tags = anatomyTags;
  }
  if (values.annotation_types.length > 0) {
    o.annotation_types = values.annotation_types;
  }
  if (initial?.created_by_user_id) {
    o.created_by_user_id = initial.created_by_user_id;
  }
  if (initial?.created_by_email) {
    o.created_by_email = initial.created_by_email;
  }
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
  if (values.is_longitudinal) o.is_longitudinal = true;
  if (values.license.trim()) o.license = values.license.trim();
  if (values.access_notes.trim()) o.access_notes = values.access_notes.trim();
  if (values.original_authors.trim()) {
    o.original_authors = values.original_authors.trim();
  }
  if (values.bibtex_citation.trim()) {
    o.bibtex_citation = values.bibtex_citation.trim();
  }
  if (values.upstream_url.trim()) {
    o.upstream_url = values.upstream_url.trim();
  }
  return o;
}

function isValidOptionalHttpUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parseCount(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseAnatomyTags(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map(normalizeAnatomyTag)
        .filter(Boolean),
    ),
  );
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
  };
  if (!value.trim()) return `${labels[field]} is required.`;
  return null;
}

function Req() {
  return (
    <span className="ml-0.5 align-super text-[11px] text-[#C4674F]" aria-hidden>
      *
    </span>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_1px_4px_rgba(0,0,0,0.04)]",
        CATALOGUE_SECTION_CARD_CN,
      )}
    >
      <div
        className={cn(
          "border-b border-border/30 px-7 pb-6 pt-7",
          CATALOGUE_SECTION_HEADER_CN,
        )}
      >
        <div
          className={cn(
            "border-l-2 border-[#C4674F]/50 pl-3",
            CATALOGUE_SECTION_TITLE_ACCENT_CN,
          )}
        >
          <div
            className={cn(
              "text-[13px] font-semibold tracking-[0.02em] text-foreground/80",
              CATALOGUE_SECTION_TITLE_CN,
            )}
          >
            {title}
          </div>
        </div>
        <p
          className={cn(
            "mt-0.5 text-[13px] italic leading-snug text-muted-foreground/60",
            CATALOGUE_SECTION_DESC_CN,
          )}
        >
          {description}
        </p>
      </div>
      <div className="p-7">{children}</div>
    </div>
  );
}

export function DatasetEditorForm(props: EditorProps) {
  const router = useRouter();
  const mode = props.mode;
  const vocab = props.classificationVocabulary;
  const fallbackModality = vocab.fields.modality[0]?.value ?? "";
  const fallbackTask = vocab.fields.task[0]?.value ?? "";
  const fallbackAccess =
    vocab.fields.access_level.find((t) => t.value === "internal")?.value ??
    vocab.fields.access_level[0]?.value ??
    "internal";

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
  const [modality, setModality] = useState<Modality[]>(
    normalizeModalities(
      initial?.modality ?? (fallbackModality ? [fallbackModality] : []),
    ),
  );
  const [anatomy, setAnatomy] = useState(initial?.anatomy ?? "");
  const [body_regions, setBodyRegions] = useState<BodyRegion[]>(
    initial?.body_regions ?? [],
  );
  const [anatomy_tags, setAnatomyTags] = useState(
    initial?.anatomy_tags?.join(", ") ?? "",
  );
  const [task, setTask] = useState<Task[]>(
    normalizeTasks(initial?.task ?? (fallbackTask ? [fallbackTask] : [])),
  );
  const [is_longitudinal, setIsLongitudinal] = useState(
    initial?.is_longitudinal === true,
  );
  const [annotation_types, setAnnotationTypes] = useState<AnnotationType[]>(
    initial?.annotation_types ?? [],
  );
  const [access_level, setAccessLevel] = useState<AccessLevel>(
    initial?.access_level ?? fallbackAccess,
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
  const [original_authors, setOriginalAuthors] = useState(
    initial?.original_authors ?? "",
  );
  const [bibtex_citation, setBibtexCitation] = useState(
    initial?.bibtex_citation ?? "",
  );
  const [upstream_url, setUpstreamUrl] = useState(initial?.upstream_url ?? "");
  const [touched_upstream_url, setTouchedUpstreamUrl] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [initialMarkdown, setInitialMarkdown] = useState("");

  // Per-field touched state — errors only show after blur or submit attempt
  const [touched, setTouched] = useState<
    Partial<Record<RequiredTextField, boolean>>
  >({});
  const [taskTouched, setTaskTouched] = useState(false);
  const [modalityTouched, setModalityTouched] = useState(false);

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
    setModality(fallbackModality ? [fallbackModality] : []);
    setAnatomy("");
    setBodyRegions([]);
    setAnatomyTags("");
    setTask(fallbackTask ? [fallbackTask] : []);
    setIsLongitudinal(false);
    setAnnotationTypes([]);
    setAccessLevel(fallbackAccess);
    setStatus(NONE);
    setNPatients("");
    setNStudies("");
    setNImages("");
    setDimensionality(NONE);
    setLicense("");
    setAccessNotes("");
    setOriginalAuthors("");
    setBibtexCitation("");
    setUpstreamUrl("");
    setTouchedUpstreamUrl(false);
    setMarkdown("");
    setInitialMarkdown("");
    setTouched({});
    setTaskTouched(false);
    setModalityTouched(false);
  }

  function touch(field: RequiredTextField) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function touchAll() {
    const all: Partial<Record<RequiredTextField, boolean>> = {};
    for (const f of TEXT_REQUIRED) all[f] = true;
    setTouched(all);
    setTouchedUpstreamUrl(true);
  }

  const fieldValues: Record<RequiredTextField, string> = useMemo(
    () => ({
      id,
      name,
      short_description,
      internal_storage_path,
      anatomy,
    }),
    [id, name, short_description, internal_storage_path, anatomy],
  );

  // Compute per-field errors only for touched fields
  const errors: Partial<Record<RequiredTextField, string>> = useMemo(() => {
    const result: Partial<Record<RequiredTextField, string>> = {};
    for (const f of TEXT_REQUIRED) {
      if (!touched[f]) continue;
      const err = fieldError(f, fieldValues[f], mode);
      if (err) result[f] = err;
    }
    return result;
  }, [touched, fieldValues, mode]);

  const taskError = taskTouched && task.length === 0 ? "Select at least one task." : null;
  const modalityError =
    modalityTouched && modality.length === 0 ? "Select at least one modality." : null;

  const upstreamUrlError = useMemo(() => {
    if (!touched_upstream_url) return null;
    if (upstream_url.trim() === "" || isValidOptionalHttpUrl(upstream_url)) {
      return null;
    }
    return "Use a full http(s) URL (e.g. https://example.com/dataset).";
  }, [touched_upstream_url, upstream_url]);

  const hasFieldErrors =
    Object.keys(errors).length > 0 ||
    upstreamUrlError !== null ||
    taskError !== null ||
    modalityError !== null;

  // Count empty required fields (for submit button hint)
  const emptyRequiredCount = useMemo(() => {
    let count = 0;
    for (const f of TEXT_REQUIRED) {
      if (f === "id" && mode === "edit") continue;
      const err = fieldError(f, fieldValues[f], mode);
      if (err) count++;
    }
    return count;
  }, [fieldValues, mode]);

  const requiredTextTotal = useMemo(() => {
    let n = 0;
    for (const f of TEXT_REQUIRED) {
      if (f === "id" && mode === "edit") continue;
      n++;
    }
    return n;
  }, [mode]);

  const filledRequiredCount = Math.max(
    0,
    requiredTextTotal - emptyRequiredCount,
  );

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

  const modalityItems = useMemo(
    () => vocab.fields.modality.map((t) => ({ label: t.label, value: t.value })),
    [vocab],
  );
  const taskItems = useMemo(
    () => vocab.fields.task.map((t) => ({ label: t.label, value: t.value })),
    [vocab],
  );
  const bodyRegionItems = useMemo(
    () =>
      vocab.fields.body_region.map((t) => ({ label: t.label, value: t.value })),
    [vocab],
  );
  const annotationTypeItems = useMemo(
    () =>
      vocab.fields.annotation_type.map((t) => ({
        label: t.label,
        value: t.value,
      })),
    [vocab],
  );
  const accessChipItems = useMemo(
    () =>
      vocab.fields.access_level.map((t) => ({
        label: t.label,
        value: t.value,
      })),
    [vocab],
  );
  const statusChipItems = useMemo(
    () => [
      { label: "Not set", value: NONE },
      ...vocab.fields.status.map((t) => ({ label: t.label, value: t.value })),
    ],
    [vocab],
  );
  const dimItems = useMemo(
    () => [
      { label: "Not set", value: NONE },
      ...vocab.fields.dimensionality.map((t) => ({
        label: t.label,
        value: t.value,
      })),
    ],
    [vocab],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setSuccessModal(null);

    // Touch all required fields to reveal any inline errors
    touchAll();
    setTaskTouched(true);
    setModalityTouched(true);

    const taskEmpty = task.length === 0;
    const modalityEmpty = modality.length === 0;

    // Check for any required field violations first
    const anyEmpty = TEXT_REQUIRED.some((f) => {
      if (f === "id" && mode === "edit") return false;
      return !!fieldError(f, fieldValues[f], mode);
    });

    const upstreamInvalid =
      upstream_url.trim() !== "" && !isValidOptionalHttpUrl(upstream_url);

    if (anyEmpty || upstreamInvalid || taskEmpty || modalityEmpty) {
      requestAnimationFrame(() => {
        const firstInvalid = formRef.current?.querySelector<HTMLElement>(
          "[aria-invalid='true'], [data-invalid='true']",
        );
        if (firstInvalid) {
          firstInvalid.closest("[data-slot='field']")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (upstreamInvalid) {
          document
            .getElementById("dataset-upstream-url")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
      body_regions,
      anatomy_tags,
      task,
      is_longitudinal,
      annotation_types,
      access_level,
      status,
      n_patients,
      n_studies,
      n_images,
      dimensionality,
      license,
      access_notes,
      original_authors,
      bibtex_citation,
      upstream_url,
    };

    const payload = buildPayload(mode, v, initial);
    const validated = validateDatasetPayload(payload, slug, vocab);
    if (!validated.ok) {
      if ("vocabularyErrors" in validated) {
        setApiError(validated.vocabularyErrors.join(" "));
        return;
      }
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

  const cancelHref =
    mode === "edit" && lockedId ? `/datasets/${lockedId}` : "/datasets";
  const submitLabel = pending
    ? "Saving..."
    : mode === "new"
      ? "Create dataset"
      : "Save changes";
  return (
    <>
      <form
        ref={formRef}
        onSubmit={(e) => void onSubmit(e)}
        className={DATASET_EDITOR_FORM_SCOPE}
      >
        {apiError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        <FormSection
          title="Identity"
          description="Name the dataset and define the stable catalogue id."
        >
          <FieldGroup className="gap-5">
            <FieldGroup className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              {mode === "edit" ? (
                <Field>
                  <FieldLabel htmlFor="dataset-id">Dataset ID</FieldLabel>
                  <Input
                    id="dataset-id"
                    value={lockedId}
                    readOnly
                    disabled
                    className="font-mono"
                  />
                  <FieldDescription>
                    Permanent after creation.
                  </FieldDescription>
                </Field>
              ) : (
                <Field data-invalid={!!errors.id || undefined}>
                  <FieldLabel htmlFor="dataset-id">
                    Dataset ID <Req />
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
                      Lowercase letters, digits, and hyphens.
                    </FieldDescription>
                  )}
                </Field>
              )}
            </FieldGroup>

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
          </FieldGroup>
        </FormSection>

        <FormSection
          title="Classification"
          description="Keep the tags short and predictable so the catalogue stays scannable."
        >
          <FieldGroup className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <Field
              className="sm:col-span-2"
              data-invalid={!!modalityError || undefined}
            >
              <FieldLabel>
                Modality <Req />
              </FieldLabel>
              <ToggleGroup
                multiple
                aria-label="Imaging modalities"
                className="flex w-full flex-wrap gap-2"
                value={modality}
                onValueChange={(values) => setModality(values as Modality[])}
              >
                {modalityItems.map((item) => (
                  <ToggleGroupItem
                    key={item.value}
                    value={item.value}
                    className={FORM_TOGGLE_CHIP_CN}
                  >
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {modalityError ? (
                <FieldError>{modalityError}</FieldError>
              ) : (
                <FieldDescription>
                  Select all imaging modalities present in this dataset.
                </FieldDescription>
              )}
            </Field>

            <Field
              className="sm:col-span-2"
              data-invalid={!!taskError || undefined}
            >
              <FieldLabel>
                Task <Req />
              </FieldLabel>
              <ToggleGroup
                multiple
                aria-label="Research tasks"
                className="flex w-full flex-wrap gap-2"
                value={task}
                onValueChange={(values) => setTask(values as Task[])}
              >
                {taskItems.map((item) => (
                  <ToggleGroupItem
                    key={item.value}
                    value={item.value}
                    className={FORM_TOGGLE_CHIP_CN}
                  >
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {taskError ? (
                <FieldError>{taskError}</FieldError>
              ) : (
                <FieldDescription>
                  Select all research tasks this dataset supports.
                </FieldDescription>
              )}
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>Body regions</FieldLabel>
              <ToggleGroup
                multiple
                aria-label="Body region tags"
                className="flex w-full flex-wrap gap-2"
                value={body_regions}
                onValueChange={(values) =>
                  setBodyRegions(values as BodyRegion[])
                }
              >
                {bodyRegionItems.map((item) => (
                  <ToggleGroupItem
                    key={item.value}
                    value={item.value}
                    className={FORM_TOGGLE_CHIP_CN}
                  >
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription>
                Used for the visual body-map filters on the search page.
              </FieldDescription>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="anatomy-tags">Anatomy tags</FieldLabel>
              <Input
                id="anatomy-tags"
                value={anatomy_tags}
                onChange={(e) => setAnatomyTags(e.target.value)}
                placeholder="e.g. liver, portal-vein, pancreas"
              />
              <FieldDescription>
                Comma-separated lowercase tags; spaces are normalized to hyphens.
              </FieldDescription>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>Annotation types</FieldLabel>
              <ToggleGroup
                multiple
                aria-label="Annotation type tags"
                className="flex w-full flex-wrap gap-2"
                value={annotation_types}
                onValueChange={(values) =>
                  setAnnotationTypes(values as AnnotationType[])
                }
              >
                {annotationTypeItems.map((item) => (
                  <ToggleGroupItem
                    key={item.value}
                    value={item.value}
                    className={FORM_TOGGLE_CHIP_CN}
                  >
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription>
                Choose how the labels are represented, or leave empty when unknown.
              </FieldDescription>
            </Field>

            <Field className="sm:col-span-2" data-invalid={!!errors.anatomy || undefined}>
              <FieldLabel htmlFor="dataset-anatomy">
                Anatomy <Req />
              </FieldLabel>
              <Input
                id="dataset-anatomy"
                value={anatomy}
                onChange={(e) => setAnatomy(e.target.value)}
                onBlur={() => touch("anatomy")}
                placeholder="e.g. lung, liver, brain"
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

            <Field className="sm:col-span-2">
              <FieldLabel>Status</FieldLabel>
              <ToggleGroup
                aria-label="Dataset status"
                className="flex w-full flex-wrap gap-2"
                value={status === NONE ? [] : [status]}
                onValueChange={(vals) => setStatus(vals[0] ?? NONE)}
              >
                {statusChipItems.map((item) => (
                  <ToggleGroupItem
                    key={item.value}
                    value={item.value}
                    className={FORM_TOGGLE_CHIP_CN}
                  >
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </FieldGroup>
        </FormSection>

        <FormSection
          title="Storage and access"
          description="Record where the data lives and who can use it."
        >
          <FieldGroup className="gap-5">
            <Field data-invalid={!!errors.internal_storage_path || undefined}>
              <FieldLabel htmlFor="dataset-path">
                Internal storage path <Req />
              </FieldLabel>
              <div className="relative">
                <FolderIcon
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/40 dark:text-white/25"
                  aria-hidden
                />
                <Input
                  id="dataset-path"
                  value={internal_storage_path}
                  onChange={(e) => setInternalStoragePath(e.target.value)}
                  onBlur={() => touch("internal_storage_path")}
                  className="bg-muted/40 pl-9 font-mono text-sm dark:bg-[#252523]"
                  placeholder="/mnt/diag-data/datasets/lidc-idri"
                  aria-invalid={!!errors.internal_storage_path}
                  aria-describedby={
                    errors.internal_storage_path
                      ? "dataset-path-error"
                      : "dataset-path-desc"
                  }
                />
              </div>
              {errors.internal_storage_path ? (
                <FieldError id="dataset-path-error">
                  {errors.internal_storage_path}
                </FieldError>
              ) : (
                <FieldDescription id="dataset-path-desc">
                  Canonical path on the group storage server.
                </FieldDescription>
              )}
            </Field>

            <FieldGroup className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <Field className="min-w-0">
                <FieldLabel>
                  Access level <Req />
                </FieldLabel>
                <ToggleGroup
                  aria-label="Access level"
                  className="flex w-full flex-wrap gap-2"
                  value={[access_level]}
                  onValueChange={(vals) => {
                    const next = vals[0];
                    if (next) setAccessLevel(next as AccessLevel);
                  }}
                >
                  {accessChipItems.map((item) => (
                    <ToggleGroupItem
                      key={item.value}
                      value={item.value}
                      className={FORM_TOGGLE_CHIP_CN}
                    >
                      {item.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field className="min-w-0">
                <FieldLabel htmlFor="license">License</FieldLabel>
                <Input
                  id="license"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="e.g. CC-BY-4.0 or internal"
                />
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel htmlFor="access-notes">Access notes</FieldLabel>
              <Textarea
                id="access-notes"
                value={access_notes}
                onChange={(e) => setAccessNotes(e.target.value)}
                rows={3}
                placeholder="Approval route, caveats, request forms, or usage notes."
              />
            </Field>
          </FieldGroup>
        </FormSection>

        <FormSection
          title="Provenance"
          description="Optional upstream source, citation, and download link. Use for external or mixed internal/external datasets."
        >
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="original-authors">Original author(s)</FieldLabel>
              <Input
                id="original-authors"
                value={original_authors}
                onChange={(e) => setOriginalAuthors(e.target.value)}
                placeholder="Who created the upstream or open-resource (e.g. paper authors, consortium)."
              />
            </Field>

            <Field>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                  <FieldLabel htmlFor="bibtex-citation">
                    BibTeX / citation
                  </FieldLabel>
                  <FieldDescription>
                    Full citation to copy into papers; monospace below.
                  </FieldDescription>
                </div>
                {bibtex_citation.trim() ? (
                  <CopyClipboardButton
                    text={bibtex_citation}
                    className="shrink-0 self-start sm:self-auto"
                  />
                ) : (
                  <p className="text-[length:var(--text-xs)] text-muted-foreground sm:pb-0.5">
                    Save text to enable Copy
                  </p>
                )}
              </div>
              <Textarea
                id="bibtex-citation"
                value={bibtex_citation}
                onChange={(e) => setBibtexCitation(e.target.value)}
                rows={6}
                className="mt-2 font-mono text-xs leading-relaxed"
                placeholder="@article{...}"
                spellCheck={false}
              />
            </Field>

            <Field data-invalid={!!upstreamUrlError || undefined}>
              <FieldLabel htmlFor="dataset-upstream-url">
                Upstream / open-source URL
              </FieldLabel>
              <Input
                id="dataset-upstream-url"
                value={upstream_url}
                onChange={(e) => setUpstreamUrl(e.target.value)}
                onBlur={() => setTouchedUpstreamUrl(true)}
                className="font-mono text-sm"
                placeholder="https://"
                inputMode="url"
                autoComplete="off"
                aria-invalid={!!upstreamUrlError}
                aria-describedby={
                  upstreamUrlError ? "upstream-url-error" : "upstream-url-desc"
                }
              />
              {upstreamUrlError ? (
                <FieldError id="upstream-url-error">{upstreamUrlError}</FieldError>
              ) : (
                <FieldDescription id="upstream-url-desc">
                  Public download or project page (https recommended).
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </FormSection>

        <FormSection
          title="Scale"
          description="Optional counts help researchers judge fit quickly."
        >
          <FieldGroup className="grid gap-x-5 gap-y-5 sm:grid-cols-4">
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
            <Field>
              <FieldLabel>Dimensionality</FieldLabel>
              <Select
                items={dimItems}
                value={dimensionality}
                onValueChange={(val) => setDimensionality(val ?? NONE)}
              >
                <SelectTrigger size="lg" className="w-full">
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
          </FieldGroup>
          <Field className="mt-5">
            <FieldLabel>Study design</FieldLabel>
            <ToggleGroup
              aria-label="Study design"
              className="flex w-full flex-wrap gap-2"
              value={is_longitudinal ? ["longitudinal"] : []}
              onValueChange={(vals) =>
                setIsLongitudinal(vals.includes("longitudinal"))
              }
            >
              <ToggleGroupItem
                value="longitudinal"
                className={FORM_TOGGLE_CHIP_CN}
              >
                Longitudinal / follow-up
              </ToggleGroupItem>
            </ToggleGroup>
            <FieldDescription>
              Repeated scans or follow-up timepoints per patient or subject.
            </FieldDescription>
          </Field>
        </FormSection>

        <FormSection
          title="Description"
          description="Use a concise catalogue summary first; add Markdown only when useful."
        >
          <FieldGroup className="gap-5">
            <Field data-invalid={!!errors.short_description || undefined}>
              <FieldLabel htmlFor="dataset-desc">
                Catalogue summary <Req />
              </FieldLabel>
              <Textarea
                id="dataset-desc"
                value={short_description}
                onChange={(e) => setShortDescription(e.target.value)}
                onBlur={() => touch("short_description")}
                rows={4}
                placeholder="What the dataset contains, why it exists, and typical uses."
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
                placeholder="# Dataset overview&#10;&#10;Longer notes, preprocessing steps, known issues, or references."
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
        </FormSection>

        <div className="sticky bottom-0 z-20 border-t border-border/30 bg-background/80 py-4 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#111110]/85 dark:backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
              role="status"
              aria-live="polite"
            >
              {pending ? (
                <span className="text-xs font-medium text-muted-foreground/60 dark:text-white/40">
                  Saving dataset…
                </span>
              ) : null}
              {hasFieldErrors && !pending ? (
                <span className="text-xs font-medium text-destructive">
                  Fill in the highlighted fields before saving.
                </span>
              ) : null}
              {!pending ? (
                <div className="flex flex-wrap items-center gap-3">
                  {emptyRequiredCount > 0 ? (
                    <span className="text-xs font-medium text-muted-foreground/60 dark:text-white/40">
                      {emptyRequiredCount} fields remaining
                    </span>
                  ) : null}
                  <div
                    className="flex items-center gap-1.5"
                    aria-label={`${filledRequiredCount} of ${requiredTextTotal} required fields complete`}
                  >
                    {Array.from({ length: requiredTextTotal }, (_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "size-1 rounded-full transition-colors duration-200",
                          i < filledRequiredCount
                            ? "bg-[#C4674F] dark:bg-[#C4674F]/80"
                            : "bg-border/40 dark:bg-white/15",
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href={cancelHref}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "text-muted-foreground/70 hover:bg-transparent hover:text-foreground/80 dark:text-white/50 dark:hover:text-white/80",
                  pending && "pointer-events-none opacity-55",
                )}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={pending}
                aria-disabled={pending}
                className={cn(
                  "h-10 border-transparent bg-[#C4674F] px-6 text-sm font-medium text-white shadow-none",
                  "hover:border-transparent hover:bg-[#B85A43] hover:shadow-[0_2px_8px_rgba(196,103,79,0.30)]",
                  "focus-visible:border-[#C4674F] focus-visible:ring-[#C4674F]/35",
                  "disabled:bg-[#C4674F]/50 disabled:opacity-55",
                )}
              >
                {submitLabel}
              </Button>
            </div>
          </div>
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
                    Saved to the catalogue. Open the entry to review the
                    current metadata.
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
