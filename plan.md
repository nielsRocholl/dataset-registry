# Dataset catalogue — implementation plan (authoritative)

**One sentence:** A single private GitHub repository holds the Next.js site and all dataset JSON; Vercel deploys that app and runs Route Handlers that authenticate via Supabase and **commit dataset updates directly** to the default branch after validation—no pull requests for catalogue entries.

This document is the **complete** plan for a first working product: requirements, rules, and explicit non-goals. Later PhD students should be able to extend behaviour by reading this file, the JSON schema, and a short maintenance section—not by tracing undocumented conventions.

---

## Implementation phases

Work proceeds in **six phases**. Each phase has a clear exit: something runnable or verifiable before moving on. **Supabase** and **Vercel** MCP servers are the preferred way to inspect and configure projects during implementation; project creation steps are called out explicitly.

### Provisioning guardrails (read first)

- **New projects only.** This product does **not** yet exist on your accounts—create **dedicated** Supabase and Vercel projects for the dataset catalogue (name them so they are unambiguous, e.g. include `dataset-registry` or your group prefix).
- **Do not touch Seekly.** The **Seekly** Vercel/Supabase project (and any linked resources) is **out of scope**. Do not deploy to it, do not change its env vars, do not link this repo to it. When using MCP, **select and operate only on the new catalogue projects** after they exist.

### Phase 1 — Cloud projects and secrets shell

**Goal:** Isolated Supabase + Vercel projects and a documented place for env vars (values can be filled as later phases need them).

| Step | What |
|------|------|
| Supabase | Use MCP: `list_organizations` → `get_cost` / `confirm_cost` → **`create_project`** → poll **`get_project`** until the instance is ready. Record **project ref**, URL, anon key, service role key (dashboard or MCP helpers such as `get_publishable_keys` / project URL tools as available). |
| Vercel | There is **no** “create empty project” in the narrow MCP surface we use day-to-day—**create a new Vercel project** in the UI (or `vercel link` / import Git flow) so it points **only** at the dataset-registry GitHub repo. Then use MCP: **`list_teams`** / **`list_projects`** to confirm the new project ID and that **Seekly is not** the target. |
| Env | In Vercel project settings, reserve env vars for: Supabase URL + anon (client-safe) + server secrets (service role **only** if a server path needs it—prefer minimal exposure), GitHub token for writes, `NEXT_PUBLIC_*` only where truly public. Document names in repo `README` or `.env.example` (no real secrets in Git). |

**Exit criteria:** New Supabase project is live; new Vercel project exists and is not Seekly; team knows which Vercel project ID / Supabase ref belongs to this app.

---

### Phase 2 — Repository skeleton, schema, and CI

**Goal:** Monorepo layout, canonical JSON Schema, guidelines, and automated validation of `datasets/*.json`.

| Step | What |
|------|------|
| Layout | Create `app/` (or `src/app/`), `datasets/`, `schema/dataset.schema.json`, `generated/`, `docs/metadata_guidelines.md` per §4–§5. |
| Schema | Encode required fields (including `internal_storage_path`); keep `status` optional; align with §5. |
| Build | Script or build step to generate `generated/index.json` from `datasets/` (§3.2). |
| CI | GitHub Action: on push to default branch, validate JSON under `datasets/` against `schema/dataset.schema.json` (§6). |

**Exit criteria:** Local `pnpm`/`npm` build passes; CI green on a test commit; at least one sample `datasets/<id>.json` valid.

---

### Phase 3 — GitHub write path (server only)

**Goal:** Route Handlers can read/update `datasets/<id>.json` (and optional `.md`) with **direct commits** on the default branch (§8).

| Step | What |
|------|------|
| Credentials | Fine-grained PAT (or GitHub App later) stored **only** in Vercel env—never `NEXT_PUBLIC_*` (§11). |
| API | Implement commit flow using GitHub Contents / Git Data API; conventional commit messages (§8.3). |
| Auth stub | Protect handlers: session check only at first; full role check in Phase 4. |

**Exit criteria:** A test call (or minimal internal form) results in a real commit on the repo; no PR opened for the dataset file.

---

### Phase 4 — Supabase Auth and route protection

**Goal:** Login, allowlist, and roles enforced in middleware + Route Handlers (§7).

| Step | What |
|------|------|
| App wiring | `@supabase/ssr` (or project-standard Supabase Next helper): cookie session, `middleware.ts` protecting catalogue routes. |
| Allowlist | Env list or minimal Supabase table—only approved users can proceed past login. |
| Roles | `viewer` vs `editor` (and `admin` if needed): UI affordances + **mandatory** checks in every write handler (§7.2). |
| MCP | Use Supabase MCP to apply any small SQL migrations (e.g. `profiles`) if you store roles in DB; **`execute_sql`** / **`apply_migration`** as appropriate—only on the **new** project. |

