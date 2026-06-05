// Walkthrough config — flat list of single-question steps.
// One question per screen; field-to-step is 1:1 and used by the discovery
// dashboard to deep-link a row click into the right step.

export type WalkthroughStep = {
  number: number;
  fieldKey: string;
};

export const STEPS: WalkthroughStep[] = [
  { number: 1, fieldKey: "business_tax_structure" },
  { number: 2, fieldKey: "industry_naics" },
  { number: 3, fieldKey: "customer_count" },
  { number: 4, fieldKey: "top_2_customer_revenue_pct" },
  { number: 5, fieldKey: "revenue_recurring_pct" },
  { number: 6, fieldKey: "revenue_renewing_pct" },
  { number: 7, fieldKey: "revenue_one_time_pct" },
  { number: 8, fieldKey: "owner_departure_impact" },
  { number: 9, fieldKey: "key_employee_departure_impact" },
  { number: 10, fieldKey: "top_vendor_revenue_pct" },
  { number: 11, fieldKey: "financial_record_manager" },
  { number: 12, fieldKey: "buy_sell_status" },
  { number: 13, fieldKey: "buy_sell_last_reviewed" },
  { number: 14, fieldKey: "wealth_net_proceeds_target" },
  { number: 15, fieldKey: "wealth_exit_timeframe_years" },
  { number: 16, fieldKey: "wealth_target_age" },
  { number: 17, fieldKey: "wealth_goal_risk" },
  { number: 18, fieldKey: "succession_path" },
  { number: 19, fieldKey: "succession_priorities" },
];

export const TOTAL_STEPS = STEPS.length;

// Section grouping powers the segmented progress bar at the top of the
// walkthrough. Each section spans a contiguous range of question numbers.
export type WalkthroughSection = {
  label: string;
  questionRange: [number, number];
};

export const SECTIONS: WalkthroughSection[] = [
  { label: "Business",   questionRange: [1, 2] },
  { label: "Revenue",    questionRange: [3, 7] },
  { label: "Operations", questionRange: [8, 9] },
  { label: "Risk",       questionRange: [10, 11] },
  { label: "Protection", questionRange: [12, 13] },
  { label: "Goals",      questionRange: [14, 17] },
  { label: "Succession", questionRange: [18, 19] },
];

export type SectionState = "completed" | "current" | "upcoming";

export function sectionState(
  section: WalkthroughSection,
  currentQ: number,
): SectionState {
  const [min, max] = section.questionRange;
  if (currentQ > max) return "completed";
  if (currentQ >= min) return "current";
  return "upcoming";
}

export const FIELD_TO_STEP: Record<string, number> = Object.fromEntries(
  STEPS.map((s) => [s.fieldKey, s.number]),
);

export function getStep(n: number): WalkthroughStep | undefined {
  return STEPS.find((s) => s.number === n);
}

// Step is "Next-eligible" once the field has a row, regardless of status.
// (answered, skipped, or unknown all count as "the advisor has dealt with it.")
export function isStepComplete(
  step: WalkthroughStep,
  rowsByKey: Map<string, { status: string }>,
): boolean {
  return rowsByKey.has(step.fieldKey);
}

// "Needs work" is stricter than "incomplete": a simulated answer counts
// as work to do (the advisor still has to verify it). Used by Resume.
export function stepNeedsWork(
  step: WalkthroughStep,
  rowsByKey: Map<string, { source: string; status: string }>,
): boolean {
  const r = rowsByKey.get(step.fieldKey);
  if (!r) return true;
  if (r.source === "simulated" && r.status === "answered") return true;
  return false;
}

export function firstStepNeedingWork(
  rowsByKey: Map<string, { source: string; status: string }>,
): number {
  for (const step of STEPS) {
    if (stepNeedsWork(step, rowsByKey)) return step.number;
  }
  return 1;
}
