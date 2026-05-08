import type { User } from "@supabase/supabase-js";

export function parseEmailList(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const set = parseEmailList(process.env.CATALOGUE_BOOTSTRAP_ADMIN_EMAILS);
  if (set.size === 0) return false;
  return set.has(email.trim().toLowerCase());
}

/** Prefer session email; GitHub OAuth often fills metadata or identities only. */
export function primaryEmail(user: User): string | null {
  const direct = user.email?.toLowerCase().trim();
  if (direct) return direct;
  const meta = user.user_metadata;
  if (typeof meta?.email === "string" && meta.email.trim()) {
    return meta.email.toLowerCase().trim();
  }
  for (const id of user.identities ?? []) {
    const raw = id.identity_data?.email;
    if (typeof raw === "string" && raw.trim()) {
      return raw.toLowerCase().trim();
    }
  }
  return null;
}
