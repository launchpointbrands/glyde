"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  nextStatus,
  type PathItem,
  type PathPriority,
  type PathStatus,
} from "@/lib/path-types";

const PRIORITY_ORDER: PathPriority[] = ["high", "medium", "low"];

const BUY_SELL_LABEL: Record<string, string> = {
  none: "no agreement on file",
  in_place: "in place",
  needs_review: "needs review",
  outdated: "outdated",
};

const REVIEW_LABEL: Record<string, string> = {
  never: "never",
  more_than_3_years: "more than 3 years ago",
  "1_to_3_years": "1–3 years ago",
  less_than_1_year: "less than 1 year ago",
};

const TOP2_LABEL: Record<string, string> = {
  "0_10": "0–10%",
  "11_25": "11–25%",
  "26_50": "26–50%",
  "51_75": "51–75%",
  "76_100": "76–100%",
};

const PATH_LABEL: Record<string, string> = {
  family: "family transition",
  internal: "internal transition",
  third_party: "third-party sale",
  esop: "ESOP",
};

const formatUSDShort = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
};

function firstName(full: string | null | undefined): string {
  if (!full) return "your client";
  const trimmed = full.trim();
  return trimmed.split(/\s+/)[0] ?? "your client";
}

// Always-available baseline path items shown when the discovery-driven
// triggers haven't produced enough work yet. Keeps the advisor's path
// from ever being empty — even on a brand-new case before discovery
// has happened.
function baselineItems(contactName: string): Omit<PathItem, "status">[] {
  return [
    {
      key: "baseline_discovery",
      priority: "high",
      headline: `Schedule a discovery conversation with ${contactName}`,
      moduleTag: "Overview · Getting started",
    },
    {
      key: "baseline_exit_timeline",
      priority: "high",
      headline: `Understand ${contactName}'s exit timeline and personal financial goals`,
      moduleTag: "Wealth · Goals",
    },
    {
      key: "baseline_legal_structure",
      priority: "medium",
      headline: "Review the business's current legal and ownership structure",
      moduleTag: "Risk · Business structure",
    },
    {
      key: "baseline_succession",
      priority: "medium",
      headline: "Discuss succession intentions — family, sale, or other?",
      moduleTag: "Succession · Planning",
    },
    {
      key: "baseline_advisors",
      priority: "low",
      headline: "Identify key advisors already in the client's professional network",
      moduleTag: "Overview · Team",
    },
  ];
}

