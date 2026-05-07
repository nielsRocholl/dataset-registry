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

/** Empty env list denies all (safest). */
export function isAllowlistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const set = parseEmailList(process.env.CATALOGUE_ALLOWLIST_EMAILS);
  if (set.size === 0) return false;
  return set.has(email.trim().toLowerCase());
}

export function isEditorEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const set = parseEmailList(process.env.CATALOGUE_EDITOR_EMAILS);
  if (set.size === 0) return false;
  return set.has(email.trim().toLowerCase());
}

export function primaryEmail(user: User): string | null {
  return (
    user.email?.toLowerCase().trim() ||
    (typeof user.user_metadata?.email === "string"
      ? user.user_metadata.email.toLowerCase().trim()
      : null) ||
    null
  );
}
