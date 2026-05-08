import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { primaryEmail } from "@/lib/catalogue/allowlist";
import {
  canMutateDataset,
  ensureCatalogueUser,
  type CatalogueUser,
} from "@/lib/catalogue/user-profile";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { createServerSupabase } from "@/lib/supabase/server";

function e2eBypassMatches(request: Request): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  const secret = process.env.CATALOGUE_E2E_BEARER?.trim();
  if (!secret) return false;
  const hdr = request.headers.get("authorization");
  return hdr === `Bearer ${secret}`;
}

async function getAuthedUser(
  request: Request,
): Promise<
  | { ok: true; user: User; email: string | null; e2e: boolean }
  | { ok: false; response: NextResponse }
> {
  if (e2eBypassMatches(request)) {
    const mock = { id: "e2e-bypass" } as User;
    return { ok: true, user: mock, email: null, e2e: true };
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    const email = primaryEmail(data.user);
    return { ok: true, user: data.user, email, e2e: false };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Server misconfigured (Supabase client)" },
        { status: 503 },
      ),
    };
  }
}

export async function requireCatalogueUser(
  request: Request,
): Promise<
  | { ok: true; user: CatalogueUser; e2e: boolean }
  | { ok: false; response: NextResponse }
> {
  const auth = await getAuthedUser(request);
  if (!auth.ok) return auth;

  if (auth.e2e) {
    return {
      ok: true,
      e2e: true,
      user: {
        id: "e2e-bypass",
        email: "e2e@example.com",
        displayName: "E2E bypass",
        role: "admin",
        isAdmin: true,
      },
    };
  }

  try {
    const user = await ensureCatalogueUser(auth.user);
    if (!user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Forbidden: email is not a catalogue member" },
          { status: 403 },
        ),
      };
    }
    return { ok: true, user, e2e: false };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Server misconfigured (Supabase profiles)" },
        { status: 503 },
      ),
    };
  }
}

/** Session (or non-prod E2E) + catalogue membership — for catalogue reads. */
export async function assertCatalogueRead(
  request: Request,
): Promise<Response | null> {
  const auth = await requireCatalogueUser(request);
  return auth.ok ? null : auth.response;
}

export async function assertCatalogueMutation(
  request: Request,
  dataset: DatasetCatalogueEntry,
): Promise<Response | null> {
  const auth = await requireCatalogueUser(request);
  if (!auth.ok) return auth.response;
  if (!canMutateDataset(auth.user, dataset)) {
    return NextResponse.json(
      { error: "Forbidden: only the dataset owner or an admin can change this dataset" },
      { status: 403 },
    );
  }
  return null;
}