**Exit criteria:** Unauthenticated users never see data; non-allowlisted users blocked; editors can reach write APIs in principle.

---

### Phase 5 — Read-only catalogue UI

**Goal:** Minimal shadcn UI: list, search/filters, detail—implemented in the Claude-style UI/UX contract from §9, not as a generic dashboard.

| Step | What |
|------|------|
| Pages | `/login`, `/datasets`, `/datasets/[id]` wired to `generated/index.json` (or build-time data). |
| UI | shadcn only; FieldGroup/Field for any small forms on this phase if needed (§9.1); reuse the shared Claude-style shell, surface, typography, and control tokens before adding new styling. |
| Design | Mandatory: follow `.cursor/agents/claude-design.md` and §9.2 for every page/component touched. For catalogue browsing, copy Claude's `/new` app model concretely: fixed desktop sidebar, calm blank canvas, centered command/search composer, compact filter controls in the composer footer, and recents-style dataset rows. No top-nav dashboard, hero marketing page, filter panel, or table-first layout for the primary browse flow. |

**Exit criteria:** Authenticated users can browse and filter the sample data end-to-end on Vercel preview/production.

---

### Phase 6 — Write UI, end-to-end hardening, handoff

**Goal:** Add/edit forms, validation, direct commits, redeploy loop, and maintainer docs.

| Step | What |
|------|------|
| Forms | `/datasets/new`, `/datasets/[id]/edit` with client + server schema validation (§6), implemented inside the existing Claude-like catalogue shell from §9.2. Use the same fixed sidebar, quiet canvas, compact back/title header, soft grouped detail surfaces, FieldGroup/Field form layout, semantic tokens, and minimal required fields first. Do **not** introduce a top-nav admin screen, dashboard card grid, wizard framework, or standalone form chrome. |
| Writes | Connect forms to Phase 3 handlers; after commit, site reflects new data per §12 (rebuild / regenerated index). |
| MCP ops | Vercel MCP: **`deploy_to_vercel`**, **`get_deployment`**, **`get_runtime_logs`** when debugging; Supabase MCP for auth-related checks—**always scoped to the catalogue project**. |
| Done | Walk through §13 acceptance; tighten §14 maintenance notes in README; confirm any frontend changes still obey the Claude-style UI/UX contract in §9.2. |

**Exit criteria:** §13 checklist satisfied; PhD maintainers can follow README + this doc to change schema and deploy without touching Seekly.

---

### Phase map (quick reference)

| Phase | Focus | Primary MCP (illustrative) |
|-------|--------|----------------------------|
| 1 | New Supabase + Vercel projects, env plan | Supabase: `create_project`, `get_project`; Vercel: `list_teams`, `list_projects` |
| 2 | Repo + schema + CI | — (GitHub Actions) |
| 3 | GitHub commit API | — |
| 4 | Supabase Auth + middleware | Supabase: migrations / SQL as needed |
| 5 | List + detail UI | Vercel: deploy, logs (as needed) |
| 6 | Add/edit + acceptance | Vercel + Supabase for debug and config verification |

Sections **§1–§16** below remain the **normative product spec**; this roadmap is the **recommended execution order**.

---

## 1. Goals

### 1.1 What we are building

Researchers in the group must be able to:

1. Register datasets they use or rely on.
2. Describe modality, anatomy, task, scale, access, annotations, and references using a **fixed, small schema** for v1—including **where the data lives on the group storage server** (internal path).
3. Search and filter the catalogue **client-side** (small catalogue; no search backend in v1).
4. Keep **all changes in Git** for transparency and history (dataset submissions **commit directly**; no review PR flow for entries).

The platform must stay **simple, cheap or free, and easy to maintain** for people who are strong in research but not professional frontend engineers.

### 1.2 Non-goals for v1 (explicit)

Do **not** implement in the first shippable version:

- Semantic search, embeddings, or a vector database.
- Heavy role hierarchies or a full admin console beyond allowlist and basic roles.
- Analytics dashboards, dataset comparison tools, automatic metadata extraction from papers.
- Supabase as the primary metadata store (GitHub files remain canonical).

These are documented as **future extensions** so scope creep is a conscious decision, not an accident.

---

## 2. Hard rules — platform and services

Only these managed services are in scope:

| Responsibility | Service | Rule |
|----------------|---------|------|
| Frontend hosting, serverless API, previews | **Vercel** | All HTTP serving and server-side write gateway. |
| Sign-in, sessions, allowlist, optional role hints | **Supabase** | **Authentication (and minimal user metadata) only.** Not the dataset catalogue database. |
| Canonical storage and history | **GitHub** | **Single source of truth** for the app source, dataset files, schema, and generated index—**one repository**. |

**Forbidden:** Adding a separate general-purpose database (e.g. Postgres for catalogue data), another host for the main app, or client-side GitHub tokens.

**Agent and human workflow:** When configuring or querying Supabase or Vercel during development, use the **Supabase** and **Vercel** MCP servers (and/or the project skill files) rather than ad-hoc guessing of dashboards and APIs. **Follow the Implementation phases** at the top of this document for project creation and to avoid operating on the wrong Vercel/Supabase project (e.g. Seekly).

---

## 3. Architecture

### 3.1 Data flow

```text
Browser → Next.js (Vercel) → Supabase Auth (session / JWT)
         → Protected App Router pages and Route Handlers
         → Server-only GitHub API (commit to default branch on current tree)
         → Same private repo: Next.js app + datasets/*.json + schema/ + generated/index.json
```

**Principle:** The browser never holds GitHub write credentials. All writes go through Vercel Route Handlers that verify the user, validate payloads, then call GitHub.

### 3.2 Read path (catalogue display)

- **Preferred:** At build time (or a small build step), generate `generated/index.json` from `datasets/*.json` so the UI loads one aggregated file and filters locally.
- **Consistency:** The default branch always holds the current dataset files; Vercel production deploy tracks that branch so each deploy matches the repo after automated dataset commits.

### 3.3 Write path (add / edit)

```text
User submits form → client validation → Route Handler validates again
→ build dataset JSON (and optional body `.md`) → GitHub API: commit on default branch
→ push updates repo; Vercel deploy rebuilds → updated catalogue
```

**No pull requests for dataset entries.** Submission is an immediate, validated commit (subject to GitHub API and rate limits). Human code review for catalogue content is **out of band** (trust editors + Git history), not a mandatory PR gate.

---

## 4. Repository layout (GitHub)

**One repository** contains the web application and all catalogue files.

```text
<repo-root>/
  app/                       # Next.js App Router (or src/app/ — project convention)
  datasets/
    <dataset_id>.json
    <dataset_id>.md          # optional long-form description
  schema/
    dataset.schema.json      # JSON Schema — required from day one
  generated/
    index.json               # built list for fast client-side search/filter
  docs/
    metadata_guidelines.md   # human-readable conventions
  package.json
  ...
```

**Rules:**

- One primary JSON file per dataset; `id` is stable and matches the filename stem.
- No patient-level fields; no credentials in metadata. **Internal storage paths are allowed** (see §11)—this repo is private and group-only.

---

## 5. Metadata model — v1 minimal profile

The high-level doc lists many possible fields. For **v1**, enforce a **small required set** and allow optional fields defined in `dataset.schema.json`. The following is the intended **minimum conceptual model** (exact names and enums live in the schema file).

### 5.1 Identity (required)

- `id`, `name`, `short_description`
- **`status` is not required** for v1 (optional only if present in schema; do not block forms on it).

### 5.2 Storage location (required)

- `internal_storage_path` — **raw path on the group storage server** where the data lives (exact convention—absolute vs mount-relative—fixed in `metadata_guidelines.md`). This catalogue is private and internal; storing paths here is intentional for findability.

### 5.3 Segmentation-oriented tags (v1)

To match “minimal UI with some segmentation tags”:

- `modality` — normalized enum (e.g. `CT`, `MRI`, …)
- `anatomy` / `organ` — controlled vocabulary or free text with suggested normalisation in guidelines
- `task` — include **`segmentation`** as a first-class task value alongside a small set of others (e.g. `detection`, `classification`) so filters are meaningful without committing to a huge taxonomy

### 5.4 Scale and tech (optional but encouraged)

- Approximate `n_patients`, `n_studies` or `n_images` (as applicable)
- `dimensionality` (2D / 3D / mixed) if known

### 5.5 Access and governance (minimal)

- `access_level`: `public` | `internal` | `restricted`
- `license` or `access_notes` (non-secret)

### 5.6 Provenance

- `created_by` (group member identity string or ORCID-style id as per convention)
- `created_at`, `updated_at` (ISO 8601)

**Rule:** Every optional field in the schema must be documented in `metadata_guidelines.md` with one example. PhD maintainers should not infer meaning from field names alone.

---

## 6. Validation (three layers)

