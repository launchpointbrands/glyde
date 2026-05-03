"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateBusinessDescription } from "@/lib/business-description";
import { ensureFinancials } from "@/lib/financials";
import { createClient } from "@/lib/supabase/server";
import { simulateValuation } from "@/lib/simulate";

const PETER_SMITH_DESCRIPTION =
  "Precision Auto Services is a partnership-structured automotive parts manufacturer serving commercial and industrial clients. The business generates approximately $5.8M in annual revenue with strong recurring customer relationships. Peter Smith serves as the primary owner and operator.";

async function requireAdvisor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

// Onboarding step 1 — save name + title to the advisor row that the
// signup trigger already created. Advance to step 2.
export async function saveAdvisorProfile(formData: FormData) {
  const { supabase, userId } = await requireAdvisor();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;

  if (!fullName) {
    redirect(
      `/onboarding?step=1&error=${encodeURIComponent("Name is required.")}`,
    );
  }

  const { error } = await supabase
    .from("advisors")
    .update({ full_name: fullName, title })
    .eq("id", userId);

  if (error) {
    redirect(
      `/onboarding?step=1&error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/onboarding?step=2");
}

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

async function markCompleted(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { error } = await supabase
    .from("advisors")
    .update({ onboarding_completed: true })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

// Onboarding step 2A — load the canonical Peter Smith demo case.
// Reuses the existing seed RPC, marks onboarding complete, redirects
// to the demo case's Risk dashboard for instant gratification.
export async function completeOnboardingWithDemo() {
  const { supabase, userId } = await requireAdvisor();

  const { data: newCaseId, error: rpcError } = await supabase.rpc(
    "seed_demo_case_for_current_advisor",
  );

  if (rpcError) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent(rpcError.message)}`,
    );
  }

  await markCompleted(supabase, userId);

  let caseId = newCaseId as string | null;
  if (!caseId) {
    // RPC returns null when a demo case already exists for this advisor.
    const { data: existing } = await supabase
      .from("cases")
      .select("id")
      .eq("label", "demo")
      .eq("advisor_id", userId)
      .single();
    caseId = existing?.id ?? null;
  }

  // Backfill the hardcoded Peter Smith description on the seeded row if
  // it isn't already set. Idempotent — only updates rows where the
  // column is null, so re-runs are safe.
  if (caseId) {
    const { data: caseRow } = await supabase
      .from("cases")
      .select("client_business_id")
      .eq("id", caseId)
      .single();
    if (caseRow?.client_business_id) {
      await supabase
        .from("client_businesses")
        .update({ business_description: PETER_SMITH_DESCRIPTION })
        .eq("id", caseRow.client_business_id)
        .is("business_description", null);
    }
  }

  revalidatePath("/", "layout");
  if (!caseId) redirect("/app");
  redirect(`/app/cases/${caseId}/risk`);
}

// Onboarding step 2B — manual client. Creates a client_business + case
// + simulated valuation, marks onboarding complete, redirects to the
// new case's Discovery surface (which auto-fires the walkthrough on
// zero discovery_responses).
export async function completeOnboardingWithClient(formData: FormData) {
  const { supabase, userId } = await requireAdvisor();

  const { data: advisor } = await supabase
    .from("advisors")
    .select("id, firm_id")
    .eq("id", userId)
    .single();

  if (!advisor) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent("Advisor profile not found.")}`,
    );
  }

  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  if (!domain) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent("Domain is required.")}`,
    );
  }

  const businessName = String(formData.get("business_name") ?? "").trim();
  if (!businessName) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent("Business name is required.")}`,
    );
  }

  const { data: cb, error: cbErr } = await supabase
    .from("client_businesses")
    .insert({
      advisor_id: advisor.id,
      firm_id: advisor.firm_id,
      business_name: businessName,
      domain,
      created_via: "advisor_manual",
    })
    .select("id")
    .single();

  if (cbErr || !cb) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent(cbErr?.message ?? "Could not create client business.")}`,
    );
  }

  const { data: caseRow, error: caseErr } = await supabase
    .from("cases")
    .insert({
      client_business_id: cb.id,
      advisor_id: advisor.id,
      firm_id: advisor.firm_id,
      status: "tier_1",
    })
    .select("id")
    .single();

  if (caseErr || !caseRow) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent(caseErr?.message ?? "Could not create case.")}`,
    );
  }

  const sim = simulateValuation(domain);
  await supabase.from("valuation_snapshots").insert({
    case_id: caseRow.id,
    source: "simulated",
    ...sim,
  });

  // Best-effort: kick off the AI business description. A failure here
  // (no API key, network) shouldn't block the redirect into discovery.
  try {
    await generateBusinessDescription({
      clientBusinessId: cb.id,
      domain,
      businessName,
    });
  } catch (e) {
    console.error("generateBusinessDescription (onboarding) failed", e);
  }

  // AI-powered financials so the case lands on dashboards with
  // realistic numbers (revenue, EBITDA, multiples, working capital,
  // debt). Idempotent + falls back to the clamped simulator on
  // failure inside ensureFinancials.
  try {
    await ensureFinancials({ caseId: caseRow.id });
  } catch (e) {
    console.error("ensureFinancials (onboarding) failed", e);
  }

  await markCompleted(supabase, userId);
  revalidatePath("/", "layout");
  redirect(`/app/cases/${caseRow.id}/discovery`);
}
