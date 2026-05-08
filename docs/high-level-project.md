Below is a high-level A–Z design plan for the dataset catalogue platform.

# Dataset Catalogue Platform — High-Level Design

## 1. Goal

Build a lightweight internal platform where researchers can:

```text
1. register datasets they use;
2. describe modality, anatomy, task, size, access, annotations, etc.;
3. search/filter existing datasets;
4. see who used what dataset and for which project;
5. preserve everything in Git for transparency and version history.
```

The platform should be simple, maintainable, cheap/free, and extensible.

---

# 2. Core Architecture

Recommended architecture:

```text
Next.js frontend on Vercel
        ↓
Supabase Auth
        ↓
Protected frontend + protected API routes
        ↓
Vercel serverless API
        ↓
GitHub API
        ↓
Private GitHub repository with dataset metadata files
```

In practice:

```text
User → Web App → Auth Check → Submit Dataset → API Route → GitHub PR/Commit
```

GitHub remains the **source of truth**.

Supabase handles **authentication**.

Vercel hosts the **interface and tiny server-side write mechanism**.

---

# 3. Main Components

## A. Frontend

A simple internal web app.

Pages:

```text
/datasets
/add-dataset
/datasets/[id]
/edit-dataset/[id]
/admin or /review, optional
```

Main features:

```text
dataset overview table
search bar
filters
dataset detail page
add dataset form
edit dataset form
login/logout
```

Use a modern component system, for example:

```text
React
Next.js
shadcn/ui
Tailwind
```

The UI should feel like a clean internal dashboard, not a large enterprise system.

---

## B. Authentication

Use Supabase Auth.

Allowed users:

```text
group members only
explicit email allowlist
possibly institutional email domains
```

Basic auth model:

```text
unauthenticated user → redirect to login
authenticated but unauthorized user → blocked
authorized user → can view catalogue
authorized editor → can submit/edit datasets
maintainer/admin → can approve PRs or manage schema
```

Initially, keep roles simple:

```text
viewer
editor
admin
```

For your group, all 10–15 users could probably be editors.

---

## C. Authorization

There are two levels of authorization.

### 1. Frontend authorization

Controls what the user sees.

Example:

```text
viewer sees datasets
editor sees add/edit buttons
admin sees review/admin controls
```

### 2. API authorization

More important.

Every server-side endpoint must verify:

```text
is the user logged in?
is the user allowed?
is the user allowed to perform this action?
```

Never rely only on hiding buttons in the frontend.

---

# 4. Data Storage

Dataset metadata lives in a private GitHub repository.

Example structure:

```text
dataset-catalogue/
  datasets/
    kits21.json
    lidc.json
    internal_liver_metastases.json

  schema/
    dataset.schema.json

  generated/
    index.json

  docs/
    metadata_guidelines.md
```

Use **one structured file per dataset**.

Recommended primary format:

```text
JSON or YAML
```

My preference:

```text
JSON for strict validation
YAML if you want human-editability
Markdown only for longer free-text descriptions
```

A practical compromise:

```text
datasets/kits21.json
datasets/kits21.md  optional long description
```

---

# 5. Dataset Metadata Model

Each dataset should have a stable schema.

High-level fields:

```text
identity
clinical/domain information
technical information
annotation information
access/governance information
usage history
links/references
maintenance metadata
```

Example categories:

```text
Dataset identity:
- id
- name
- acronym
- description (summary for catalogue list/detail; in JSON: `short_description`)
- long description

Data characteristics:
- modality
- anatomy/organ
- pathology
- task
- number of patients
- number of scans/images
- dimensionality
- contrast phase
- imaging protocol details, if known

Annotation:
- annotation type
- annotation target
- annotator type
- validation status
- label quality
- exhaustive vs non-exhaustive annotations

Access:
- public/internal/restricted
- contact person
- storage location
- license
- ethics/CMO status
- data-use restrictions

Research usage:
- used by
- project
- date
- purpose
- preprocessing notes
- known issues

References:
- paper
- DOI
- GitHub link
- dataset homepage

Maintenance:
- created by
- created date
- last updated
- status
- tags
```

