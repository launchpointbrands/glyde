import type { DocumentProps } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import {
  RiskDocument,
  type RiskReportData,
} from "@/components/pdf/pdf-risk";
import {
  SuccessionDocument,
  type SuccessionReportData,
} from "@/components/pdf/pdf-succession";
import {
  ValuationDocument,
  type ValuationReportData,
} from "@/components/pdf/pdf-valuation";
import {
  WealthDocument,
  type WealthReportData,
} from "@/components/pdf/pdf-wealth";
import { ensureFinancials } from "@/lib/financials";
import { evaluateRiskFactors } from "@/lib/risk";
import { createClient } from "@/lib/supabase/server";

export type ReportType = "valuation" | "risk" | "wealth" | "succession";

const REPORT_TITLES: Record<ReportType, string> = {
  valuation: "Business Valuation Report",
  risk: "Business Risk Assessment",
  wealth: "Business Wealth Blueprint",
  succession: "Succession Plan",
};

function todayLong(): string {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function loadCommonContext(caseId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const [{ data: caseRow }, { data: advisor }] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, label, ownership_pct, client_business:client_businesses(business_name, contact_name, primary_owner_name)",
      )
      .eq("id", caseId)
      .maybeSingle(),
    supabase
      .from("advisors")
      .select("full_name, title, email")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!caseRow) throw new Error("Case not found.");

  const cb = Array.isArray(caseRow.client_business)
    ? caseRow.client_business[0]
    : caseRow.client_business;

  const businessName = (cb?.business_name as string | null) ?? "—";
  const contactName =
    (cb?.contact_name as string | null) ??
    (cb?.primary_owner_name as string | null) ??
    "Client";
  const advisorName =
    (advisor?.full_name as string | null) ??
    (advisor?.email as string | null) ??
    "Your Advisor";
  const advisorTitle = (advisor?.title as string | null) ?? "";
  const ownershipPct = (caseRow.ownership_pct as number | null) ?? 100;
  const isDemo = caseRow.label === "demo";

  return {
    supabase,
    contactName,
    businessName,
    advisorName,
    advisorTitle,
    ownershipPct,
    isDemo,
    caseId,
  };
}

async function loadValuationData(
  caseId: string,
): Promise<ValuationReportData> {
  // Lazy-init for cases created before AI estimation; idempotent.
  try {
    await ensureFinancials({ caseId });
  } catch (e) {
    console.error("ensureFinancials (pdf valuation) failed", e);
  }

  const ctx = await loadCommonContext(caseId);

  const [{ data: snap }, { data: responses }] = await Promise.all([
    ctx.supabase
      .from("valuation_snapshots")
      .select(
        "valuation_low, valuation_estimate, valuation_high, equity_value_owned, naics_code, ebitda_multiple, revenue_multiple, revenue_ttm, normalized_ebitda, net_working_capital, interest_bearing_debt, balance_sheet_impact, risk_score, risk_impact_pct_low, risk_impact_pct_high",
      )
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    ctx.supabase
      .from("discovery_responses")
      .select(
        "field_key, value, status, discovery_field:discovery_fields(label, choices)",
      )
      .eq("case_id", caseId),
  ]);

  const characteristics: { label: string; value: string }[] = [];
  for (const r of responses ?? []) {
    if (r.status !== "answered") continue;
    const field = Array.isArray(r.discovery_field)
      ? r.discovery_field[0]
      : r.discovery_field;
    if (!field) continue;
    const label = field.label as string;
    const choices = (field.choices ?? []) as {
      value: string;
      label: string;
    }[];
    let display: string;
    const v = r.value;
    if (v == null) display = "—";
    else if (typeof v === "number") display = String(v);
    else if (typeof v === "string") {
      const match = choices.find((c) => c.value === v);
      display = match?.label ?? v;
    } else display = String(v);
    characteristics.push({ label, value: display });
  }

  return {
    contactName: ctx.contactName,
    businessName: ctx.businessName,
    advisorName: ctx.advisorName,
    advisorTitle: ctx.advisorTitle,
    preparedAt: todayLong(),
    ownershipPct: ctx.ownershipPct,
    isDemo: ctx.isDemo,
    snap: (snap ?? {
      valuation_low: null,
      valuation_estimate: null,
      valuation_high: null,
      equity_value_owned: null,
      naics_code: null,
      ebitda_multiple: null,
      revenue_multiple: null,
      revenue_ttm: null,
      normalized_ebitda: null,
      net_working_capital: null,
      interest_bearing_debt: null,
      balance_sheet_impact: null,
      risk_score: null,
      risk_impact_pct_low: null,
      risk_impact_pct_high: null,
    }) as ValuationReportData["snap"],
    characteristics,
  };
}

