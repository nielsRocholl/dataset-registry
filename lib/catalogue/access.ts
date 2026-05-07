import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import {
  isAllowlistedEmail,
  isEditorEmail,
  primaryEmail,
} from "@/lib/catalogue/allowlist";
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
  | { ok: true; user: User; email: string | null }
  | { ok: false; response: NextResponse }
> {
  if (e2eBypassMatches(request)) {
    const mock = { id: "e2e-bypass" } as User;
    return { ok: true, user: mock, email: null };
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
    return { ok: true, user: data.user, email };
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

/** Session (or non-prod E2E) + allowlist — for catalogue reads. */
export async function assertCatalogueRead(
  request: Request,
): Promise<Response | null> {
  const auth = await getAuthedUser(request);
  if (!auth.ok) return auth.response;

  if (e2eBypassMatches(request)) return null;

  if (!auth.email || !isAllowlistedEmail(auth.email)) {
    return NextResponse.json(
      { error: "Forbidden: email not on allowlist" },
      { status: 403 },
    );
  }
  return null;
}

/** Session (or non-prod E2E) + allowlist + editor — for catalogue writes. */
export async function assertCatalogueWrite(
  request: Request,
): Promise<Response | null> {
  const auth = await getAuthedUser(request);
  if (!auth.ok) return auth.response;

  if (e2eBypassMatches(request)) return null;

  if (!auth.email || !isAllowlistedEmail(auth.email)) {
    return NextResponse.json(
      { error: "Forbidden: email not on allowlist" },
      { status: 403 },
    );
  }
  if (!isEditorEmail(auth.email)) {
    return NextResponse.json(
      { error: "Forbidden: catalogue writes require editor role" },
      { status: 403 },
    );
  }
  return null;
}
