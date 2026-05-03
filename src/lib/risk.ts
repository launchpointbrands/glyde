"use server";

// Discovery → risk factor evaluator. Walks every advisor-verified
// discovery answer through severity rules to produce up to 8 factor
// objects matching the demo case's shape. Aggregates into overall_risk
// and a categorical impact_pct band, then upserts both risk_assessments
// and valuation_snapshots.risk_impact_pct.
//
// Skips demo cases (label='demo') — Peter Smith's factors are
// hand-curated and must not drift.

import { createClient } from "@/lib/supabase/server";

type Severity = "low" | "moderate" | "high";

export type EvaluatedFactor = {
  key: string;
  label: string;
  severity: Severity;
  headline: string;
  explanation: string;
  source_field: string | null;
  source_value: unknown;
  computed_value: unknown;
};

const COPY: Record<
  string,
  {
    label: string;
    field: string | null;
    high: { headline: string; explanation: string };
    moderate: { headline: string; explanation: string };
    low: { headline: string; explanation: string };
  }
> = {
  owner_dependency: {
    label: "Owner dependency risk",
    field: "owner_departure_impact",
    high: {
      headline: "Delegate strategically, build process, and empower your team.",
      explanation:
        "If revenue and operations would be materially disrupted by your departure, it limits the buyer pool and the price they'll pay. Buyers want a business that runs without its founder.",
    },
    moderate: {
      headline: "Strengthen the management team to reduce owner dependency.",
      explanation:
        "Owner involvement creates some dependency. Building a stronger team will improve valuation and reduce buyer concerns.",
    },
    low: {
      headline: "The business runs without daily owner intervention.",
      explanation:
        "Operational independence from the owner is a strong signal to buyers and supports a higher valuation multiple.",
    },
  },
  key_employee_dependency: {
    label: "Key employee dependency risk",
    field: "key_employee_departure_impact",
    high: {
      headline: "Take steps to retain key employees and reduce dependency on them.",
      explanation:
        "When the business depends heavily on specific people, their departure creates an existential risk. Retention plans and cross-training reduce this exposure.",
    },
    moderate: {
      headline: "Strengthen retention programs for key staff.",
      explanation:
        "Some reliance on key staff exists. Retention plans and cross-training would strengthen the business's market position.",
    },
    low: {
      headline: "Team depth reduces key-person risk.",
      explanation:
        "Cross-trained staff and documented processes protect the business from individual departures.",
    },
  },
  customer_concentration: {
    label: "Customer concentration risk",
    field: "top_2_customer_revenue_pct",
    high: {
      headline: "Expand and diversify your customer base.",
      explanation:
        "When a small number of customers drive most of the revenue, losing one creates a material hit. Diversification builds resilience and improves the multiple.",
    },
    moderate: {
      headline: "Continue diversifying the customer base.",
      explanation:
        "Moderate concentration in top customers creates some risk. Diversification improves resilience in a transaction.",
    },
    low: {
      headline: "A diversified customer base supports the valuation.",
      explanation:
        "Revenue spread across many customers signals resilience to buyers and lenders.",
    },
  },
  supplier_diversity: {
    label: "Supplier diversity risk",
    field: "top_vendor_revenue_pct",
    high: {
      headline: "Identify backup suppliers for critical inputs.",
      explanation:
        "Heavy reliance on a single supplier creates operational vulnerability that buyers will flag in diligence.",
    },
    moderate: {
      headline: "Review your supplier relationships routinely.",
      explanation:
        "When one vendor accounts for a significant share of spend, an outage or price hike is a real disruption. Plans for backup sourcing reduce that.",
    },
    low: {
      headline: "Supplier base is well diversified.",
      explanation:
        "No single vendor accounts for an outsized share of spend — operational risk is well managed.",
    },
  },
  financial_practice: {
    label: "Financial practice risks",
    field: "financial_record_manager",
    high: {
      headline: "Engage a bookkeeper and CPA to manage financial records.",
      explanation:
        "Owner-managed books create diligence friction and can mask underlying business performance. Professional records are foundational to a sale.",
    },
    moderate: {
      headline: "Add CPA review to bookkeeper-managed records.",
      explanation:
        "Bookkeeper-only records are a step up but still benefit from periodic CPA review for diligence-readiness.",
    },
    low: {
      headline: "Financial records are professionally managed.",
      explanation:
        "Clean books reduce diligence friction and signal operational rigor to buyers.",
    },
  },
  revenue_quality: {
    label: "Revenue quality risk",
    field: "revenue_recurring_pct",
    high: {
      headline: "Shift toward recurring revenue contracts.",
      explanation:
        "Primarily transactional revenue trades at lower multiples than recurring revenue. Shifting structure improves valuation.",
    },
    moderate: {
      headline: "Continue building recurring revenue streams.",
      explanation:
        "Some recurring revenue exists; growing this share will improve valuation multiples.",
    },
    low: {
      headline: "Maintain and expand recurring revenue streams.",
      explanation:
        "Recurring revenue commands a higher multiple than one-time revenue. This is one of the highest-leverage moves toward valuation.",
    },
  },
  buy_sell: {
    label: "Buy-sell agreement",
    field: "buy_sell_status",
    high: {
      headline: "Update or put in place a current buy-sell agreement.",
      explanation:
        "An outdated or missing buy-sell agreement creates legal and financial risk at the worst possible moment — death, disability, or dispute.",
    },
    moderate: {
      headline: "Review the buy-sell agreement with the client's attorney.",
      explanation:
        "The agreement may not reflect current valuation or ownership intentions and should be reviewed.",
    },
    low: {
      headline: "Buy-sell agreement is current and reviewed.",
      explanation:
        "A current agreement protects equity in the event of death, disability, or dispute.",
    },
  },
  leverage: {
    label: "Leverage risk",
    field: null,
    high: {
      headline: "Reduce debt levels relative to business value.",
      explanation:
        "High leverage limits flexibility and may reduce buyer interest at exit.",
    },
    moderate: {
      headline: "Manage debt levels relative to growth plans.",
      explanation:
        "Moderate leverage is workable but worth monitoring relative to the exit timeline.",
    },
    low: {
      headline: "Leverage is well managed relative to enterprise value.",
      explanation:
        "Modest leverage gives the business flexibility while still capturing the tax benefits of debt financing.",
    },
  },
};

