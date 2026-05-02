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

  const { error } = await supabase
    .from("readiness_items")
    .update({
      is_complete: next,
      completed_at: next ? new Date().toISOString() : null,
      completed_by: next ? user.id : null,
    })
    .eq("case_id", caseId)
    .eq("item_key", itemKey);

  if (error) throw new Error(error.message);
  revalidatePath(`/app/cases/${caseId}/succession`);
}
