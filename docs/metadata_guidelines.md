# Dataset metadata guidelines (v1)

Normative companion to [`schema/dataset.schema.json`](../schema/dataset.schema.json). Every field appears in the schema; **each optional field** below includes one example.

## Conventions

- **Filename:** one JSON file per dataset: `datasets/<id>.json` where `<id>` equals the JSON `id` property (stem only, no slashes).
- **Paths:** `internal_storage_path` is the location on **group storage** (not a patient folder name). Prefer a mount-relative POSIX path documented by the lab, e.g. `/group/datasets/abdominal-ct-2024/`. Avoid patient identifiers or free-text PHI in segments.
- **Timestamps:** `created_at` and `updated_at` are ISO 8601 with timezone, e.g. `2026-05-07T14:30:00+02:00`. Schema uses `format: date-time`.

## Identity (required)

| Field               | Meaning |
|---------------------|---------|
| `id`                | Stable slug; never rename files casually—treat as primary key in Git. Example: `example-liver-ct-seg`. |
| `name`              | Human title. Example: `Example liver CT segmentation benchmark`. |
| `short_description` | One paragraph for list cards. Example: `Curated liver CT subset for benchmarking organ segmentation.` |

### `status` (optional)

Lifecycle hint—not required for v1 forms.

Example: `"active"`

## Storage (required)

### `internal_storage_path`

Canonical server path string for findability inside the institute.

Example: `/group/proj-data/example-liver-ct-seg/`

## Tags (required)

### `modality`

One of the schema enums: `CT`, `MRI`, `PET`, `XRay`, `ultrasound`, `microscopy`, `pathology`, `mixed`, `other`.

Example: `"CT"`

### `anatomy`

Organ, structure, or site; normalize when the group maintains a vocabulary.

Example: `"liver"`

### `task`

Includes **`segmentation`** as first-class plus `detection`, `classification`, `registration`, `reconstruction`, `other`.

Example: `"segmentation"`

## Scale / tech (optional)

### `n_patients`

Example: `120`

### `n_studies`

Example: `340`

### `n_images`

Example: `12800`

### `dimensionality`

Example: `"3D"`

## Access (required + optional)

### `access_level` (required)

`public` \| `internal` \| `restricted`

Example: `"internal"`

### `license` (optional)

Example: `"CC BY 4.0"`

### `access_notes` (optional)

Example: `Request access via the group data steward; cite project ID XYZ in the email.` (no passwords or secrets)

## Provenance (required)

### `created_by`

Example: `@niels.rocholl` or `https://orcid.org/0000-0002-2222-3333`

### `created_at`, `updated_at`

Example: `"2026-05-07T14:30:00+02:00"`

## Optional field quick-reference (examples above)

Fields without a standalone subsection still have an inline example here: **`status`** → `"active"`.
