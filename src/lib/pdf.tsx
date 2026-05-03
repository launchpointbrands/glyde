import type { DocumentProps } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { PlaceholderDocument } from "@/components/pdf/pdf-placeholder";
import {
  ValuationDocument,
  type ValuationReportData,
} from "@/components/pdf/pdf-valuation";
import { ensureFinancials } from "@/lib/financials";
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
  } else {
    // Risk / Wealth / Succession render the placeholder for now.
    const ctx = await loadCommonContext(caseId);
    businessName = ctx.businessName;
    doc = (
      <PlaceholderDocument
        reportTitle={REPORT_TITLES[type]}
        contactName={ctx.contactName}
        businessName={ctx.businessName}
        advisorName={ctx.advisorName}
        advisorTitle={ctx.advisorTitle}
        preparedAt={todayLong()}
        reportType={REPORT_TITLES[type]}
      />
    );
  }

  const buffer = await renderToBuffer(doc);
  const date = new Date().toISOString().slice(0, 10);
  const safeName = businessName
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const filename = `Glyde_${REPORT_TITLES[type].replace(/\s+/g, "_")}_${safeName}_${date}.pdf`;
  return { buffer, filename, businessName };
}
