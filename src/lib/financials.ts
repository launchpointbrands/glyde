"use server";

// AI-powered realistic financial estimation for a case. Self-healing:
// short-circuits ONLY when the case is the demo seed or when all four
// module rows already exist. If the cache claims completion but any
// row is missing, the function treats the case as a partial-run, clears
// the cache, and refills. Every insert error is surfaced (not swallowed)
// so partial runs cannot stamp the cache and lock the case into an
// empty-dashboard state. Falls back to the deterministic simulator if
// the AI call fails.

import Anthropic from "@anthropic-ai/sdk";
import {
  SIM_MIN_REVENUE,
  SIM_MAX_REVENUE,
  SIM_MIN_EBITDA_MARGIN,
  SIM_MAX_EBITDA_MARGIN,
  SIM_MIN_EBITDA_MULTIPLE,
  SIM_MAX_EBITDA_MULTIPLE,
  SIM_MIN_REVENUE_MULTIPLE,
  SIM_MAX_REVENUE_MULTIPLE,
  SIM_MAX_NWC_PCT,
  SIM_MAX_DEBT_TO_EBITDA,
  simulateValuation,
} from "@/lib/simulate";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a business valuation expert with deep knowledge of SMB financials across all industries. Generate realistic, conservative financial estimates a certified appraiser would consider plausible. Return ONLY valid JSON, no other text.`;

export type FinancialEstimates = {
  revenue_ttm: number;
  ebitda: number;
  revenue_growth_rate: number;
  gross_margin: number;
  working_capital: number;
  total_debt: number;
  ebitda_multiple: number;
  revenue_multiple: number;
  reasoning: string;
};

const PRIORITY_DEFAULTS = [
  "maintain_family_ownership",
  "preserve_operating_culture",
];

function clampNum(n: unknown, lo: number, hi: number, fallback: number) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(Math.max(v, lo), hi);
}

function clampEstimates(raw: Partial<FinancialEstimates>): FinancialEstimates {
  const revenue_ttm = clampNum(raw.revenue_ttm, SIM_MIN_REVENUE, SIM_MAX_REVENUE, 2_000_000);
  const ebitdaFromMargin =
    typeof raw.ebitda === "number" && Number.isFinite(raw.ebitda)
      ? raw.ebitda
      : revenue_ttm * 0.12;
  const ebitda = clampNum(
    ebitdaFromMargin,
    revenue_ttm * SIM_MIN_EBITDA_MARGIN,
    revenue_ttm * SIM_MAX_EBITDA_MARGIN,
    revenue_ttm * 0.12,
  );
  const ebitda_multiple = clampNum(
    raw.ebitda_multiple,
    SIM_MIN_EBITDA_MULTIPLE,
    SIM_MAX_EBITDA_MULTIPLE,
    6,
  );
  const revenue_multiple = clampNum(
    raw.revenue_multiple,
    SIM_MIN_REVENUE_MULTIPLE,
    SIM_MAX_REVENUE_MULTIPLE,
    1,
  );
  const working_capital = clampNum(
    raw.working_capital,
    1,
    revenue_ttm * SIM_MAX_NWC_PCT,
    revenue_ttm * 0.1,
  );
  const total_debt = clampNum(
    raw.total_debt,
    0,
    ebitda * SIM_MAX_DEBT_TO_EBITDA,
    0,
  );
  const revenue_growth_rate = clampNum(raw.revenue_growth_rate, 0, 0.4, 0.05);
  const gross_margin = clampNum(raw.gross_margin, 0.1, 0.9, 0.35);
  return {
    revenue_ttm: Math.round(revenue_ttm),
    ebitda: Math.round(ebitda),
    revenue_growth_rate,
    gross_margin,
    working_capital: Math.round(working_capital),
    total_debt: Math.round(total_debt),
    ebitda_multiple: +ebitda_multiple.toFixed(2),
    revenue_multiple: +revenue_multiple.toFixed(2),
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning : "",
  };
}

function tryParseJson(text: string): Partial<FinancialEstimates> | null {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

async function callAnthropic(args: {
  businessName: string;
  domain: string;
  description: string | null;
  naicsCode: string | null;
  employeeCount: number | string | null;
  discoveryAnswers: Record<string, unknown>;
}): Promise<FinancialEstimates | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[ensureFinancials] ANTHROPIC_API_KEY not set; falling back to simulator");
    return null;
  }

  const userMessage = `Business name: ${args.businessName}