function buildFactor(
  key: string,
  severity: Severity,
  source_value: unknown,
  computed_value: unknown,
): EvaluatedFactor {
  const cfg = COPY[key];
  return {
    key,
    label: cfg.label,
    severity,
    headline: cfg[severity].headline,
    explanation: cfg[severity].explanation,
    source_field: cfg.field,
    source_value,
    computed_value,
  };
}

function evalLikelihood(value: unknown): Severity | null {
  if (value === "very_likely") return "high";
  if (value === "likely") return "moderate";
  if (value === "neutral" || value === "unlikely" || value === "very_unlikely")
    return "low";
  return null;
}

function evalCustomerConcentration(value: unknown): Severity | null {
  if (value === "51_75" || value === "76_100") return "high";
  if (value === "26_50") return "moderate";
  if (value === "0_10" || value === "11_25") return "low";
  return null;
}

function evalSupplierDiversity(value: unknown): Severity | null {
  if (typeof value !== "number") return null;
  if (value > 25) return "high";
  if (value >= 15) return "moderate";
  return "low";
}

function evalFinancialPractice(value: unknown): Severity | null {
  if (value === "self") return "high";
  if (value === "bookkeeper") return "moderate";
  if (
    value === "cpa" ||
    value === "bookkeeper_and_cpa" ||
    value === "fractional_cfo"
  )
    return "low";
  return null;
}

function evalRevenueQuality(value: unknown): Severity | null {
  if (typeof value !== "number") return null;
  if (value < 20) return "high";
  if (value < 40) return "moderate";
  return "low";
}

function evalBuySell(
  status: unknown,
  lastReviewed: unknown,
): Severity | null {
  if (typeof status !== "string") return null;
  if (status === "none" || status === "outdated") return "high";
  if (status === "needs_review") return "moderate";
  if (status === "in_place") {
    if (typeof lastReviewed !== "string") return null;
    if (lastReviewed === "never" || lastReviewed === "more_than_3_years")
      return "high";
    if (lastReviewed === "1_to_3_years") return "moderate";
    if (lastReviewed === "less_than_1_year") return "low";
  }
  return null;
}

function evalLeverage(
  debt: number | null | undefined,
  valuation: number | null | undefined,
): { severity: Severity; ratio: number } | null {
  if (debt == null || valuation == null || valuation <= 0) return null;
  const ratio = debt / valuation;
  if (ratio >= 0.5) return { severity: "high", ratio };
  if (ratio >= 0.25) return { severity: "moderate", ratio };
  return { severity: "low", ratio };
}