Do not put patient-level information in this catalogue.

---

# 6. Submission Flow

Recommended flow:

```text
User fills dataset form
        ↓
Form validates required fields
        ↓
API validates again server-side
        ↓
API creates dataset JSON
        ↓
API creates branch in GitHub
        ↓
API commits file
        ↓
API opens pull request
        ↓
Maintainer reviews
        ↓
Merge into main
        ↓
Catalogue updates
```

This is better than direct commits because it gives you quality control.

For very small groups, direct commit is possible, but I would still use PRs.

---

# 7. Editing Flow

Editing should follow the same principle.

```text
User opens existing dataset
        ↓
Clicks edit
        ↓
Form pre-fills current metadata
        ↓
User modifies fields
        ↓
API creates edit branch
        ↓
API opens PR
        ↓
Review and merge
```

This avoids accidental metadata corruption.

---

# 8. Review and Governance

Define lightweight ownership.

Recommended roles:

```text
Dataset contributor:
- adds or updates metadata

Dataset owner:
- person responsible for correctness of a dataset entry

Catalogue maintainer:
- reviews PRs
- enforces metadata quality
- updates schema

Admin:
- manages auth and deployment secrets
```

For your group, this could be very simple:

```text
everyone can submit
1–2 people review/merge
```

---

# 9. Search and Filtering

Initial version: simple client-side search.

Because the catalogue is small, you do not need a search backend.

Use:

```text
generated/index.json
```

The frontend loads this index and filters locally.

Search fields:

```text
name
description
tags
modality
organ
pathology
task
used_by
```

Filters:

```text
modality: CT, MRI, PET, WSI, ultrasound
organ: liver, lung, kidney, colon, prostate, etc.
task: segmentation, detection, classification, registration, tracking
access: public, internal, restricted
annotation: masks, boxes, points, reports, weak labels
status: available, deprecated, under review
```

Future version:

```text
semantic search over descriptions
embeddings generated during build or by GitHub Action
FAISS/local vector index or hosted vector DB
```

But do not start there.

---

# 10. Build and Deployment Flow

Deployment should be automatic.

```text
Merge into main
        ↓
GitHub repository changes
        ↓
Vercel rebuilds site
        ↓
New dataset appears in catalogue
```

If the frontend reads directly from GitHub at runtime, rebuilds may not be needed. But for simplicity and reliability, I would generate an index during build.

Preferred:

```text
main branch = approved catalogue state
Vercel deployment = visual representation of main branch
```

---

# 11. Privacy Model

The app should be private at the application layer.

```text
All pages require login
All API routes require login
Only approved users can access catalogue
```

Important distinction:

```text
GitHub private repo protects raw metadata files
Supabase/Vercel app auth protects the web interface
API auth protects write actions
```

Do not expose:

```text
patient identifiers
exact sensitive filesystem paths
access credentials
DICOM metadata with identifiers
small-cell counts if they are sensitive
```

For sensitive datasets, use controlled descriptions:

```text
"Available through DIAG internal storage. Contact dataset owner."
```

instead of:

```text
/full/internal/path/to/data/with/projectname
```

---

# 12. GitHub Integration

Use GitHub for:

```text
version control
audit trail
review through PRs
history of changes
structured metadata storage
issue tracking
schema evolution
```

The app should use GitHub API for:

```text
create branch
commit dataset file
open pull request
optionally edit existing files
optionally read catalogue files
```

Use either:

```text
GitHub App
```

or:

```text
fine-grained personal access token
```

For long-term maintainability, a GitHub App is cleaner. For a first prototype, a fine-grained token is simpler.

---

# 13. Supabase Role

Use Supabase only for things Git is bad at:

```text
authentication
user sessions
allowlist
optional roles
```

Avoid using Supabase as the main dataset database unless you intentionally move away from Git as source of truth.

Minimal Supabase tables:

```text
profiles
allowed_users
roles
```

Possibly:

```text
audit_log
```

But even audit logging can mostly live in GitHub PR history.

---

# 14. Vercel Role

Use Vercel for:

```text
hosting frontend
serverless API routes
environment variables
automatic deployment
preview deployments
```

