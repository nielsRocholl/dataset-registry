import { NextResponse } from "next/server";

import { requireCatalogueUser } from "@/lib/catalogue/access";
import { assertDatasetSlug } from "@/lib/catalogue/path";
import { getDatasetEntryServer } from "@/lib/catalogue/resolve-dataset-server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: RouteCtx) {
  const auth = await requireCatalogueUser(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!assertDatasetSlug(id)) {
    return NextResponse.json({ error: "invalid id slug" }, { status: 400 });
  }

  const dataset = await getDatasetEntryServer(id);
  if (!dataset) {
    return NextResponse.json({ error: "dataset not found" }, { status: 404 });
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("dataset_stars").upsert(
      {
        user_id: auth.user.id,
        dataset_id: id,
      },
      { onConflict: "user_id,dataset_id" },
    );
    if (error) {
      return NextResponse.json(
        { error: "could not star dataset" },
        { status: 502 },
      );
    }
    return NextResponse.json({ starred: true });
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured (Supabase stars)" },
      { status: 503 },
    );
  }
}

export async function DELETE(req: Request, ctx: RouteCtx) {
  const auth = await requireCatalogueUser(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!assertDatasetSlug(id)) {
    return NextResponse.json({ error: "invalid id slug" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("dataset_stars")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("dataset_id", id);
    if (error) {
      return NextResponse.json(
        { error: "could not unstar dataset" },
        { status: 502 },
      );
    }
    return NextResponse.json({ starred: false });
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured (Supabase stars)" },
      { status: 503 },
    );
  }
}
