import {
  isAllowlistedEmail,
  isEditorEmail,
  primaryEmail,
} from "@/lib/catalogue/allowlist";
import { createServerSupabase } from "@/lib/supabase/server";

/** Matches write API: allowlisted and listed as editor. */
export async function getCanEdit(): Promise<boolean> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return false;
    const email = primaryEmail(data.user);
    return (
      !!email &&
      isAllowlistedEmail(email) &&
      isEditorEmail(email)
    );
  } catch {
    return false;
  }
}