Domain: ${args.domain}
Description: ${args.description ?? "(none provided)"}
NAICS code: ${args.naicsCode ?? "(unknown)"}
Employee count: ${args.employeeCount ?? "(unknown)"}

Discovery answers so far:
${JSON.stringify(args.discoveryAnswers, null, 2)}

Generate realistic financial estimates and return ONLY this JSON:
{
  "revenue_ttm": number,
  "ebitda": number,
  "revenue_growth_rate": number,
  "gross_margin": number,
  "working_capital": number,
  "total_debt": number,
  "ebitda_multiple": number,
  "revenue_multiple": number,
  "reasoning": string
}

Constraints:
- EBITDA must be 8–25% of revenue.
- EBITDA multiple must be 3–12x.
- Revenue multiple must be 0.3–3x.
- Use employee count as a primary signal: $100K–$300K revenue per employee for service businesses, $200K–$500K for product/manufacturing.
- Working capital must be positive and < 30% of revenue.
- Total debt must be < 3× EBITDA.
- Be conservative. Lean toward smaller-than-bigger when in doubt.
- Reasoning is one short paragraph explaining the key assumptions.`;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    message.content[0]?.type === "text" ? message.content[0].text : "";
  const parsed = tryParseJson(text);
  if (!parsed) return null;
  return clampEstimates(parsed);
}

function deriveValuation(est: FinancialEstimates, ownershipPct: number) {
  const v_ebitda = est.ebitda * est.ebitda_multiple;
  const v_revenue = est.revenue_ttm * est.revenue_multiple;
  const v_income = (v_ebitda + v_revenue) / 2;
  const valuation_estimate = Math.round((v_ebitda + v_revenue + v_income) / 3);
  const valuation_low = Math.round(valuation_estimate * 0.85);
  const valuation_high = Math.round(valuation_estimate * 1.15);
  const equity_value_owned = Math.round(
    (valuation_estimate * ownershipPct) / 100,
  );
  const balance_sheet_impact = est.working_capital - est.total_debt;
  return {
    valuation_low,
    valuation_estimate,
    valuation_high,
    equity_value_owned,
    balance_sheet_impact,
  };
}

function deriveRiskScore(est: FinancialEstimates): "low" | "moderate" | "high" {
  if (est.ebitda_multiple >= 8) return "low";
  if (est.ebitda_multiple <= 4) return "high";
  return "moderate";
}

function buildHistoricEbitdaSeries(currentEbitda: number, growthRate: number) {
  const currentYear = new Date().getFullYear();
  const back = Math.max(0.3, 1 + growthRate);
  return [
    { year: currentYear - 2, value: Math.round(currentEbitda / (back * back)) },
    { year: currentYear - 1, value: Math.round(currentEbitda / back) },
    { year: currentYear, value: currentEbitda },
  ];
}

export async function ensureFinancials({
  caseId,
}: {
  caseId: string;
}): Promise<void> {
  const supabase = await createClient();

  const { data: caseRow } = await supabase
    .from("cases")
    .select(
      "id, label, ownership_pct, financial_estimates, client_business_id, client_business:client_businesses(business_name, domain, business_description)",
    )
    .eq("id", caseId)
    .maybeSingle();

  if (!caseRow) {
    console.warn(`[ensureFinancials ${caseId}] case not found`);
    return;
  }
  // Never touch the demo seed.
  if (caseRow.label === "demo") return;

  // Self-healing cache check: short-circuit ONLY if every module row
  // actually exists. If cache claims completion but any row is missing,
  // we treat this as a partial run, clear the cache, and refill below.
  const [{ data: snap }, { data: risk }, { data: wealth }, { data: succ }] =
    await Promise.all([
      supabase
        .from("valuation_snapshots")
        .select("id")
        .eq("case_id", caseId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("risk_assessments")
        .select("id")
        .eq("case_id", caseId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("wealth_plans")
        .select("id")
        .eq("case_id", caseId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("succession_plans")
        .select("id")
        .eq("case_id", caseId)
        .limit(1)
        .maybeSingle(),
    ]);

  const allFourPresent = Boolean(snap && risk && wealth && succ);
  if (caseRow.financial_estimates && allFourPresent) return;

  if (caseRow.financial_estimates && !allFourPresent) {
    console.warn(
      `[ensureFinancials ${caseId}] cache set but partial state — snap:${Boolean(snap)} risk:${Boolean(risk)} wealth:${Boolean(wealth)} succession:${Boolean(succ)} — refilling missing rows`,
    );
  }

  const cb = Array.isArray(caseRow.client_business)
    ? caseRow.client_business[0]
    : caseRow.client_business;

  const businessName = (cb?.business_name as string | null) ?? "Unknown";
  const domain = (cb?.domain as string | null) ?? "";
  const description = (cb?.business_description as string | null) ?? null;
  const ownershipPct = (caseRow.ownership_pct as number | null) ?? 100;

  const { data: responses } = await supabase
    .from("discovery_responses")
    .select("field_key, value")
    .eq("case_id", caseId);
  const discoveryAnswers: Record<string, unknown> = {};
  for (const r of responses ?? []) {
    discoveryAnswers[r.field_key as string] = r.value;
  }

  const employeeCount =
    discoveryAnswers["employee_count"] ?? discoveryAnswers["employees"] ?? null;
  const naicsFromDiscovery =
    (discoveryAnswers["industry_naics"] as string | null | undefined) ?? null;

  let estimates: FinancialEstimates | null = null;
  try {
    console.log(`[ensureFinancials ${caseId}] calling Anthropic`);
    estimates = await callAnthropic({
      businessName,
      domain,
      description,
      naicsCode: naicsFromDiscovery,
      employeeCount: employeeCount as number | string | null,
      discoveryAnswers,
    });
    if (estimates) {
      console.log(`[ensureFinancials ${caseId}] AI estimates received`);
    } else {
      console.warn(`[ensureFinancials ${caseId}] AI returned null; falling back to simulator`);
    }
  } catch (e) {
    console.error(`[ensureFinancials ${caseId}] AI call threw`, e);
  }

  let source: "ai" | "simulated" = "ai";
  if (!estimates) {
    source = "simulated";
    const sim = simulateValuation(domain || businessName);
    estimates = clampEstimates({
      revenue_ttm: sim.revenue_ttm,
      ebitda: sim.normalized_ebitda,
      revenue_growth_rate: 0.05,
      gross_margin: 0.35,
      working_capital: sim.net_working_capital,
      total_debt: sim.interest_bearing_debt,
      ebitda_multiple: sim.ebitda_multiple,
      revenue_multiple: sim.revenue_multiple,
      reasoning: "Fallback to deterministic simulator (AI unavailable).",
    });
  }

  const v = deriveValuation(estimates, ownershipPct);
  const riskScore = deriveRiskScore(estimates);
  const riskImpactLow =
    riskScore === "low" ? 0 : riskScore === "moderate" ? 4 : 10;
  const riskImpactHigh =
    riskScore === "low" ? 2 : riskScore === "moderate" ? 6 : 15;

  // 1. valuation_snapshots
  let valuationSnapshotId: string | null = (snap?.id as string | null) ?? null;
  if (!snap) {
    const { data: inserted, error } = await supabase
      .from("valuation_snapshots")
      .insert({
        case_id: caseId,
        source,
        valuation_low: v.valuation_low,
        valuation_estimate: v.valuation_estimate,
        valuation_high: v.valuation_high,
        equity_value_owned: v.equity_value_owned,
        naics_code: naicsFromDiscovery,
        ebitda_multiple: estimates.ebitda_multiple,
        revenue_multiple: estimates.revenue_multiple,
        revenue_ttm: estimates.revenue_ttm,
        normalized_ebitda: estimates.ebitda,
        net_working_capital: estimates.working_capital,
        interest_bearing_debt: estimates.total_debt,
        balance_sheet_impact: v.balance_sheet_impact,
        risk_score: riskScore,
        risk_impact_pct_low: riskImpactLow,
        risk_impact_pct_high: riskImpactHigh,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      console.error(`[ensureFinancials ${caseId}] valuation_snapshots insert failed`, error);
      throw new Error(`valuation_snapshots insert failed: ${error?.message ?? "unknown"}`);
    }
    valuationSnapshotId = inserted.id as string;
  }

  // 2. risk_assessments
  if (!risk) {
    const buySellStatus =
      (discoveryAnswers["buy_sell_status"] as string | null) ?? "none";
    const { error } = await supabase.from("risk_assessments").insert({
      case_id: caseId,
      overall_risk: riskScore,
      factors: [],
      buy_sell_status: buySellStatus,
      equity_at_risk_value: v.equity_value_owned,
      risk_to_equity: riskScore,
      valuation_snapshot_id: valuationSnapshotId,
    });
    if (error) {
      console.error(`[ensureFinancials ${caseId}] risk_assessments insert failed`, error);
      throw new Error(`risk_assessments insert failed: ${error.message}`);
    }
  }

  // 3. wealth_plans
  if (!wealth) {
    const goalEbitda = Math.round(estimates.ebitda * 1.5);
    const goalValuation = Math.round(v.valuation_estimate * 1.3);
    const netProceedsTarget = Math.round(goalValuation * 0.7);
    const goalRevenueGrowth = Math.max(estimates.revenue_growth_rate, 0.1);
    const exitYear = new Date().getFullYear() + 7;
    const { error } = await supabase.from("wealth_plans").insert({
      case_id: caseId,
      net_proceeds_target: netProceedsTarget,
      exit_year: exitYear,
      target_age: 65,
      goal_valuation: goalValuation,
      goal_ebitda: goalEbitda,
      historic_avg_revenue_growth: estimates.revenue_growth_rate,
      goal_revenue_growth: goalRevenueGrowth,
      current_risk: riskScore,
      goal_risk: "low",
      historic_ebitda_series: buildHistoricEbitdaSeries(
        estimates.ebitda,
        estimates.revenue_growth_rate,
      ),
    });
    if (error) {
      console.error(`[ensureFinancials ${caseId}] wealth_plans insert failed`, error);
      throw new Error(`wealth_plans insert failed: ${error.message}`);
    }
  }

  // 4. succession_plans
  if (!succ) {
    const { error } = await supabase.from("succession_plans").insert({
      case_id: caseId,
      selected_path: "third_party",
      priorities: PRIORITY_DEFAULTS,
    });
    if (error) {
      console.error(`[ensureFinancials ${caseId}] succession_plans insert failed`, error);
      throw new Error(`succession_plans insert failed: ${error.message}`);
    }
  }

  // Cache last — only after every required insert succeeded. A throw above
  // skips this, leaving financial_estimates null so the next dashboard load
  // retries the missing rows.
  const { error: cacheErr } = await supabase
    .from("cases")
    .update({ financial_estimates: { ...estimates, source } })
    .eq("id", caseId);
  if (cacheErr) {
    console.error(`[ensureFinancials ${caseId}] cache write failed`, cacheErr);
  } else {
    console.log(`[ensureFinancials ${caseId}] complete (source=${source})`);
  }
}
