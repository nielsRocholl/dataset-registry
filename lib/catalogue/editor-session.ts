import { cache } from "react";

import { canMutateDataset, ensureCatalogueUser } from "@/lib/catalogue/user-profile";
import type {
  CatalogueUser,
} from "@/lib/catalogue/user-profile";
import type { DatasetCatalogueEntry } from "@/lib/catalogue/types";
import { createServerSupabase } from "@/lib/supabase/server";

export type { CatalogueUser } from "@/lib/catalogue/user-profile";

export const getCurrentCatalogueUser = cache(async (): Promise<CatalogueUser | null> => {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return await ensureCatalogueUser(data.user);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[catalogue] getCurrentCatalogueUser:", err);
    }
    return null;
  }
});

export async function getCanCreate(): Promise<boolean> {
  return Boolean(await getCurrentCatalogueUser());
}

export async function getCanEdit(): Promise<boolean> {
  return getCanCreate();
}

export async function getCanMutateDataset(
  dataset: DatasetCatalogueEntry,
): Promise<boolean> {
  const user = await getCurrentCatalogueUser();
  return user ? canMutateDataset(user, dataset) : false;
}