export async function evaluateRiskFactors(caseId: string): Promise<void> {
  const supabase = await createClient();

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, label")
    .eq("id", caseId)
    .maybeSingle();

  if (!caseRow) return;
  if (caseRow.label === "demo") return;

  // Only verified-by-advisor answers drive factor scoring. Simulated
  // values shouldn't produce real risk signal.
  const { data: responses } = await supabase
    .from("discovery_responses")
    .select("field_key, value, status, source")
    .eq("case_id", caseId);

  const answered = new Map<string, unknown>();
  for (const r of responses ?? []) {
    if (r.status === "answered" && r.source !== "simulated") {
      answered.set(r.field_key as string, r.value);
    }
  }

  const { data: snap } = await supabase
    .from("valuation_snapshots")
    .select("id, valuation_estimate, interest_bearing_debt")
    .eq("case_id", caseId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const factors: EvaluatedFactor[] = [];

  // 1. owner_dependency
  const ownerVal = answered.get("owner_departure_impact");
  const ownerSev = evalLikelihood(ownerVal);
  if (ownerSev)
    factors.push(buildFactor("owner_dependency", ownerSev, ownerVal, null));

  // 2. key_employee_dependency
  const keVal = answered.get("key_employee_departure_impact");
  const keSev = evalLikelihood(keVal);
  if (keSev)
    factors.push(buildFactor("key_employee_dependency", keSev, keVal, null));

  // 3. customer_concentration
  const ccVal = answered.get("top_2_customer_revenue_pct");
  const ccSev = evalCustomerConcentration(ccVal);
  if (ccSev)
    factors.push(buildFactor("customer_concentration", ccSev, ccVal, null));

  // 4. supplier_diversity
  const sdVal = answered.get("top_vendor_revenue_pct");
  const sdSev = evalSupplierDiversity(sdVal);
  if (sdSev)
    factors.push(buildFactor("supplier_diversity", sdSev, sdVal, null));

  // 5. financial_practice
  const fpVal = answered.get("financial_record_manager");
  const fpSev = evalFinancialPractice(fpVal);
  if (fpSev)
    factors.push(buildFactor("financial_practice", fpSev, fpVal, null));

  // 6. revenue_quality
  const rqVal = answered.get("revenue_recurring_pct");
  const rqSev = evalRevenueQuality(rqVal);
  if (rqSev) factors.push(buildFactor("revenue_quality", rqSev, rqVal, null));

  // 7. buy_sell — combines two discovery fields into a single factor.
  const bsStatus = answered.get("buy_sell_status");
  const bsReviewed = answered.get("buy_sell_last_reviewed");
  const bsSev = evalBuySell(bsStatus, bsReviewed);
  if (bsSev) factors.push(buildFactor("buy_sell", bsSev, bsStatus, null));

  // 8. leverage — computed from valuation snapshot, not discovery.
  const lev = evalLeverage(
    snap?.interest_bearing_debt as number | null | undefined,
    snap?.valuation_estimate as number | null | undefined,
  );
  if (lev) {
    factors.push(
      buildFactor("leverage", lev.severity, null, lev.ratio.toFixed(2)),
    );
  }

  // Aggregate
  const highs = factors.filter((f) => f.severity === "high").length;
  const mods = factors.filter((f) => f.severity === "moderate").length;
  const lows = factors.filter((f) => f.severity === "low").length;

  let overall: Severity;
  if (highs > 0) overall = "high";
  else if (mods > 0) overall = "moderate";
  else if (lows > 0) overall = "low";
  else overall = "moderate"; // no resolved factors — conservative default

  let impactLow: number;
  let impactHigh: number;
  if (highs === 0) {
    impactLow = 3;
    impactHigh = 6;
  } else if (highs === 1) {
    impactLow = 3;
    impactHigh = 5;
  } else if (highs === 2) {
    impactLow = 6;
    impactHigh = 9;
  } else {
    impactLow = 9;
    impactHigh = 12;
  }
  impactLow += mods * 1;
  impactHigh += mods * 2;

  const buySellStatus =
    typeof bsStatus === "string" && bsStatus.length > 0 ? bsStatus : "none";
  const equityAtRisk = (snap?.valuation_estimate as number | null) ?? null;

  const { data: existing } = await supabase
    .from("risk_assessments")
    .select("id")
    .eq("case_id", caseId)
    .maybeSingle();

  const payload = {
    overall_risk: overall,
    factors,
    buy_sell_status: buySellStatus,
    equity_at_risk_value: equityAtRisk,
    risk_to_equity: overall,
    valuation_snapshot_id: snap?.id ?? null,
  };

  if (existing) {
    const { error } = await supabase
      .from("risk_assessments")
      .update({ ...payload, computed_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) console.error("evaluateRiskFactors update failed", error);
  } else {
    const { error } = await supabase
      .from("risk_assessments")
      .insert({ case_id: caseId, ...payload });
    if (error) console.error("evaluateRiskFactors insert failed", error);
  }

  if (snap?.id) {
    await supabase
      .from("valuation_snapshots")
      .update({
        risk_score: overall,
        risk_impact_pct_low: impactLow,
        risk_impact_pct_high: impactHigh,
      })
      .eq("id", snap.id);
  }
}