1. **Client:** pleasant UX; mirror required fields and enums.
2. **Route Handlers:** authoritative using the same JSON Schema (e.g. Ajv). Reject invalid payloads **before** GitHub calls.
3. **CI on push:** GitHub Action validates changed files under `datasets/` against `schema/dataset.schema.json` on pushes to the default branch (and optionally on PRs if the team uses PRs for **application code**), so bad JSON never becomes the published catalogue.

---

## 7. Authentication and authorisation

### 7.1 Supabase

- **Auth:** email (or institutional) sign-in flows as configured for the project.
- **Allowlist:** only approved mails or domains (exact policy is a project config detail, not duplicated here—implement as env-driven or small `allowed_users`-style table in Supabase **if** you need dynamic lists; keep tables minimal).

### 7.2 Roles (v1)

Keep **three conceptual roles**; implement with Supabase JWT claims or a tiny `profiles.role` field:

| Role | UI | API |
|------|-----|-----|
| `viewer` | Browse | Read-only catalogue routes |
| `editor` | Browse + add/edit affordances | May call write Route Handlers |
| `admin` | Same as editor + any future admin-only surfaces | Manage users if ever exposed; for v1 admin tasks may remain **GitHub + Supabase dashboard** |

**Rule:** Never rely on hiding buttons alone. Every Route Handler checks the session and role (or claim) before GitHub operations.

### 7.3 Privacy of the web app

- All app routes require authentication.
- Unauthenticated users are redirected to login.
- Authenticated but non-allowlisted users see a clear **unauthorised** state—not partial data.

---

## 8. GitHub integration

### 8.1 Capabilities

The server must be able to: read the current `datasets/<id>.json` (and optional `.md`) for edit forms, and **create or update those paths with a single commit on the default branch** (Contents API or Git data API—implementation detail). No branch-per-submission and **no PR** for catalogue writes.

### 8.2 Credentials

- **Prototype-friendly:** fine-grained PAT with least privilege, **server-only** env var, never `NEXT_PUBLIC_*`.
- **Long-term:** GitHub App installation (preferred for maintainability and audit). Plan may migrate from PAT to App without changing the product’s external behaviour.

### 8.3 Commit messages

Use a clear convention (e.g. `catalogue: add dataset <id>` / `catalogue: update dataset <id>`) so `git log` remains readable for PhD maintainers.

---

## 9. Frontend — stack and UI rules

### 9.1 Stack

- **Framework:** Next.js (App Router) on Vercel.
- **UI components:** **shadcn/ui only** for interactive UI primitives (per project skill: use `npx shadcn@latest` / package-manager equivalent, follow FieldGroup/Field, `cn()`, semantic colors, composition rules—do not hand-roll parallel component libraries).
- **Styling:** Tailwind aligned with shadcn tokens; no raw rainbow utility palettes for status.

### 9.2 Design direction (claude-design, adapted for this product)

Apply **`.cursor/agents/claude-design.md`** as a binding UI/UX contract, not an optional aesthetic suggestion. Any agent changing frontend layout, pages, shared components, forms, typography, color, motion, spacing, or interaction states must read that file first and implement the app as a close Claude-style product experience adapted to dataset-catalogue content.

The product may serve a different purpose than Claude, but its frontend should use the same design language: editorial typography, warm restrained neutrals, **one** accent used sparingly, dense but calm information structure, border-first surfaces, compact controls, purposeful motion, and `prefers-reduced-motion`. Avoid generic SaaS/admin-dashboard patterns, decorative gradient hero sections, glassmorphism, loud palettes, oversized marketing layouts, and one-off component styling that bypasses the shared tokens.

For catalogue pages, “Claude-style” is structural, not only a color palette. Authenticated screens must transpose Claude's `/new` shell and interaction model: a fixed left sidebar on desktop with product wordmark, icon-led navigation, recent items, and bottom user controls; a quiet main canvas; a centered serif greeting/title with a restrained terracotta mark; a large rounded composer as the primary search/input surface; compact chips or selects in the composer footer; and result rows that read like Claude recents, not a spreadsheet. Detail and form pages must stay inside the same shell and use soft grouped surfaces that feel connected to the recents/list treatment.

When implementing frontend work, first extend or reuse shared Claude-style primitives and CSS tokens, then compose pages from those pieces. If a new UI element cannot be expressed with the existing primitives, add the smallest reusable primitive that matches this contract and use it immediately.

**v1 UI scope (minimal):**

