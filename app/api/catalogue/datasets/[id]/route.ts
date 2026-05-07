import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { assertCatalogueAccess } from "@/lib/catalogue/access";
import {
  formatStableJson,
  validateDatasetPayload,
} from "@/lib/catalogue/dataset-validator";
import { assertDatasetSlug, catalogueJsonPath } from "@/lib/catalogue/path";
import {
  defaultBranch,
  getBlobFile,
  parseRepository,
  putBlobFile,
} from "@/lib/github/contents";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const denied = await assertCatalogueAccess(req);
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
  const denied = await assertCatalogueAccess(req);
  if (denied) return denied;
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

  const v = validateDatasetPayload(body, id);
  if (!v.ok) {
    if ("idMismatch" in v && v.idMismatch) {
      return NextResponse.json(
        { error: `"id" in body must equal path segment (${id})` },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "schema validation failed", details: "errors" in v ? v.errors : [] },
      { status: 422 },
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
  const normalized = formatStableJson(v.data);
  const b64 = Buffer.from(normalized, "utf8").toString("base64");

  try {
    const existing = await getBlobFile(repo, path, branch);
    const message = existing
      ? `catalogue: update dataset ${id}`
      : `catalogue: add dataset ${id}`;
    const result = await putBlobFile(repo, path, branch, b64, message, existing?.sha);
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
