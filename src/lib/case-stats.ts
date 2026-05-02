import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Severity = "low" | "moderate" | "high";

export type ValuationSnapshot = {
  valuation_low: number | null;
  valuation_estimate: number | null;
  valuation_high: number | null;
  ebitda_multiple: number | null;
  revenue_multiple: number | null;
  normalized_ebitda: number | null;
};

export type RiskAssessment = {
  overall_risk: Severity | null;
  factors: Array<{ severity: Severity }> | null;
  buy_sell_status: string | null;
};

export type WealthPlan = {
  goal_valuation: number | null;
  goal_ebitda: number | null;
  current_risk: Severity | null;
  goal_risk: Severity | null;
};

export type SuccessionPlan = {
  selected_path: string | null;
};

export type ReadinessRow = {
  category: string;
  is_complete: boolean;
};

export type CaseStats = {
  valuation: ValuationSnapshot | null;
  risk: RiskAssessment | null;
  wealth: WealthPlan | null;
  succession: SuccessionPlan | null;
  readiness: ReadinessRow[];
  // Derived
  personalScore: number;
  businessScore: number;
  overallScore: number | null;
  ebitdaGap: number | null;
};

// Per-case metrics shared by the case layout (persistent stats bar) and
// the Overview page (module summary cards). Wrapped in React `cache()` so
// both consumers in the same request tree share one round trip per table.
export const getCaseStats = cache(async (caseId: string): Promise<CaseStats> => {
  const supabase = await createClient();

  const [
    { data: valuation },
    { data: risk },
    { data: wealth },
    { data: succession },
    { data: readiness },
  ] = await Promise.all([
    supabase
      .from("valuation_snapshots")
      .select(
        "valuation_low, valuation_estimate, valuation_high, ebitda_multiple, revenue_multiple, normalized_ebitda",
      )
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("risk_assessments")
      .select("overall_risk, factors, buy_sell_status")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("wealth_plans")
      .select("goal_valuation, goal_ebitda, current_risk, goal_risk")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("succession_plans")
      .select("selected_path")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("readiness_items")
      .select("category, is_complete")
      .eq("case_id", caseId),
  ]);

  const readinessRows = (readiness ?? []) as ReadinessRow[];
  const personalRows = readinessRows.filter((r) => r.category === "personal");
  const businessRows = readinessRows.filter((r) => r.category === "business");
  const personalScore =
    personalRows.length === 0
      ? 0
      : Math.round(
          (personalRows.filter((r) => r.is_complete).length /
            personalRows.length) *
            100,
        );
  const businessScore =
    businessRows.length === 0
      ? 0
      : Math.round(
          (businessRows.filter((r) => r.is_complete).length /
            businessRows.length) *
            100,
        );
  const overallScore =
    personalRows.length + businessRows.length === 0
      ? null
      : Math.round((personalScore + businessScore) / 2);

  const ebitdaGap =
    wealth?.goal_ebitda != null && valuation?.normalized_ebitda != null
      ? wealth.goal_ebitda - valuation.normalized_ebitda
      : null;

  return {
    valuation: (valuation as ValuationSnapshot | null) ?? null,
    risk: (risk as RiskAssessment | null) ?? null,
    wealth: (wealth as WealthPlan | null) ?? null,
    succession: (succession as SuccessionPlan | null) ?? null,
    readiness: readinessRows,
    personalScore,
    businessScore,
    overallScore,
    ebitdaGap,
  };
});
