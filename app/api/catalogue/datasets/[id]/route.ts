import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import {
  assertCatalogueRead,
  assertCatalogueMutation,
  requireCatalogueUser,
} from "@/lib/catalogue/access";
import {
  formatStableJson,
  validateDatasetPayload,
} from "@/lib/catalogue/dataset-validator";
import { loadClassificationVocabularyLive } from "@/lib/catalogue/classification-vocabulary.server";
import { CATALOGUE_INDEX_CACHE_TAG } from "@/lib/catalogue/fetch-index-live";
import { clearStarsForDataset } from "@/lib/catalogue/stars";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import {
  assertDatasetSlug,
  catalogueJsonPath,
  catalogueMdPath,
} from "@/lib/catalogue/path";
import {
  defaultBranch,
  deleteBlobFile,
  getBlobFile,
  parseRepository,
  putBlobFile,
} from "@/lib/github/contents";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseDataset(text: string): DatasetCatalogueEntry | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed) || typeof parsed.id !== "string") return null;
    return parsed as DatasetCatalogueEntry;
  } catch {
    return null;
  }
}

export async function GET(req: Request, ctx: RouteCtx) {
  const denied = await assertCatalogueRead(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!assertDatasetSlug(id)) {
    return NextResponse.json({ error: "invalid id slug" }, { status: 400 });
  }
  let repo;
  try {
    repo = parseRepository();
  } catch {
    return NextResponse.json(
      { error: "GITHUB_REPOSITORY invalid or missing" },
      { status: 503 },
    );
  }
  const branch = defaultBranch();
  const path = catalogueJsonPath(id);
  try {
    const blob = await getBlobFile(repo, path, branch);
    if (!blob)
      return NextResponse.json({ error: "dataset not found" }, { status: 404 });
    const parsed: unknown = JSON.parse(blob.text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "catalogue read failed" },
      { status: 502 },
    );
  }
}

export async function PUT(req: Request, ctx: RouteCtx) {
  const auth = await requireCatalogueUser(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!assertDatasetSlug(id)) {
    return NextResponse.json({ error: "invalid id slug" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 },
    );
  }
  if (typeof body.id !== "string" || body.id !== id) {
    return NextResponse.json(
      { error: `"id" in body must equal path segment (${id})` },
      { status: 400 },
    );
  }

  let repo;
  try {
    repo = parseRepository();
  } catch {
    return NextResponse.json(
      { error: "GITHUB_REPOSITORY invalid or missing" },
      { status: 503 },
    );
  }
  const branch = defaultBranch();
  const path = catalogueJsonPath(id);

  try {
    const existing = await getBlobFile(repo, path, branch);
    const existingDataset = existing ? parseDataset(existing.text) : null;
    if (existing && !existingDataset) {
      return NextResponse.json(
        { error: "existing dataset JSON is malformed" },
        { status: 409 },
      );
    }

    if (existingDataset) {
      const denied = await assertCatalogueMutation(req, existingDataset);
      if (denied) return denied;
    }

    const now = new Date().toISOString();
    const stamped: Record<string, unknown> = {
      ...body,
      created_by: existingDataset?.created_by ?? auth.user.displayName,
      created_by_user_id:
        existingDataset?.created_by_user_id ?? auth.user.id,
      created_by_email:
        existingDataset?.created_by_email ?? auth.user.email,
      created_at: existingDataset?.created_at ?? now,
      updated_at: now,
    };

    let vocabulary;
    try {
      vocabulary = await loadClassificationVocabularyLive();
    } catch {
      return NextResponse.json(
        { error: "could not load classification vocabulary" },
        { status: 503 },
      );
    }
    const stampedValidation = validateDatasetPayload(stamped, id, vocabulary);
    if (!stampedValidation.ok) {
      if ("vocabularyErrors" in stampedValidation) {
        return NextResponse.json(
          {
            error: "classification vocabulary mismatch",
            details: stampedValidation.vocabularyErrors,
          },
          { status: 422 },
        );
      }
      return NextResponse.json(
        {
          error: "schema validation failed after ownership stamping",
          details:
            "errors" in stampedValidation ? stampedValidation.errors : [],
        },
        { status: 422 },
      );
    }

    const normalized = formatStableJson(stampedValidation.data);
    const b64 = Buffer.from(normalized, "utf8").toString("base64");
    const message = existing
      ? `catalogue: update dataset ${id}`
      : `catalogue: add dataset ${id}`;
    const result = await putBlobFile(repo, path, branch, b64, message, existing?.sha);
    revalidateTag(CATALOGUE_INDEX_CACHE_TAG, { expire: 0 });
    return NextResponse.json({
      committed: result.commit.sha,
      contentSha: result.content.sha,
      url: result.commit.html_url,
    });
  } catch {
    return NextResponse.json(
      { error: "catalogue write failed" },
      { status: 502 },
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

  let repo;
  try {
    repo = parseRepository();
  } catch {
    return NextResponse.json(
      { error: "GITHUB_REPOSITORY invalid or missing" },
      { status: 503 },
    );
  }

  const branch = defaultBranch();
  const jsonPath = catalogueJsonPath(id);
  const mdPath = catalogueMdPath(id);

  try {
    const existing = await getBlobFile(repo, jsonPath, branch);
    if (!existing) {
      return NextResponse.json({ error: "dataset not found" }, { status: 404 });
    }
    const dataset = parseDataset(existing.text);
    if (!dataset) {
      return NextResponse.json(
        { error: "existing dataset JSON is malformed" },
        { status: 409 },
      );
    }

    const denied = await assertCatalogueMutation(req, dataset);
    if (denied) return denied;

    const existingMd = await getBlobFile(repo, mdPath, branch);
    let descriptionCommit: string | undefined;
    if (existingMd) {
      const result = await deleteBlobFile(
        repo,
        mdPath,
        branch,
        existingMd.sha,
        `catalogue: delete dataset ${id} description`,
      );
      descriptionCommit = result.commit.sha;
    }

    const result = await deleteBlobFile(
      repo,
      jsonPath,
      branch,
      existing.sha,
      `catalogue: delete dataset ${id}`,
    );
    const starsCleared = await clearStarsForDataset(id);
    revalidateTag(CATALOGUE_INDEX_CACHE_TAG, { expire: 0 });
    return NextResponse.json({
      committed: result.commit.sha,
      descriptionCommitted: descriptionCommit,
      starsCleared,
      url: result.commit.html_url,
    });
  } catch {
    return NextResponse.json(
      { error: "catalogue delete failed" },
      { status: 502 },
    );
  }
}
