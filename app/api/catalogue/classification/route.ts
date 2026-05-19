import { NextResponse } from "next/server";

import { requireCatalogueUser } from "@/lib/catalogue/access";
import { loadClassificationVocabularyLive } from "@/lib/catalogue/classification-vocabulary.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireCatalogueUser(request);
  if (!auth.ok) return auth.response;

  try {
    const vocabulary = await loadClassificationVocabularyLive();
    return NextResponse.json({ vocabulary });
  } catch {
    return NextResponse.json(
      { error: "Could not load classification vocabulary" },
      { status: 502 },
    );
  }
}
