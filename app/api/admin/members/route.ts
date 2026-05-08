import { NextResponse } from "next/server";

import { requireCatalogueUser } from "@/lib/catalogue/access";
import {
  listAdminMembers,
  parseMemberInput,
  upsertAdminMember,
} from "@/lib/catalogue/admin-members";

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

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json({ members: await listAdminMembers() });
  } catch {
    return NextResponse.json(
      { error: "Could not load catalogue members" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let input;
  try {
    input = parseMemberInput(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid member payload." },
      { status: 400 },
    );
  }

  try {
    await upsertAdminMember(auth.user, input);
    return NextResponse.json({ member: input });
  } catch {
    return NextResponse.json(
      { error: "Could not save catalogue member" },
      { status: 502 },
    );
  }
}