The Vercel API routes are the thin backend layer.

They handle:

```text
form submission
auth verification
GitHub write operation
schema validation
```

This is not a full backend in the classical sense. It is a small controlled gateway between the browser and GitHub.

---

# 15. Validation and Schema

This is critical.

Without a schema, the catalogue will become inconsistent.

Use a strict metadata schema from day one.

Validation should happen at three levels:

```text
frontend form validation
API validation
GitHub Action validation on PR
```

The schema should define:

```text
required fields
allowed values
field types
controlled vocabularies
optional fields
deprecated fields
```

Controlled vocabularies are important for filtering.

Example:

```text
"Computed Tomography"
"CT"
"ct"
"Cat scan"
```

should not all become separate modality labels.

Use normalized values:

```text
CT
MRI
PET
WSI
US
X-ray
```

---

# 16. Dataset Lifecycle

Each dataset should have a status.

Possible statuses:

```text
draft
available
restricted
deprecated
archived
unknown
```

This prevents stale entries from misleading people.

Example:

```text
available = actively usable
restricted = exists but needs permission
deprecated = should not be used for new projects
archived = historical record only
```

---

# 17. Versioning

There are two types of versioning.

### Platform versioning

The app evolves over time.

```text
v0.1 simple catalogue
v0.2 add forms
v0.3 add PR workflow
v0.4 add semantic search
```

### Dataset metadata versioning

Git handles this naturally.

Every change has:

```text
author
date
diff
PR discussion
commit history
```

This is one of the strongest reasons to use Git.

---

# 18. Initial MVP

The first version should be deliberately small.

MVP features:

```text
login
dataset overview
dataset detail page
basic filters
basic search
add dataset form
submit creates GitHub PR
schema validation
```

Skip initially:

```text
semantic search
complex roles
analytics
dataset comparison
automatic metadata extraction
advanced admin panel
```

The MVP should prove that people will actually use it.

---

# 19. Future Extensions

Once the catalogue is stable, add:

```text
semantic search
dataset recommendation
embedding-based similarity
dataset quality scores
automatic metadata extraction from papers/README files
links to experiment tracking
links to preprocessing pipelines
links to model results
dataset dependency graph
annotation quality dashboard
CMO/ethics status tracking
```

For your research group, the most valuable future feature may be:

```text
"Find datasets similar to the one I am currently using."
```

or:

```text
"Find CT lesion segmentation datasets with follow-up scans and annotation masks."
```

---

# 20. Risk Analysis

Main risks:

## Metadata quality decay

People enter incomplete or inconsistent information.

Mitigation:

```text
strict schema
controlled vocabularies
required fields
PR review
clear examples
```

## Nobody uses it

The form is too annoying.

Mitigation:

```text
keep required fields minimal
allow drafts
make search immediately useful
make adding a dataset take <3 minutes
```

## Privacy mistakes

Sensitive paths or patient-related details get added.

Mitigation:

```text
clear forbidden-fields policy
review before merge
admin review for restricted datasets
no patient-level metadata
```

## GitHub token leakage

A write token accidentally reaches the frontend.

Mitigation:

```text
server-side only environment variables
never use NEXT_PUBLIC for secrets
API route only
limited GitHub permissions
```

## Overengineering

Building semantic search, roles, and dashboards before the basic catalogue works.

Mitigation:

```text
ship MVP first
use real group feedback
add complexity only when needed
```

---

# 21. Recommended Final Architecture

```text
Frontend:
Next.js + shadcn/ui on Vercel

Auth:
Supabase Auth with allowlisted users

Data source:
Private GitHub repo

Metadata:
One JSON/YAML file per dataset

Validation:
Schema-based validation in frontend, API, and GitHub Actions

Write mechanism:
Vercel serverless API route creates GitHub PR

Review:
Maintainer merges PR

Search:
Client-side search over generated index.json

Future:
Semantic search with embeddings
```

In one sentence:

> Build a small private Next.js app on Vercel, use Supabase only for authentication, keep GitHub as the canonical dataset metadata store, and make every dataset addition/edit a validated pull request.

That is the best balance between maintainability, flexibility, cost, and future extensibility.
