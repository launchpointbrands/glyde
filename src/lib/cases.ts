"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateBusinessDescription } from "@/lib/business-description";
import { ensureFinancials } from "@/lib/financials";
import { createClient } from "@/lib/supabase/server";
import { simulateValuation } from "@/lib/simulate";

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

function deriveBusinessName(domain: string): string {
  const root = domain.split(".")[0] ?? domain;
  return root.charAt(0).toUpperCase() + root.slice(1);
}

export async function createCase(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advisor } = await supabase
    .from("advisors")
    .select("id, firm_id")
    .eq("id", user.id)
    .single();

  if (!advisor) {
    redirect(
      `/app/cases/new?error=${encodeURIComponent("Advisor profile not found.")}`,
    );
  }

  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  if (!domain) {
    redirect(
      `/app/cases/new?error=${encodeURIComponent("Domain is required.")}`,
    );
  }

  const businessName =
    String(formData.get("business_name") ?? "").trim() ||
    deriveBusinessName(domain);

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
      `/app/cases/new?error=${encodeURIComponent(cbErr?.message ?? "Could not create client business.")}`,
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
      `/app/cases/new?error=${encodeURIComponent(caseErr?.message ?? "Could not create case.")}`,
    );
  }

  const sim = simulateValuation(domain);
  await supabase.from("valuation_snapshots").insert({
    case_id: caseRow.id,
    source: "simulated",
    ...sim,
  });

  // Best-effort: kick off the AI business description. A failure here
  // (no API key, network) shouldn't block the redirect into the case.
  try {
    await generateBusinessDescription({
      clientBusinessId: cb.id,
      domain,
      businessName,
    });
  } catch (e) {
    console.error("generateBusinessDescription (createCase) failed", e);
  }

  // Generate AI-powered realistic financial estimates and populate the
  // four module tables. Idempotent + try/catch'd inside ensureFinancials;
  // simulator fallback ensures dashboards always render.
  try {
    await ensureFinancials({ caseId: caseRow.id });
  } catch (e) {
    console.error("ensureFinancials (createCase) failed", e);
  }

  revalidatePath("/app");
  redirect(`/app/cases/${caseRow.id}/risk`);
}
