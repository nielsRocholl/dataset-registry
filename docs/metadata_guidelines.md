# Dataset metadata guidelines (v1)

Normative companion to [`schema/dataset.schema.json`](../schema/dataset.schema.json). Every field appears in the schema; **each optional field** below includes one example.

## Classification vocabulary

Administrators maintain allowed values for modality, task, body region, annotation type, access level, status, and dimensionality via **Manage classification options** on the admin page. Entries are stored in-repo at `config/classification-vocabulary.json` (same GitHub-backed flow as dataset files).

New values should use lowercase slugs: `^[a-z0-9][a-z0-9_-]*$`. Legacy catalogue tokens **`CT`, `MRI`, `PET`, `XRay`, `2D`, `3D`** remain valid exceptions. Anything you add via the UI must validate against those rules before it is committed.

## Conventions

- **Filename:** one JSON file per dataset: `datasets/<id>.json` where `<id>` equals the JSON `id` property (stem only, no slashes).
- **Paths:** When `storage_on_server` is true or omitted, `internal_storage_path` is the location on **group storage** (not a patient folder name). Prefer a mount-relative POSIX path documented by the lab, e.g. `/group/datasets/abdominal-ct-2024/`. Avoid patient identifiers or free-text PHI in segments. When `storage_on_server` is `false`, omit `internal_storage_path` — the entry is catalogue-only.
- **Timestamps:** `created_at` and `updated_at` are ISO 8601 with timezone, e.g. `2026-05-07T14:30:00+02:00`. Schema uses `format: date-time`.

## Identity (required)

| Field               | Meaning |
|---------------------|---------|
| `id`                | Stable slug; never rename files casually—treat as primary key in Git. Example: `example-liver-ct-seg`. |
| `name`              | Human title. Example: `Example liver CT segmentation benchmark`. |
| `short_description` | **Description** — shown on list cards and detail summary. Can be a full paragraph; not limited to a “short” blurb (schema allows up to 2000 characters). Example: `Curated liver CT subset for benchmarking organ segmentation; includes reader consensus masks and train/val/test splits.` |

### `status` (optional)

Lifecycle hint—not required for v1 forms.

Example: `"active"`

## Storage

### `storage_on_server` (optional, default true)

When `false`, the dataset is catalogued for reference but files are **not** on institute storage. Omit `internal_storage_path` in that case.

Example: `false`

### `internal_storage_path` (required when `storage_on_server` is not `false`)

Canonical server path string for findability inside the institute.

Example: `/group/proj-data/example-liver-ct-seg/`

## Tags (required)

### `modality`

Controlled vocabulary (`config/classification-vocabulary.json`); defaults are seeded for common imaging modalities. Select all modalities present in the dataset. Add entries via admin if missing.

Example: `["CT", "MRI"]`

### `body_regions` (required)

Broad anatomical regions for filtering. Select at least one value from vocabulary (see Classification vocabulary above).

Example: `["abdomen"]`

### `anatomy_tags` (optional)

Normalized organ or structure tags for filter chips. Use lowercase slugs with
hyphens, not free text.

Example: `["liver"]`

### `main_disease_type` (optional)

Primary disease or condition focus for the cohort or labels (e.g. hepatocellular carcinoma, idiopathic pulmonary fibrosis). Not vocabulary-controlled.

Example: `"hepatocellular carcinoma"`

### `task`

Controlled vocabulary (`segmentation`, `detection`, etc.—see seeded file). Select one or more tasks when a dataset supports multiple research goals. Add entries via admin if missing.

Example: `["segmentation", "registration"]`

### `annotation_types` (optional)

Annotation representation hints (`voxel_mask`, `bounding_box`, etc.—see seeded vocabulary).

Example: `["voxel_mask"]`

## Scale / tech (optional)

### `n_patients`

Example: `120`

### `n_studies`

Example: `340`

### `n_images`

Example: `12800`

### `dimensionality`

Example: `"3D"`

### `is_longitudinal` (optional)

Set to `true` when the dataset includes repeated scans or follow-up timepoints per subject. Complements `n_studies` (a count) but does not replace it.

Example: `true`

### `phase` (optional)

Free-text contrast or acquisition phase (e.g. arterial, portal venous, delayed) or a clinical trial phase label when relevant. Not vocabulary-controlled.

Example: `"arterial"`

### `scanner_type` (optional)

Scanner or acquisition device label (free text).

Example: `"Siemens SOMATOM Force CT"`

## Access (required + optional)

### `access_level` (required)

`public` \| `internal` (controlled vocabulary)

Example: `"internal"`

### `license` (optional)

Example: `"CC BY 4.0"`

### `access_notes` (optional)

Example: `Request access via the group data steward; cite project ID XYZ in the email.` (no passwords or secrets)

## Upstream source (optional)

Use when the catalogue entry refers to an **external** resource, a **mirror** of public data, or **mixed** internal and external use. All fields are optional and independent of `access_level`.

### `original_authors`

Who originally published or maintains the upstream dataset (plain text).

Example: `"Armato III et al., LIDC-IDRI consortium"`

### `bibtex_citation`

Full BibTeX entry or other bibliography string that users can paste into papers.

Example: `@misc{lidc2015, title={LIDC-IDRI}, howpublished={\\url{https://www.cancerimagingarchive.net/}}, year={2015}}`

### `upstream_url`

HTTP(S) link to the public download, challenge page, or documentation.

Example: `"https://www.cancerimagingarchive.net/collection/lidc-idri/"`

## Catalogue authorship (required)

### `created_by`

Human-facing creator label. New entries are stamped by the app from the signed-in Supabase account.

Example: `"Niels Rocholl"`

### `created_by_user_id`, `created_by_email` (server-stamped)

Ownership fields used for edit/delete permissions. Do not hand-edit unless an admin is repairing ownership.

### `created_at`, `updated_at`

Example: `"2026-05-07T14:30:00+02:00"`

## Optional field quick-reference (examples above)

Fields without a standalone subsection still have an inline example here: **`status`** → `"active"`.