- **Routes:** `/login`, `/` or `/datasets` (list), `/datasets/[id]` (detail), `/datasets/new` (add), `/datasets/[id]/edit` (edit)—names may follow Next.js conventions; keep the surface **small**.
- **List:** centered composer-first search + a **few** compact filters (e.g. modality, task including segmentation, access) + recents-style dataset rows. Use a table only for secondary dense data, never as the primary catalogue browsing surface.
- **Detail:** readable sections (identity, **internal storage path**, segmentation-related tags, access, references) using Card / Separator / Badge as appropriate.
- **Forms:** add/edit pages must stay inside the shared Claude-like app shell and visually extend the existing detail/list language: compact back affordance, editorial title, soft grouped surfaces, FieldGroup/Field controls, semantic validation states, and a restrained primary action. Minimal required fields first; optional fields behind clear sections or accordions **only if** needed to avoid clutter. No top-nav admin pages, dashboard card grids, or unrelated form frameworks.

**Maintainability:** Avoid bespoke layout frameworks. Pages should compose the shared Claude-like app shell, composer/list patterns, and semantic design tokens before adding page-specific styling. If a future agent needs a new frontend surface, it should first ask which part of the Claude shell/composer/list/detail model it maps to.

---

## 10. Code standards (minimal-dense-correct)

- **Correctness first:** thin Route Handlers, explicit validation, fail fast on invalid input.
- **No unnecessary abstractions:** no “service class” that only forwards to one function unless it carries real shared state.
- **State:** derive UI state where possible; do not duplicate server truth in client stores unless needed.
- **Types:** strict TypeScript for API payloads and dataset types generated or hand-written from the JSON Schema.
- **Comments:** only for non-obvious invariants (security, schema assumptions).

Documentation voice for README and onboarding: use the **Explanation voice** from the minimal-dense-correct skill—clear structure, plain language, explicit assumptions, tied to files and commands PhD students can run.

---

## 11. Security and privacy

- **Secrets:** GitHub tokens and Supabase service keys live in Vercel env; never exposed to the client.
- **Metadata content:** forbid **patient identifiers** and **credentials** (passwords, API keys, tokens). **Internal storage server paths are explicitly allowed** in this product; they must still not point at exportable patient-level folders or named patient identifiers in path segments—follow `metadata_guidelines.md`.
- **Repo:** private; access controlled by GitHub org and PAT/App scopes. Treat the whole catalogue as **sensitive internal inventory**: do not make the repo public while it contains operational paths.

---

## 12. Build, deploy, and operations

- **Default branch:** dataset JSON changes land via **direct commits** from the app (authenticated editors). The team **may** still use PRs for **application code** changes; that is optional process, not part of the dataset submission flow.
- **Vercel:** production deploys from the default branch; each new commit (including catalogue commits) triggers a redeploy so the site and `generated/index.json` stay aligned if generation runs at build time.
- **Regeneration:** CI or build step refreshes `generated/index.json` when files under `datasets/` change.

---

## 13. Testing and acceptance (v1)

Before calling v1 “done”, verify:

- Login and allowlist behaviour work as intended.
- Unauthorised users cannot read catalogue content or call write APIs.
- Add flow **commits** valid JSON to the default branch (no PR for the entry).
- Edit flow updates the correct file with a **direct commit** (no PR for the entry).
- List and detail views render from `generated/index.json` or an agreed read path.
- CI rejects invalid JSON when `datasets/` changes land on the tracked branch(es).

---

## 14. Maintenance guide (for future PhD students)

1. **Change workflow:** Schema and guidelines live in the repo; update `dataset.schema.json` and `metadata_guidelines.md` together, then adjust the form and Route Handler validation in the same change set.
2. **Add a filter:** Extend `generated/index.json` generation and add one filter control using existing shadcn components—avoid new dependencies.
3. **Incident:** Revoke and rotate GitHub credentials via Vercel env; audit Supabase allowlist; review recent commits touching `datasets/` in GitHub history.
4. **Design tweaks:** Stay inside shadcn + the shared Claude shell/composer/list/detail patterns; reread `.cursor/agents/claude-design.md` and run `shadcn` CLI docs when touching components. Do not reintroduce top-nav dashboards, standalone filter panels, table-first browsing, decorative gradients, or unrelated component frameworks.

---

## 15. Roadmap after v1 (informative only)

- Richer controlled vocabularies; optional semantic search over descriptions.
- Stronger analytics or dataset similarity—these belong **after** the group routinely uses the catalogue.

---

## 16. Document control

- **Supersedes:** informal architecture discussion for implementation purposes.
- **Companion:** `docs/high-level-project.md` remains background reading; **this file** is binding for build decisions when they differ in level of detail.
- **Implementation order:** The **Implementation phases** section (six phases + guardrails) is the recommended execution sequence; keep it updated if phase boundaries change.
- **Updates:** When the team changes schema, auth policy, or routes, update **this file** in the same change set whenever possible.