// Build the eligible path items for a case from discovery + module data.
// Each item carries its own status; if no row exists in path_item_states
// the default is 'todo'.
export async function buildPathItems(caseId: string): Promise<PathItem[]> {
  const supabase = await createClient();

  const [
    { data: discoveryRows },
    { data: caseRow },
    { data: wealth },
    { data: valuation },
    { data: readiness },
    { data: states },
  ] = await Promise.all([
    supabase
      .from("discovery_responses")
      .select("field_key, value, status")
      .eq("case_id", caseId),
    supabase
      .from("cases")
      .select(
        "client_business:client_businesses(primary_owner_name, contact_name)",
      )
      .eq("id", caseId)
      .single(),
    supabase
      .from("wealth_plans")
      .select("goal_ebitda, exit_year")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("valuation_snapshots")
      .select("normalized_ebitda")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("readiness_items")
      .select("is_complete")
      .eq("case_id", caseId),
    supabase
      .from("path_item_states")
      .select("item_key, status")
      .eq("case_id", caseId),
  ]);

  // Build a lookup of discovery answers (only those with status='answered'
  // and a usable value).
  const discovery = new Map<string, unknown>();
  for (const row of discoveryRows ?? []) {
    if (row.status === "answered") discovery.set(row.field_key, row.value);
  }

  const cb = Array.isArray(caseRow?.client_business)
    ? caseRow.client_business[0]
    : caseRow?.client_business;
  const owner = firstName(
    (cb?.contact_name as string | null | undefined) ??
      (cb?.primary_owner_name as string | null | undefined),
  );

  const statusByKey = new Map<string, PathStatus>();
  for (const s of states ?? []) {
    statusByKey.set(s.item_key as string, s.status as PathStatus);
  }

  const items: PathItem[] = [];

  // 1. Owner dependency
  if (discovery.get("owner_departure_impact") === "very_likely") {
    items.push({
      key: "owner_departure",
      priority: "high",
      headline: `Address what happens if ${owner} steps away tomorrow`,
      moduleTag: "Risk · Owner dependency",
      status: statusByKey.get("owner_departure") ?? "todo",
    });
  }

  // 2. Customer concentration
  const top2 = discovery.get("top_2_customer_revenue_pct");
  if (typeof top2 === "string" && (top2 === "51_75" || top2 === "76_100")) {
    items.push({
      key: "customer_concentration",
      priority: "high",
      headline: `Diversify revenue — top customers are ${TOP2_LABEL[top2]} of total`,
      moduleTag: "Risk · Customer concentration",
      status: statusByKey.get("customer_concentration") ?? "todo",
    });
  }

  // 3. Buy-sell
  const buySellStatus = discovery.get("buy_sell_status");
  const buySellReviewed = discovery.get("buy_sell_last_reviewed");
  const reviewTriggers =
    typeof buySellReviewed === "string" &&
    (buySellReviewed === "1_to_3_years" ||
      buySellReviewed === "more_than_3_years" ||
      buySellReviewed === "never");
  if (buySellStatus === "needs_review" || reviewTriggers) {
    const reviewedLabel =
      typeof buySellReviewed === "string"
        ? REVIEW_LABEL[buySellReviewed] ?? buySellReviewed
        : (typeof buySellStatus === "string"
            ? BUY_SELL_LABEL[buySellStatus] ?? buySellStatus
            : "review needed");
    items.push({
      key: "buy_sell_review",
      priority: "medium",
      headline: `Update the buy-sell agreement — last reviewed ${reviewedLabel}`,
      moduleTag: "Risk · Buy-sell agreement",
      status: statusByKey.get("buy_sell_review") ?? "todo",
    });
  }

  // 4. EBITDA gap
  const goalEbitda = wealth?.goal_ebitda ?? null;
  const currentEbitda = valuation?.normalized_ebitda ?? null;
  const exitYear = wealth?.exit_year ?? null;
  if (goalEbitda != null && currentEbitda != null) {
    const gap = goalEbitda - currentEbitda;
    if (gap > 500_000) {
      items.push({
        key: "ebitda_gap",
        priority: "medium",
        headline: `Set a plan to reach ${formatUSDShort(goalEbitda)} EBITDA${
          exitYear ? ` by ${exitYear}` : ""
        }`,
        moduleTag: "Wealth · EBITDA gap",
        status: statusByKey.get("ebitda_gap") ?? "todo",
      });
    }
  }

  // 5. Key employee dependency
  if (discovery.get("key_employee_departure_impact") === "very_likely") {
    items.push({
      key: "key_employee_retention",
      priority: "medium",
      headline: "Retain key employees — departure would disrupt operations",
      moduleTag: "Risk · Key employee dependency",
      status: statusByKey.get("key_employee_retention") ?? "todo",
    });
  }

  // 6. Succession readiness
  if (readiness && readiness.length > 0) {
    const completed = readiness.filter((r) => r.is_complete).length;
    const score = Math.round((completed / readiness.length) * 100);
    if (score < 60) {
      // Need succession_plan path label
      const { data: plan } = await supabase
        .from("succession_plans")
        .select("selected_path")
        .eq("case_id", caseId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const pathLabel = plan?.selected_path
        ? PATH_LABEL[plan.selected_path] ?? "transition"
        : "transition";
      items.push({
        key: "succession_readiness",
        priority: "low",
        headline: `Begin formalizing the ${pathLabel} structure`,
        moduleTag: "Succession · Readiness",
        status: statusByKey.get("succession_readiness") ?? "todo",
      });
    }
  }

  // Path must never be empty. If discovery hasn't produced enough
  // triggered items, fold in the baseline list — these are always-
  // applicable conversations to schedule when the case is new.
  if (items.length < 2) {
    for (const baseline of baselineItems(owner)) {
      items.push({
        ...baseline,
        status: statusByKey.get(baseline.key) ?? "todo",
      });
    }
  }

  // Sort: active items first by priority, then done items.
  return items.sort((a, b) => {
    const aDone = a.status === "done";
    const bDone = b.status === "done";
    if (aDone !== bDone) return aDone ? 1 : -1;
    return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
  });
}

export async function cyclePathItemStatus(caseId: string, itemKey: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: existing } = await supabase
    .from("path_item_states")
    .select("status")
    .eq("case_id", caseId)
    .eq("advisor_id", user.id)
    .eq("item_key", itemKey)
    .maybeSingle();

  const current = (existing?.status as PathStatus) ?? "todo";
  const next = nextStatus(current);

  const { error } = await supabase.from("path_item_states").upsert(
    {
      case_id: caseId,
      advisor_id: user.id,
      item_key: itemKey,
      status: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "case_id,advisor_id,item_key" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/app/cases/${caseId}`);
}
