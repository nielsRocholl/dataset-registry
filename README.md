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

## Rules

- **Seekly** apps are out of scope: do not deploy this repo to the `seekly` Vercel project or change Seekly env vars. The Supabase project **Seekly Auth0** was not modified; auth for this app uses **dataset-registry** only.
