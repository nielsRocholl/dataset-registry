import { NextResponse } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

export async function assertCatalogueAccess(
  request: Request,
): Promise<Response | null> {
  const bearerEnv = process.env.CATALOGUE_E2E_BEARER?.trim();
  const hdr = request.headers.get("authorization");
  if (bearerEnv && hdr === `Bearer ${bearerEnv}`) return null;

  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (data.user) return null;
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured (Supabase client)" },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
