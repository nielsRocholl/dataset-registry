import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { assertCatalogueAccess } from "@/lib/catalogue/access";
import { assertDatasetSlug, catalogueMdPath } from "@/lib/catalogue/path";
import {
  defaultBranch,
  getBlobFile,
  parseRepository,
  putBlobFile,
} from "@/lib/github/contents";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

const LIMIT = 512 * 1024;

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
  const path = catalogueMdPath(id);
  try {
    const blob = await getBlobFile(repo, path, branch);
    if (!blob) {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(blob.text, {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
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

  const text = await req.text();
  if (text.length > LIMIT) {
    return NextResponse.json({ error: "body too large" }, { status: 413 });
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
  const path = catalogueMdPath(id);
  const b64 = Buffer.from(text, "utf8").toString("base64");

  try {
    const existing = await getBlobFile(repo, path, branch);
    const message = existing
      ? `catalogue: update dataset ${id} description`
      : `catalogue: add dataset ${id} description`;
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
