# dataset-registry

Internal dataset catalogue (Next.js on Vercel, Supabase Auth, GitHub as source of truth). See [plan.md](plan.md) for the full spec and phased roadmap.

## Environment

1. Copy `.env.example` to `.env.local`.
2. Open [Supabase](https://supabase.com/dashboard) → project **dataset-registry** → **Project Settings** → **API**: paste **Project URL** and the **anon** key into `NEXT_PUBLIC_*` vars. Add **service_role** only into server-only `SUPABASE_SERVICE_ROLE_KEY`; the live app requires it for membership and admin operations.
3. In [Vercel](https://vercel.com) → **this** project (not Seekly) → **Settings** → **Environment Variables**: add the same names for Production and Preview.

## Provisioning (Phase 1)

| Service | Project |
|--------|---------|
| Supabase | **dataset-registry** — ref `rotolbancrxzgoizrjsl`, region `eu-west-1` — [Dashboard](https://supabase.com/dashboard/project/rotolbancrxzgoizrjsl) |
| GitHub | `git@github.com:nielsRocholl/dataset-registry.git` |
| Vercel | **Create a new project** via **Add New… → Project** → Import `nielsRocholl/dataset-registry`. Do **not** reuse the existing **seekly** Vercel project. |

After the Vercel project exists, link the CLI from this repo if you use it:

```bash
vercel link
```

Pick team `nielsrocholl's projects` and the **dataset-registry** Vercel project (not `seekly`).

## Developing (Phase 2)

| Command | Purpose |
|--------|---------|
| `pnpm install` | Install dependencies (`packageManager`: pnpm 9). |
| `pnpm run validate:datasets` | Validate every `datasets/*.json` against `schema/dataset.schema.json`. |
| `pnpm run generate:index` | Regenerate `generated/index.json`. |
| `pnpm run build` | Generate index, validate datasets, then `next build`. |
| `pnpm run dev` | Local Next.js dev server. |

Contributor fields and enums are documented in [docs/metadata_guidelines.md](docs/metadata_guidelines.md). Without pnpm you can still run **`npm install --no-package-lock && npm run build`** (omit `--no-package-lock` if you deliberately maintain an npm lockfile).

## Catalogue write API (Phase 3)

Server Route Handlers under **`/api/catalogue/...`** read and commit **`datasets/<id>.json`** (and **`datasets/<id>.md`** for descriptions) on the **default branch** via the GitHub Contents API. No pull request is opened for catalogue files.

### Environment

| Variable | Notes |
|---------|-------|
| `GITHUB_TOKEN` | Fine-grained PAT with **Contents** read/write on this repo only. |
| `GITHUB_REPOSITORY` | `owner/repo`, e.g. `nielsRocholl/dataset-registry`. |
| `GITHUB_DEFAULT_BRANCH` | Branch for GET/PUT; defaults to **`main`**. |
| `CATALOGUE_E2E_BEARER` | Optional. **Ignored when `VERCEL_ENV=production`.** For local smoke only: same header is accepted on catalogue APIs without a session. Prefer **unset** on Vercel Production. |
| `NEXT_PUBLIC_SUPABASE_*` | Required for **cookie session** auth: `getUser()` must succeed unless E2E bearer matches. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Required for profile bootstrap/admin role reads and cross-user star cleanup after dataset delete. |

### Fine-grained PAT (GitHub)

Create a PAT with repository access limited to **`dataset-registry`**, permission **Contents: Read and write**. Store only in `.env.local` / Vercel env.

### Smoke test (`curl`)

With **`pnpm dev`**, **`CATALOGUE_E2E_BEARER`**, **`GITHUB_*`**, and a valid **`payload.json`** (schema-compliant, **`id`** matching URL):

```bash
curl -sS -X PUT "http://localhost:3000/api/catalogue/datasets/your-slug-id" \
  -H "Authorization: Bearer $CATALOGUE_E2E_BEARER" \
  -H "Content-Type: application/json" \
  -d @payload.json
```

Unauthenticated requests (no cookie session, wrong or missing Bearer) receive **401** unless the production-safe E2E bypass rules in `lib/catalogue/access.ts` apply.

After a successful **`PUT`**, confirm a **single direct commit** on the default branch (e.g. `catalogue: add dataset …` / `catalogue: update dataset …`) — not a PR.

## Auth and route protection (Phase 4)

Sign-in is **GitHub only** (Supabase OAuth). Use the **dataset-registry** Supabase project and this Vercel app only — **not** Seekly.

### Maintainer setup (short)

1. **GitHub OAuth app:** callback URL must match Supabase (typically `https://<project-ref>.supabase.co/auth/v1/callback`). Save Client ID and secret.
2. **Supabase dashboard:** **Authentication → Providers → GitHub** — enable and paste credentials.
3. **URL configuration:** **Site URL** = app origin (production or `http://localhost:3000`). **Redirect URLs** must include `http://localhost:3000/**`, `http://localhost:3000/auth/callback`, and production/preview origins with the same paths.
4. **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and optional bootstrap admins:

| Variable | Purpose |
|---------|---------|
| `CATALOGUE_BOOTSTRAP_ADMIN_EMAILS` | Emergency lowercase email list promoted to `admin` in Supabase membership/profile tables on first server request. After bootstrap, manage access from `/datasets/admin`. |

5. **Vercel:** mirror the same variables for Production and Preview; redeploy after changes.

### Behaviour

- **Membership:** `public.catalogue_members` is the canonical access list. Members can view/create/star and manage their own datasets; admins can manage all datasets and members.
- **Middleware** refreshes the Supabase session and sends unauthenticated browser traffic to **`/login`** (with `?next=`). Membership is enforced by server pages and Route Handlers.
- **Route Handlers** under `/api/catalogue/...` enforce **read/create** (catalogue member) and **mutate** (dataset owner or admin); **401** without a valid session (unless non-production E2E bearer), **403** if not allowed for the attempted operation.

### Stuck on “Not on the access list yet” after GitHub sign-in

1. **`SUPABASE_SERVICE_ROLE_KEY`** must be set on the same environment (local `.env.local` and Vercel Production + Preview). RLS blocks the browser from reading `catalogue_members`; the server needs the **service_role** key to match your email to a row.
2. In **Supabase → Table Editor → `catalogue_members`**, confirm a row exists for the exact address the app resolves (lowercase). The app also reads email from `user_metadata` and OAuth identities if `user.email` is empty—after a deploy with the code fix, that covers typical GitHub sign-ins.
3. Optional: set **`CATALOGUE_BOOTSTRAP_ADMIN_EMAILS`** (comma-separated, lowercase) so the first server request can insert your row if it is missing.

### Quick checks

| Check | Expect |
|-------|--------|
| Anonymous `GET /api/catalogue/...` | **401** |
| Member create `PUT` for new id | **200** (with valid payload and `GITHUB_*`); server stamps ownership |
| Non-owner member `PUT` existing id | **403** |
| Owner/admin `PUT` existing id | **200** |

## Catalogue UI — add and edit (Phase 6)

Catalogue members get:

- Sidebar **New dataset** → **`/datasets/new`**
- **Starred** datasets in the sidebar and `/datasets/starred`
- Account link → **`/datasets/mine`**

Dataset owners and admins also get:

- **Edit** on owned/admin-manageable dataset detail → **`/datasets/[id]/edit`**
- **Delete** on owned/admin-manageable dataset detail. Delete hard-removes `datasets/<id>.json` and optional `datasets/<id>.md` by GitHub commit.
- Admins get **`/datasets/admin`** for adding, promoting, demoting, and revoking catalogue members without changing env vars.

Forms use the same JSON Schema validation as the API ([`lib/catalogue/dataset-validator.ts`](lib/catalogue/dataset-validator.ts)); writes call `PUT /api/catalogue/datasets/:id` and optionally `PUT .../description` for Markdown. Commits are **direct to the default branch** (no PR for catalogue files). The browser never chooses ownership: the server stamps `created_by`, `created_by_user_id`, and `created_by_email` from the Supabase session on create. Existing ownerless datasets remain admin-only for edit/delete.

After a save, **production** still depends on the GitHub commit landing on the default branch; **`generated/index.json`** is rebuilt in CI/build for repo hygiene and as a fallback. The app also **loads the live catalogue from GitHub** on each request when **`GITHUB_TOKEN`** and **`GITHUB_REPOSITORY`** are set, so list, search, and sidebar recents can show new ids without `git pull` or `generate:index`. Saves trigger **`router.refresh()`** so the shell’s recents update in the same session.

### Routes (browse vs search)

- **`/`** redirects to **`/datasets/search`** (composer and filters).
- **`/datasets`** lists every entry A–Z for scanning (link to search at the top).
- **`/datasets/search`** is the search-and-filter surface (**`DatasetList`**).

Without **`GITHUB_*`** on the server, those pages use **`getCatalogueIndex()`** (the **`generated/index.json`** bundled at build time), same as local offline dev.

### Detail URL 404 right after “Create”, or list missing the new row

- **Writes go to GitHub**, not into your working tree. Until you **`git pull`**, you may not have **`datasets/<id>.json`** locally.
- **Browse, search, and recents** prefer **live GitHub listing** when env is configured; otherwise they follow **`generated/index.json`** (**`pnpm run generate:index`** or **`pnpm run build`** refreshes that file).
- **Detail and edit** (`/datasets/[id]`, `/datasets/[id]/edit`) also prefer the index, but **fall back to the catalogue GET API** (GitHub) when the index does not yet contain the id — so **“Open in catalogue”** should work while you stay logged in, even before pull/regenerate.
- If detail still 404s: confirm **`GET /api/catalogue/datasets/<id>`** returns **200** (session + catalogue membership + GitHub env). A 404 from the API means the file is not on the **default** branch GitHub config uses.

### GitHub Actions vs Vercel

- **Actions** run **`pnpm run build`** on **`main`** (see [`.github/workflows/validate-datasets.yml`](.github/workflows/validate-datasets.yml)): install, **validate all `datasets/*.json`**, Next build. If this job is **red**, open the workflow log — common causes: **`id` ≠ filename stem**, schema errors, or **`pnpm install --frozen-lockfile`** failing after lockfile drift.
- **Vercel** deploy is a **separate** pipeline: it can show “Ready” even when **Actions** failed on the same push. Treat the **Validate datasets** check as the source of truth for whether **`main`** is healthy; fix CI before relying on production.

**Acceptance:** before calling v1 done, walk [plan.md §13 — Testing and acceptance](plan.md#13-testing-and-acceptance-v1) (login, membership, read/write auth, add/edit commits, index, CI).

**Maintenance:** schema, forms, and API validation should stay in sync — see [plan.md §14](plan.md#14-maintenance-guide-for-future-phd-students). UI work must follow **shadcn** + [`.cursor/agents/claude-design.md`](.cursor/agents/claude-design.md) (see [plan.md §9](plan.md#9-frontend--stack-and-ui-rules)).

## Rules

- **Seekly** apps are out of scope: do not deploy this repo to the `seekly` Vercel project or change Seekly env vars. The Supabase project **Seekly Auth0** was not modified; auth for this app uses **dataset-registry** only.
