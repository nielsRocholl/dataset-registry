import { createServiceSupabase } from "@/lib/supabase/admin";
import {
  displayNameFromEmail,
  isValidEmail,
  normalizeEmail,
  normalizeRole,
  type CatalogueRole,
  type CatalogueUser,
} from "@/lib/catalogue/user-profile";

export type AdminMember = {
  email: string;
  displayName: string;
  role: CatalogueRole;
  createdAt: string;
  updatedAt: string;
  authUserId: string | null;
  profileUserId: string | null;
  profileRole: CatalogueRole | null;
  lastSignInAt: string | null;
};

type MemberRow = {
  email: string;
  display_name: string;
  role: CatalogueRole;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  user_id: string;
  email: string;
  role: CatalogueRole;
};

type AuthUserSummary = {
  id: string;
  email?: string;
  last_sign_in_at?: string | null;
};

export function parseMemberInput(input: unknown): {
  email: string;
  displayName: string;
  role: CatalogueRole;
} {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid member payload.");
  }

  const raw = input as {
    email?: unknown;
    displayName?: unknown;
    display_name?: unknown;
    role?: unknown;
  };
  const email = typeof raw.email === "string" ? normalizeEmail(raw.email) : "";
  if (!isValidEmail(email)) {
    throw new Error("Enter a valid email address.");
  }

  const rawDisplayName =
    typeof raw.displayName === "string"
      ? raw.displayName
      : typeof raw.display_name === "string"
        ? raw.display_name
        : "";
  const displayName = rawDisplayName.trim() || displayNameFromEmail(email);
  const role = normalizeRole(raw.role);

  return { email, displayName, role };
}

export async function listAdminMembers(): Promise<AdminMember[]> {
  const supabase = createServiceSupabase();
  const [{ data: members, error: membersError }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("catalogue_members")
        .select("email,display_name,role,created_at,updated_at")
        .order("email", { ascending: true }),
      supabase.from("profiles").select("user_id,email,role"),
    ]);

  if (membersError) {
    throw membersError;
  }

  const { data: authUsers } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const profileByEmail = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [
      normalizeEmail(profile.email),
      profile,
    ]),
  );
  const authByEmail = new Map(
    (authUsers?.users ?? []).flatMap((user: AuthUserSummary) =>
      user.email
        ? [[normalizeEmail(user.email), user] as const]
        : [],
    ),
  );

  return ((members ?? []) as MemberRow[]).map((member) => {
    const email = normalizeEmail(member.email);
    const profile = profileByEmail.get(email) ?? null;
    const authUser = authByEmail.get(email) ?? null;
    return {
      email,
      displayName: member.display_name,
      role: normalizeRole(member.role),
      createdAt: member.created_at,
      updatedAt: member.updated_at,
      authUserId: authUser?.id ?? null,
      profileUserId: profile?.user_id ?? null,
      profileRole: profile ? normalizeRole(profile.role) : null,
      lastSignInAt: authUser?.last_sign_in_at ?? null,
    };
  });
}

async function countAdmins(excludingEmail?: string) {
  const supabase = createServiceSupabase();
  let query = supabase
    .from("catalogue_members")
    .select("email", { count: "exact", head: true })
    .eq("role", "admin");
  if (excludingEmail) {
    query = query.neq("email", normalizeEmail(excludingEmail));
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function syncExistingProfile(
  email: string,
  displayName: string,
  role: CatalogueRole,
) {
  const supabase = createServiceSupabase();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      role,
    })
    .eq("email", email);
  if (error) throw error;
}

export async function upsertAdminMember(
  actor: CatalogueUser,
  input: {
    email: string;
    displayName: string;
    role: CatalogueRole;
  },
) {
  const supabase = createServiceSupabase();
  const { error } = await supabase.from("catalogue_members").upsert(
    {
      email: input.email,
      display_name: input.displayName,
      role: input.role,
      created_by: actor.id,
    },
    { onConflict: "email" },
  );
  if (error) throw error;
  await syncExistingProfile(input.email, input.displayName, input.role);
}

export async function updateAdminMember(
  actor: CatalogueUser,
  targetEmail: string,
  input: {
    displayName: string;
    role: CatalogueRole;
  },
) {
  const email = normalizeEmail(targetEmail);
  if (!isValidEmail(email)) {
    throw new Error("Invalid member email.");
  }
  if (actor.email === email && input.role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }
  if (input.role !== "admin" && (await countAdmins(email)) === 0) {
    throw new Error("At least one admin must remain.");
  }

  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from("catalogue_members")
    .update({
      display_name: input.displayName,
      role: input.role,
    })
    .eq("email", email);
  if (error) throw error;
  await syncExistingProfile(email, input.displayName, input.role);
}

export async function deleteAdminMember(actor: CatalogueUser, targetEmail: string) {
  const email = normalizeEmail(targetEmail);
  if (!isValidEmail(email)) {
    throw new Error("Invalid member email.");
  }
  if (actor.email === email) {
    throw new Error("You cannot revoke your own access.");
  }
  if ((await countAdmins(email)) === 0) {
    throw new Error("At least one admin must remain.");
  }

  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from("catalogue_members")
    .delete()
    .eq("email", email);
  if (error) throw error;
}
