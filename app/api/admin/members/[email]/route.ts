import { NextResponse } from "next/server";

import { requireCatalogueUser } from "@/lib/catalogue/access";
import {
  deleteAdminMember,
  parseMemberInput,
  updateAdminMember,
} from "@/lib/catalogue/admin-members";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ email: string }> };

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

export async function PATCH(request: Request, ctx: RouteCtx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { email } = await ctx.params;

  let input;
  try {
    const body: unknown = await request.json();
    const parsed = parseMemberInput({
      ...(body && typeof body === "object" ? body : {}),
      email: decodeURIComponent(email),
    });
    input = {
      displayName: parsed.displayName,
      role: parsed.role,
    };
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid member payload." },
      { status: 400 },
    );
  }

  try {
    await updateAdminMember(auth.user, decodeURIComponent(email), input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update member" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, ctx: RouteCtx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { email } = await ctx.params;

  try {
    await deleteAdminMember(auth.user, decodeURIComponent(email));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not revoke member" },
      { status: 400 },
    );
  }
}
