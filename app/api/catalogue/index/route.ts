import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

import { requireCatalogueUser } from "@/lib/catalogue/access";
import { fetchCatalogueIndexUncached } from "@/lib/catalogue/fetch-index-live";

export const runtime = "nodejs";

export async function GET(request: Request) {
  noStore();
  const auth = await requireCatalogueUser(request);
  if (!auth.ok) return auth.response;

  try {
    const { datasets, generated_at } = await fetchCatalogueIndexUncached();
    return NextResponse.json(
      { datasets, generated_at },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load catalogue index" },
      { status: 502 },
    );
  }
}
