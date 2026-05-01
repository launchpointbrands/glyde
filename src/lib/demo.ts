"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function seedDemoCase() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: newCaseId, error } = await supabase.rpc(
    "seed_demo_case_for_current_advisor",
  );

  if (error) {
    redirect(`/app?error=${encodeURIComponent(error.message)}`);
  }

  if (newCaseId) {
    revalidatePath("/app");
    redirect(`/app/cases/${newCaseId}/risk`);
  }

  // Demo already exists for this advisor — find and redirect to it.
  const { data: existing } = await supabase
    .from("cases")
    .select("id")
    .eq("label", "demo")
    .eq("advisor_id", user.id)
    .single();

  if (!existing) {
    redirect(`/app?error=${encodeURIComponent("Could not locate demo case.")}`);
  }

  redirect(`/app/cases/${existing.id}/risk`);
}
