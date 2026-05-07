# dataset-registry

Internal dataset catalogue (Next.js on Vercel, Supabase Auth, GitHub as source of truth). See [plan.md](plan.md) for the full spec and phased roadmap.

## Environment

1. Copy `.env.example` to `.env.local`.
2. Open [Supabase](https://supabase.com/dashboard) → project **dataset-registry** → **Project Settings** → **API**: paste **Project URL** and the **anon** key into `NEXT_PUBLIC_*` vars. Add **service_role** only into `SUPABASE_SERVICE_ROLE_KEY` when server code needs it (keep off the client).
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
| `CATALOGUE_E2E_BEARER` | Optional. If set, `Authorization: Bearer <value>` is accepted on write APIs for scripted tests. Prefer **unset** on Vercel Production. |
| `NEXT_PUBLIC_SUPABASE_*` | Required for **cookie session** auth: `getUser()` must succeed unless E2E bearer matches. |

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

Unauthenticated requests (no cookie session, wrong or missing Bearer) receive **401**.

After a successful **`PUT`**, confirm a **single direct commit** on the default branch (e.g. `catalogue: add dataset …` / `catalogue: update dataset …`) — not a PR.

## Rules

- **Seekly** apps are out of scope: do not deploy this repo to the `seekly` Vercel project or change Seekly env vars. The Supabase project **Seekly Auth0** was not modified; auth for this app uses **dataset-registry** only.
