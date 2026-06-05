"use server";

// Discovery → wealth/succession plan reconcilers. These take the client-
// stated goals collected in discovery and fold them into the wealth_plans
// and succession_plans rows that ensureFinancials() first seeds with
// simulator-derived defaults. When a goal is unanswered the prior
// (seeded) value is preserved, so a partially-filled discovery never
// blanks out a plan.
//
// Mirror evaluateRiskFactors: skip demo cases, read only "answered"
// responses, and never throw out of the happy path (callers wrap in
// try/catch). The plan row must already exist — ensureFinancials owns
// creation; these only update.

import { createClient } from "@/lib/supabase/server";

type RiskLevel = "low" | "moderate" | "high";
const RISK_LEVELS: RiskLevel[] = ["low", "moderate", "high"];

const SUCCESSION_PATHS = ["family", "internal", "third_party", "esop"];

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

async function loadAnsweredResponses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  caseId: string,
): Promise<Map<string, unknown>> {
  const { data: responses } = await supabase
    .from("discovery_responses")
    .select("field_key, value, status")
    .eq("case_id", caseId);

  const answered = new Map<string, unknown>();
  for (const r of responses ?? []) {
    if (r.status === "answered") {
      answered.set(r.field_key as string, r.value);
    }
  }
  return answered;
}

// --- Wealth ---------------------------------------------------------------
// net proceeds, exit timeframe → exit_year, target age, goal risk; and when
// the client states a net-proceeds need, derive the goal valuation/EBITDA
// the business has to reach (gross-up for taxes/transaction costs).
export async function recomputeWealthPlan(caseId: string): Promise<void> {
  const supabase = await createClient();

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, label")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRow || caseRow.label === "demo") return;

  const { data: plan } = await supabase
    .from("wealth_plans")
    .select(
      "id, net_proceeds_target, exit_year, target_age, goal_valuation, goal_ebitda, goal_risk",
    )
    .eq("case_id", caseId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!plan) return; // ensureFinancials seeds the row first

  const { data: snap } = await supabase
    .from("valuation_snapshots")
    .select("valuation_estimate, normalized_ebitda, ebitda_multiple")
    .eq("case_id", caseId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const answered = await loadAnsweredResponses(supabase, caseId);

  const patch: Record<string, unknown> = {};

  const netProceeds = asNumber(answered.get("wealth_net_proceeds_target"));
  if (netProceeds != null && netProceeds > 0) {
    patch.net_proceeds_target = Math.round(netProceeds);
  }

  const timeframe = asNumber(answered.get("wealth_exit_timeframe_years"));
  if (timeframe != null && timeframe >= 0) {
    patch.exit_year = new Date().getFullYear() + Math.round(timeframe);
  }

  const targetAge = asNumber(answered.get("wealth_target_age"));
  if (targetAge != null && targetAge > 0) {
    patch.target_age = Math.round(targetAge);
  }

  const goalRiskRaw = answered.get("wealth_goal_risk");
  if (typeof goalRiskRaw === "string" && RISK_LEVELS.includes(goalRiskRaw as RiskLevel)) {
    patch.goal_risk = goalRiskRaw;
  }

  // When the owner states a net-proceeds need, derive the business value
  // they must reach. Gross up ~30% for taxes + transaction costs, and floor
  // at 1.2x the current estimate so the goal is always a stretch above today.
  const currentValuation = (snap?.valuation_estimate as number | null) ?? null;
  const currentEbitda = (snap?.normalized_ebitda as number | null) ?? null;
  const multiple = (snap?.ebitda_multiple as number | null) ?? null;
  if (netProceeds != null && netProceeds > 0) {
    const grossedUp = netProceeds / 0.7;
    const floor = currentValuation != null ? currentValuation * 1.2 : 0;
    const goalValuation = Math.round(Math.max(grossedUp, floor));
    patch.goal_valuation = goalValuation;

    if (multiple != null && multiple > 0) {
      let goalEbitda = Math.round(goalValuation / multiple);
      if (currentEbitda != null && goalEbitda <= currentEbitda) {
        goalEbitda = Math.round(currentEbitda * 1.2) + 1;
      }
      patch.goal_ebitda = goalEbitda;
    }
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from("wealth_plans")
    .update(patch)
    .eq("id", plan.id);
  if (error) console.error("recomputeWealthPlan update failed", error);
}

// --- Succession -----------------------------------------------------------
// chosen transition path + exit priorities (multi-select).
export async function recomputeSuccessionPlan(caseId: string): Promise<void> {
  const supabase = await createClient();

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, label")
    .eq("id", caseId)
    .maybeSingle();
  if (!caseRow || caseRow.label === "demo") return;

  const { data: plan } = await supabase
    .from("succession_plans")
    .select("id, selected_path, priorities")
    .eq("case_id", caseId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!plan) return; // ensureFinancials seeds the row first

  const answered = await loadAnsweredResponses(supabase, caseId);

  const patch: Record<string, unknown> = {};

  const path = answered.get("succession_path");
  if (typeof path === "string" && SUCCESSION_PATHS.includes(path)) {
    patch.selected_path = path;
  }

  const priorities = answered.get("succession_priorities");
  if (Array.isArray(priorities) && priorities.length > 0) {
    patch.priorities = priorities.filter((p) => typeof p === "string");
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from("succession_plans")
    .update(patch)
    .eq("id", plan.id);
  if (error) console.error("recomputeSuccessionPlan update failed", error);
}
