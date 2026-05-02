"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ResponseValue = string | number | null;

async function requireAdvisor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return { supabase, userId: user.id };
}

function revalidateDiscovery(caseId: string) {
  revalidatePath(`/app/cases/${caseId}/discovery`);
}

// Edit through the UI = advisor owns it. Source flips to 'advisor',
// status to 'answered'. Applies whether or not a row already exists.
export async function saveResponse(
  caseId: string,
  fieldKey: string,
  value: ResponseValue,
) {
  const { supabase, userId } = await requireAdvisor();

  const { error } = await supabase.from("discovery_responses").upsert(
    {
      case_id: caseId,
      field_key: fieldKey,
      value,
      source: "advisor",
      status: "answered",
      answered_by: userId,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "case_id,field_key" },
  );

  if (error) throw new Error(error.message);
  revalidateDiscovery(caseId);
}

// Verify an existing simulated/inferred value as-is. Flips source to
// 'advisor' without changing the value. Used by the "Verify" menu action
// and the bulk "Verify all simulated" button.
export async function verifyResponse(caseId: string, fieldKey: string) {
  const { supabase, userId } = await requireAdvisor();

  const { error } = await supabase
    .from("discovery_responses")
    .update({
      source: "advisor",
      status: "answered",
      answered_by: userId,
      answered_at: new Date().toISOString(),
    })
    .eq("case_id", caseId)
    .eq("field_key", fieldKey);

  if (error) throw new Error(error.message);
  revalidateDiscovery(caseId);
}

export async function verifyAllSimulated(caseId: string) {
  const { supabase, userId } = await requireAdvisor();

  const { error } = await supabase
    .from("discovery_responses")
    .update({
      source: "advisor",
      status: "answered",
      answered_by: userId,
      answered_at: new Date().toISOString(),
    })
    .eq("case_id", caseId)
    .eq("source", "simulated");

  if (error) throw new Error(error.message);
  revalidateDiscovery(caseId);
}

export async function markSkipped(caseId: string, fieldKey: string) {
  const { supabase, userId } = await requireAdvisor();

  const { error } = await supabase.from("discovery_responses").upsert(
    {
      case_id: caseId,
      field_key: fieldKey,
      value: null,
      source: "advisor",
      status: "skipped",
      answered_by: userId,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "case_id,field_key" },
  );

  if (error) throw new Error(error.message);
  revalidateDiscovery(caseId);
}

export async function markUnknown(caseId: string, fieldKey: string) {
  const { supabase, userId } = await requireAdvisor();

  const { error } = await supabase.from("discovery_responses").upsert(
    {
      case_id: caseId,
      field_key: fieldKey,
      value: null,
      source: "advisor",
      status: "unknown",
      answered_by: userId,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "case_id,field_key" },
  );

  if (error) throw new Error(error.message);
  revalidateDiscovery(caseId);
}

export async function clearResponse(caseId: string, fieldKey: string) {
  const { supabase } = await requireAdvisor();

  const { error } = await supabase
    .from("discovery_responses")
    .delete()
    .eq("case_id", caseId)
    .eq("field_key", fieldKey);

  if (error) throw new Error(error.message);
  revalidateDiscovery(caseId);
}
