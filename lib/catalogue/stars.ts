import { createServerSupabase } from "@/lib/supabase/server";
import {
  createServiceSupabase,
  hasServiceSupabase,
} from "@/lib/supabase/admin";

type StarRow = {
  dataset_id: string;
};

export async function getStarredDatasetIds(userId: string): Promise<string[]> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("dataset_stars")
      .select("dataset_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return ((data ?? []) as StarRow[])
      .map((row) => row.dataset_id)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function clearStarsForDataset(datasetId: string): Promise<boolean> {
  if (!hasServiceSupabase()) return false;
  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from("dataset_stars")
      .delete()
      .eq("dataset_id", datasetId);
    return !error;
  } catch {
    return false;
  }
}
