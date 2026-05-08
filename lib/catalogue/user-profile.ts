import type { User } from "@supabase/supabase-js";

import {
  isBootstrapAdminEmail,
  primaryEmail,
} from "@/lib/catalogue/allowlist";
import {
  createServiceSupabase,
  hasServiceSupabase,
} from "@/lib/supabase/admin";

export type CatalogueRole = "member" | "admin";

export type CatalogueUser = {
  id: string;
  email: string;
  displayName: string;
  role: CatalogueRole;
  isAdmin: boolean;
};

type MemberRow = {
  email: string;
  display_name: string;
  role: CatalogueRole;
};

type ProfileRow = {
  user_id: string;
  email: string;
  display_name: string;
  role: CatalogueRole;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function displayNameFromEmail(email: string) {
  const local = email.split("@", 1)[0] || email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ") || email;
}

export function normalizeRole(role: unknown): CatalogueRole {
  return role === "admin" ? "admin" : "member";
}

function toCatalogueUser(userId: string, row: MemberRow): CatalogueUser {
  return {
    id: userId,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isAdmin: row.role === "admin",
  };
}

async function ensureProfileWithService(
  user: User,
  email: string,
): Promise<CatalogueUser | null> {
  if (!hasServiceSupabase()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[catalogue] SUPABASE_SERVICE_ROLE_KEY missing — membership checks cannot run",
      );
    }
    return null;
  }

  const supabase = createServiceSupabase();
  const normalizedEmail = normalizeEmail(email);
  const displayName = displayNameFromEmail(normalizedEmail);
  const bootstrapAdmin = isBootstrapAdminEmail(normalizedEmail);

  const memberResult = await supabase
    .from("catalogue_members")
    .select("email,display_name,role")
    .eq("email", normalizedEmail)
    .maybeSingle();
  let member = memberResult.data;

  if (memberResult.error) {
    throw memberResult.error;
  }

  if (!member && bootstrapAdmin) {
    const inserted = await supabase
      .from("catalogue_members")
      .upsert(
        {
          email: normalizedEmail,
          display_name: displayName,
          role: "admin",
          created_by: user.id,
        },
        { onConflict: "email" },
      )
      .select("email,display_name,role")
      .single();
    if (inserted.error) {
      throw inserted.error;
    }
    member = inserted.data;
  }

  if (!member) {
    return null;
  }

  const memberRow = {
    email: normalizeEmail((member as MemberRow).email),
    display_name: (member as MemberRow).display_name || displayName,
    role: normalizeRole((member as MemberRow).role),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        email: memberRow.email,
        display_name: memberRow.display_name,
        role: memberRow.role,
      },
      { onConflict: "user_id" },
    )
    .select("user_id,email,display_name,role")
    .single();

  if (error) {
    throw error;
  }

  const row = data as ProfileRow;
  return toCatalogueUser(row.user_id, {
    email: row.email,
    display_name: row.display_name,
    role: normalizeRole(row.role),
  });
}

export async function ensureCatalogueUser(user: User): Promise<CatalogueUser | null> {
  const email = primaryEmail(user);
  if (!email) {
    return null;
  }

  return ensureProfileWithService(user, email);
}

export function canMutateDataset(
  user: CatalogueUser,
  dataset: { created_by_user_id?: string },
) {
  if (user.isAdmin) return true;
  return Boolean(dataset.created_by_user_id && dataset.created_by_user_id === user.id);
}
