"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleReadinessItem(
  caseId: string,
  itemKey: string,
  next: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  // Upsert, not update: readiness_items rows are only pre-seeded for demo
  // cases, so a real case has no row to toggle until the first click. The
  // category is NOT NULL, so look it up from the reference table.
  const { data: ref } = await supabase
    .from("readiness_item_reference")
    .select("category")
    .eq("key", itemKey)
    .maybeSingle();
  if (!ref) throw new Error("Unknown readiness item.");

  const { error } = await supabase.from("readiness_items").upsert(
    {
      case_id: caseId,
      item_key: itemKey,
      category: ref.category,
      is_complete: next,
      completed_at: next ? new Date().toISOString() : null,
      completed_by: next ? user.id : null,
    },
    { onConflict: "case_id,item_key" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/app/cases/${caseId}/succession`);
}
