import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

import { requireCatalogueUser } from "@/lib/catalogue/access";
import { loadClassificationVocabularyUncached } from "@/lib/catalogue/classification-vocabulary.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  noStore();
  const auth = await requireCatalogueUser(request);
  if (!auth.ok) return auth.response;

  try {
    const vocabulary = await loadClassificationVocabularyUncached();
    return NextResponse.json(
      { vocabulary },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load classification vocabulary" },
      { status: 502 },
    );
  }
}
