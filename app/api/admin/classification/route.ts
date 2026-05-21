import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import type {
  ClassificationFieldId,
  ClassificationVocabularyDoc,
} from "@/lib/catalogue/classification-vocabulary";
import {
  CLASSIFICATION_VOCABULARY_FIELDS,
  addClassificationTerm,
  countClassificationValueUsage,
  formatStableVocabularyJson,
  removeClassificationTerm,
} from "@/lib/catalogue/classification-vocabulary";
import { requireCatalogueUser } from "@/lib/catalogue/access";
import { fetchCatalogueIndexLive } from "@/lib/catalogue/fetch-index-live";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import {
  CLASSIFICATION_VOCABULARY_CACHE_TAG,
  fetchClassificationBlobMeta,
  loadClassificationVocabularyUncached,
  writeClassificationVocabularyToGitHub,
} from "@/lib/catalogue/classification-vocabulary.server";

export const runtime = "nodejs";

async function requireAdmin(request: Request) {
  const auth = await requireCatalogueUser(request);
  if (!auth.ok) return auth;
  if (!auth.user.isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 },
      ),
    };
  }
  return auth;
}

function classificationFieldGuard(x: unknown): x is ClassificationFieldId {
  return (
    x === "modality" ||
    x === "task" ||
    x === "body_region" ||
    x === "annotation_type" ||
    x === "access_level" ||
    x === "status" ||
    x === "dimensionality"
  );
}

export type ClassificationOptionRow = {
  value: string;
  label: string;
  usageCount: number;
};

function buildClassificationOptions(
  vocab: ClassificationVocabularyDoc,
  datasets: DatasetCatalogueEntry[],
): Record<ClassificationFieldId, ClassificationOptionRow[]> {
  const options: Record<ClassificationFieldId, ClassificationOptionRow[]> = {
    modality: [],
    task: [],
    body_region: [],
    annotation_type: [],
    status: [],
    access_level: [],
    dimensionality: [],
  };
  for (const id of CLASSIFICATION_VOCABULARY_FIELDS) {
    for (const term of vocab.fields[id]) {
      options[id].push({
        ...term,
        usageCount: countClassificationValueUsage(datasets, id, term.value),
      });
    }
  }
  return options;
}

function revalidateClassificationCache(): void {
  try {
    revalidateTag(CLASSIFICATION_VOCABULARY_CACHE_TAG, { expire: 0 });
  } catch {
    /* mutation already committed; do not fail the HTTP response */
  }
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const vocab = await loadClassificationVocabularyUncached();
    const { datasets } = await fetchCatalogueIndexLive();
    const options = buildClassificationOptions(vocab, datasets);
    return NextResponse.json({ vocabulary: vocab, options });
  } catch {
    return NextResponse.json(
      { error: "Could not load classification vocabulary" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const rec =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const fieldRaw = rec.field;
  const valueRaw = rec.value;
  const labelRaw = rec.label;
  if (!classificationFieldGuard(fieldRaw))
    return NextResponse.json({ error: "invalid field id" }, { status: 400 });
  if (typeof valueRaw !== "string" || typeof labelRaw !== "string") {
    return NextResponse.json(
      { error: "body must include field, value, label strings" },
      { status: 400 },
    );
  }

  let blobMeta;
  try {
    blobMeta = await fetchClassificationBlobMeta();
  } catch {
    return NextResponse.json(
      { error: "GitHub vocabulary path unreachable" },
      { status: 503 },
    );
  }

  const current = await loadClassificationVocabularyUncached();
  let next;
  try {
    next = addClassificationTerm(current, fieldRaw, valueRaw, labelRaw);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "reject add" },
      { status: 400 },
    );
  }

  const text = formatStableVocabularyJson(next);
  try {
    const msg = `chore(catalogue): add ${fieldRaw} ${valueRaw.trim()}`;
    await writeClassificationVocabularyToGitHub(
      text,
      blobMeta.missing ? undefined : blobMeta.sha,
      msg,
    );
    revalidateClassificationCache();
    const { datasets } = await fetchCatalogueIndexLive();
    const options = buildClassificationOptions(next, datasets);
    return NextResponse.json({ vocabulary: next, options });
  } catch {
    return NextResponse.json(
      { error: "Could not commit classification vocabulary" },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const fieldRaw = url.searchParams.get("field");
  const value = url.searchParams.get("value");
  if (!value || value.trim() === "")
    return NextResponse.json({ error: "missing value" }, { status: 400 });
  if (!classificationFieldGuard(fieldRaw))
    return NextResponse.json({ error: "invalid field id" }, { status: 400 });

  try {
    const { datasets } = await fetchCatalogueIndexLive();
    const trimmed = value.trim();
    const n = countClassificationValueUsage(datasets, fieldRaw, trimmed);
    if (n > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${n} dataset${n === 1 ? "" : "s"} still use "${trimmed}".`,
          usageCount: n,
        },
        { status: 409 },
      );
    }

    const current = await loadClassificationVocabularyUncached();
    let next;
    try {
      next = removeClassificationTerm(current, fieldRaw, trimmed);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "reject remove" },
        { status: 400 },
      );
    }

    const text = formatStableVocabularyJson(next);
    const blobMeta = await fetchClassificationBlobMeta();
    if (blobMeta.missing) {
      return NextResponse.json(
        { error: "vocabulary blob missing from repo" },
        { status: 409 },
      );
    }
    const msg = `chore(catalogue): remove ${fieldRaw} ${trimmed}`;
    await writeClassificationVocabularyToGitHub(text, blobMeta.sha, msg);
    revalidateClassificationCache();
    const options = buildClassificationOptions(next, datasets);
    return NextResponse.json({ vocabulary: next, options });
  } catch {
    return NextResponse.json(
      { error: "Could not update classification vocabulary" },
      { status: 502 },
    );
  }
}