async function loadRiskData(caseId: string): Promise<RiskReportData> {
  try {
    await ensureFinancials({ caseId });
    await evaluateRiskFactors(caseId);
  } catch (e) {
    console.error("ensureFinancials/evaluateRiskFactors (pdf risk) failed", e);
  }

  const ctx = await loadCommonContext(caseId);

  const [{ data: assessment }, { data: snap }] = await Promise.all([
    ctx.supabase
      .from("risk_assessments")
      .select(
        "overall_risk, factors, buy_sell_status, risk_to_equity",
      )
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    ctx.supabase
      .from("valuation_snapshots")
      .select("equity_value_owned, risk_impact_pct_low, risk_impact_pct_high")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    contactName: ctx.contactName,
    businessName: ctx.businessName,
    advisorName: ctx.advisorName,
    advisorTitle: ctx.advisorTitle,
    preparedAt: todayLong(),
    overallRisk: (assessment?.overall_risk as string | null) ?? "moderate",
    riskImpactLow: (snap?.risk_impact_pct_low as number | null) ?? 3,
    riskImpactHigh: (snap?.risk_impact_pct_high as number | null) ?? 6,
    factors: (assessment?.factors ?? []) as RiskReportData["factors"],
    buySellStatus: (assessment?.buy_sell_status as string | null) ?? "none",
    equityValueOwned: (snap?.equity_value_owned as number | null) ?? null,
  };
}

async function loadWealthData(caseId: string): Promise<WealthReportData> {
  try {
    await ensureFinancials({ caseId });
  } catch (e) {
    console.error("ensureFinancials (pdf wealth) failed", e);
  }

  const ctx = await loadCommonContext(caseId);

  const [{ data: plan }, { data: snap }] = await Promise.all([
    ctx.supabase
      .from("wealth_plans")
      .select(
        "net_proceeds_target, exit_year, target_age, goal_valuation, goal_ebitda, historic_avg_revenue_growth, goal_revenue_growth, current_risk, goal_risk, historic_ebitda_series",
      )
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    ctx.supabase
      .from("valuation_snapshots")
      .select("valuation_estimate, normalized_ebitda")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const exitYear = (plan?.exit_year as number | null) ?? null;
  const yearsToExit =
    exitYear != null ? Math.max(exitYear - new Date().getFullYear(), 0) : null;

  return {
    contactName: ctx.contactName,
    businessName: ctx.businessName,
    advisorName: ctx.advisorName,
    advisorTitle: ctx.advisorTitle,
    preparedAt: todayLong(),
    netProceedsTarget: (plan?.net_proceeds_target as number | null) ?? null,
    goalValuation: (plan?.goal_valuation as number | null) ?? null,
    goalEbitda: (plan?.goal_ebitda as number | null) ?? null,
    exitYear,
    targetAge: (plan?.target_age as number | null) ?? null,
    yearsToExit,
    historicAvgRevenueGrowth:
      (plan?.historic_avg_revenue_growth as number | null) ?? null,
    goalRevenueGrowth: (plan?.goal_revenue_growth as number | null) ?? null,
    currentRisk: (plan?.current_risk as string | null) ?? null,
    goalRisk: (plan?.goal_risk as string | null) ?? null,
    currentValuation: (snap?.valuation_estimate as number | null) ?? null,
    normalizedEbitda: (snap?.normalized_ebitda as number | null) ?? null,
    historicSeries: ((plan?.historic_ebitda_series ??
      []) as { year: number; value: number }[]),
  };
}

async function loadSuccessionData(
  caseId: string,
): Promise<SuccessionReportData> {
  try {
    await ensureFinancials({ caseId });
  } catch (e) {
    console.error("ensureFinancials (pdf succession) failed", e);
  }

  const ctx = await loadCommonContext(caseId);

  const [{ data: plan }, { data: items }, { data: ref }] = await Promise.all([
    ctx.supabase
      .from("succession_plans")
      .select("selected_path, priorities")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    ctx.supabase
      .from("readiness_items")
      .select("item_key, is_complete")
      .eq("case_id", caseId),
    ctx.supabase
      .from("readiness_item_reference")
      .select("key, category, label, display_order")
      .order("display_order"),
  ]);

  const itemByKey = new Map(
    (items ?? []).map((it) => [
      it.item_key as string,
      Boolean(it.is_complete),
    ]),
  );
  const personalItems: { label: string; is_complete: boolean }[] = [];
  const businessItems: { label: string; is_complete: boolean }[] = [];
  for (const r of ref ?? []) {
    const enriched = {
      label: r.label as string,
      is_complete: itemByKey.get(r.key as string) ?? false,
    };
    if (r.category === "personal") personalItems.push(enriched);
    else businessItems.push(enriched);
  }

  const score = (xs: typeof personalItems, floor: number): number => {
    const total = xs.length;
    if (total === 0) return floor;
    const completed = xs.filter((x) => x.is_complete).length;
    if (completed === 0) return floor;
    const actual = (completed / total) * 100;
    return Math.round(
      (completed / total) * actual + ((total - completed) / total) * floor,
    );
  };
  const personalScore = score(personalItems, 40);
  const businessScore = score(businessItems, 30);
  const overallScore = Math.round((personalScore + businessScore) / 2);

  return {
    contactName: ctx.contactName,
    businessName: ctx.businessName,
    advisorName: ctx.advisorName,
    advisorTitle: ctx.advisorTitle,
    preparedAt: todayLong(),
    selectedPath: (plan?.selected_path as string | null) ?? null,
    priorities: (plan?.priorities ?? []) as string[],
    personalScore,
    businessScore,
    overallScore,
    personalItems,
    businessItems,
  };
}

export async function renderReport(
  caseId: string,
  type: ReportType,
): Promise<{ buffer: Buffer; filename: string; businessName: string }> {
  let doc: ReactElement<DocumentProps>;
  let businessName: string;

  if (type === "valuation") {
    const data = await loadValuationData(caseId);
    businessName = data.businessName;
    doc = <ValuationDocument {...data} />;
  } else if (type === "risk") {
    const data = await loadRiskData(caseId);
    businessName = data.businessName;
    doc = <RiskDocument {...data} />;
  } else if (type === "wealth") {
    const data = await loadWealthData(caseId);
    businessName = data.businessName;
    doc = <WealthDocument {...data} />;
  } else {
    const data = await loadSuccessionData(caseId);
    businessName = data.businessName;
    doc = <SuccessionDocument {...data} />;
  }

  const buffer = await renderToBuffer(doc);
  const date = new Date().toISOString().slice(0, 10);
  const safeName = businessName
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const filename = `Glyde_${REPORT_TITLES[type].replace(/\s+/g, "_")}_${safeName}_${date}.pdf`;
  return { buffer, filename, businessName };
}
