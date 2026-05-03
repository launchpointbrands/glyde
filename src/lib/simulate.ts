// Deterministic, plausible-looking valuation generator. Same domain in
// produces the same numbers out, every run. Replaced by the real valuation
// API integration in production — this is for MVP/demo only.
//
// No enrichment, no NAICS inference, no API calls. Just the numeric shape
// the rest of the app expects to flow through cleanly.

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAICS_OPTIONS = [
  "541330", // Engineering Services
  "561720", // Janitorial Services
  "332710", // Machine Shops
  "452210", // Department Stores
  "722511", // Full-Service Restaurants
  "238210", // Electrical Contractors
  "561110", // Office Administrative Services
];

// Sanity ranges — applied as hard clamps regardless of hash output, so
// the simulator can never produce e.g. a $40M valuation for a tiny
// shop. The AI estimator (src/lib/financials.ts) re-applies the same
// clamps so even a hallucinated response stays in the plausible band.
export const SIM_MIN_REVENUE = 500_000;
export const SIM_MAX_REVENUE = 50_000_000;
export const SIM_MIN_EBITDA_MARGIN = 0.08;
export const SIM_MAX_EBITDA_MARGIN = 0.25;
export const SIM_MIN_EBITDA_MULTIPLE = 3;
export const SIM_MAX_EBITDA_MULTIPLE = 12;
export const SIM_MIN_REVENUE_MULTIPLE = 0.3;
export const SIM_MAX_REVENUE_MULTIPLE = 3;
export const SIM_MAX_NWC_PCT = 0.3; // working capital ≤ 30% of revenue
export const SIM_MAX_DEBT_TO_EBITDA = 3; // total debt ≤ 3 × EBITDA

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(Math.max(n, lo), hi);

export function simulateValuation(domain: string) {
  const rand = mulberry32(fnv1a(domain));
  const r = (lo: number, hi: number) => lo + rand() * (hi - lo);
  const ri = (lo: number, hi: number) => Math.round(r(lo, hi));

  const revenue_ttm = clamp(
    ri(1_500_000, 25_000_000),
    SIM_MIN_REVENUE,
    SIM_MAX_REVENUE,
  );
  const ebitda_margin = clamp(
    r(0.08, 0.2),
    SIM_MIN_EBITDA_MARGIN,
    SIM_MAX_EBITDA_MARGIN,
  );
  const normalized_ebitda = Math.round(revenue_ttm * ebitda_margin);
  const ebitda_multiple = +clamp(
    r(5.0, 11.0),
    SIM_MIN_EBITDA_MULTIPLE,
    SIM_MAX_EBITDA_MULTIPLE,
  ).toFixed(2);
  const revenue_multiple = +clamp(
    r(0.8, 2.4),
    SIM_MIN_REVENUE_MULTIPLE,
    SIM_MAX_REVENUE_MULTIPLE,
  ).toFixed(2);

  const v_ebitda = normalized_ebitda * ebitda_multiple;
  const v_revenue = revenue_ttm * revenue_multiple;
  const v_income = (v_ebitda + v_revenue) / 2;
  const valuation_estimate = Math.round((v_ebitda + v_revenue + v_income) / 3);
  const valuation_low = Math.round(valuation_estimate * 0.9);
  const valuation_high = Math.round(valuation_estimate * 1.1);

  // Working capital: positive, ≤ 30% of revenue.
  const net_working_capital = clamp(
    Math.round(revenue_ttm * r(0.05, 0.18)),
    1,
    Math.round(revenue_ttm * SIM_MAX_NWC_PCT),
  );
  // Total debt: ≤ 3 × EBITDA.
  const interest_bearing_debt = clamp(
    Math.round(revenue_ttm * r(0.05, 0.2)),
    0,
    Math.round(normalized_ebitda * SIM_MAX_DEBT_TO_EBITDA),
  );
  const balance_sheet_impact = net_working_capital - interest_bearing_debt;

  const risk_pick = rand();
  const risk_score: "low" | "moderate" | "high" =
    risk_pick < 0.2 ? "low" : risk_pick < 0.7 ? "moderate" : "high";
  const risk_impact_pct_low =
    risk_score === "low" ? 0 : risk_score === "moderate" ? 4 : 10;
  const risk_impact_pct_high =
    risk_score === "low" ? 2 : risk_score === "moderate" ? 6 : 15;

  const naics_code = NAICS_OPTIONS[ri(0, NAICS_OPTIONS.length - 1)];

  return {
    valuation_low,
    valuation_estimate,
    valuation_high,
    equity_value_owned: null,
    naics_code,
    ebitda_multiple,
    revenue_multiple,
    revenue_ttm,
    normalized_ebitda,
    net_working_capital,
    interest_bearing_debt,
    balance_sheet_impact,
    risk_score,
    risk_impact_pct_low,
    risk_impact_pct_high,
    raw_response: null,
  };
}
