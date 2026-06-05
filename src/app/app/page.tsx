import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { TOTAL_STEPS } from "@/lib/discovery-walkthrough";
import { createClient } from "@/lib/supabase/server";

// Advisor book-of-business rollup. Aggregates every case in the advisor's
// book (RLS scopes the queries to them) into firm-level KPIs, risk and
// exit distributions, and a prioritized worklist. All values come from the
// same per-case tables the client pages read.

function formatUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

type Risk = "low" | "moderate" | "high";

// Severity colors. Green matches the valuation slider's gradient
// (components/dashboard/valuation-scale-bar) so the two read as one system.
const RISK_LOW = "#22C55E";
const RISK_MOD = "#B45309";
const RISK_HIGH = "#C0392B";

const PATH_LABEL: Record<string, string> = {
  family: "Family transition",
  internal: "Internal transition",
  third_party: "Third-party sale",
  esop: "ESOP",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: cases },
    { data: valuations },
    { data: risks },
    { data: wealth },
    { data: succession },
    { data: readiness },
    { data: discovery },
  ] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, created_at, client_business:client_businesses(business_name, domain, contact_name, primary_owner_name)",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("valuation_snapshots")
      .select(
        "case_id, valuation_estimate, equity_value_owned, revenue_ttm, normalized_ebitda, computed_at",
      )
      .order("computed_at", { ascending: false }),
    supabase.from("risk_assessments").select("case_id, overall_risk, buy_sell_status"),
    supabase.from("wealth_plans").select("case_id, net_proceeds_target, exit_year"),
    supabase.from("succession_plans").select("case_id, selected_path"),
    supabase.from("readiness_items").select("case_id, is_complete"),
    supabase.from("discovery_responses").select("case_id, status, source"),
  ]);

  const caseList = cases ?? [];

  if (caseList.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-8 py-16">
        <div className="max-w-md space-y-5 text-center">
          <h1 className="text-stat font-semibold text-text-primary">
            Your book is empty
          </h1>
          <p className="text-body text-text-secondary">
            Add your first business owner client and your book-level metrics
            will appear here.
          </p>
          <Link
            href="/app/cases/new"
            className="inline-block rounded-md bg-green-400 px-5 py-2.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
          >
            Add a client
          </Link>
        </div>
      </main>
    );
  }

  // Latest valuation snapshot per case (rows are ordered desc by computed_at).
  const valByCase = new Map<string, NonNullable<typeof valuations>[number]>();
  for (const v of valuations ?? []) {
    if (!valByCase.has(v.case_id)) valByCase.set(v.case_id, v);
  }
  const riskByCase = new Map((risks ?? []).map((r) => [r.case_id, r]));
  const wealthByCase = new Map((wealth ?? []).map((w) => [w.case_id, w]));
  const pathByCase = new Map(
    (succession ?? []).map((s) => [s.case_id, s.selected_path as string | null]),
  );

  const readinessByCase = new Map<string, { complete: number; total: number }>();
  for (const r of readiness ?? []) {
    const cur = readinessByCase.get(r.case_id) ?? { complete: 0, total: 0 };
    cur.total += 1;
    if (r.is_complete) cur.complete += 1;
    readinessByCase.set(r.case_id, cur);
  }
  const verifiedByCase = new Map<string, number>();
  for (const d of discovery ?? []) {
    if (d.status !== "answered" || d.source === "simulated") continue;
    verifiedByCase.set(d.case_id, (verifiedByCase.get(d.case_id) ?? 0) + 1);
  }

  // --- Rollups ------------------------------------------------------------
  const thisYear = new Date().getFullYear();
  let totalValue = 0;
  let totalEquity = 0;
  let totalRevenue = 0;
  let totalEbitda = 0;
  let projectedLiquidity = 0;
  const riskCounts: Record<Risk, number> = { low: 0, moderate: 0, high: 0 };
  const pathCounts: Record<string, number> = {};
  const exitBuckets = [
    { label: "Within 2 yrs", min: 0, max: 2, count: 0 },
    { label: "3–5 yrs", min: 3, max: 5, count: 0 },
    { label: "6–10 yrs", min: 6, max: 10, count: 0 },
    { label: "10+ yrs", min: 11, max: 999, count: 0 },
  ];
  let buySellGaps = 0;
  let buySellReview = 0;
  let exitWithin5 = 0;

  type WorklistRow = {
    id: string;
    name: string;
    business: string;
    domain: string | null;
    value: number | null;
    flags: { label: string; tone: "danger" | "warning" }[];
  };
  const worklist: WorklistRow[] = [];

  for (const c of caseList) {
    const cb = Array.isArray(c.client_business)
      ? c.client_business[0]
      : c.client_business;
    const business = cb?.business_name ?? "Unknown business";
    const person = cb?.contact_name ?? cb?.primary_owner_name ?? business;

    const v = valByCase.get(c.id);
    totalValue += Number(v?.valuation_estimate ?? 0);
    totalEquity += Number(v?.equity_value_owned ?? 0);
    totalRevenue += Number(v?.revenue_ttm ?? 0);
    totalEbitda += Number(v?.normalized_ebitda ?? 0);

    const w = wealthByCase.get(c.id);
    projectedLiquidity += Number(w?.net_proceeds_target ?? 0);

    const r = riskByCase.get(c.id);
    const risk = (r?.overall_risk as Risk | undefined) ?? undefined;
    if (risk) riskCounts[risk] += 1;
    const buySell = (r?.buy_sell_status as string | undefined) ?? "none";
    const isGap = buySell === "none" || buySell === "outdated";
    if (isGap) buySellGaps += 1;
    if (buySell === "needs_review") buySellReview += 1;

    const path = pathByCase.get(c.id);
    if (path) pathCounts[path] = (pathCounts[path] ?? 0) + 1;

    const yearsToExit = w?.exit_year ? Number(w.exit_year) - thisYear : null;
    if (yearsToExit != null) {
      if (yearsToExit <= 5) exitWithin5 += 1;
      const bucket = exitBuckets.find(
        (b) => yearsToExit >= b.min && yearsToExit <= b.max,
      );
      if (bucket) bucket.count += 1;
    }

    const rd = readinessByCase.get(c.id);
    const readinessScore =
      rd && rd.total > 0 ? Math.round((rd.complete / rd.total) * 100) : null;
    const verified = verifiedByCase.get(c.id) ?? 0;

    const flags: WorklistRow["flags"] = [];
    if (risk === "high") flags.push({ label: "High risk", tone: "danger" });
    if (isGap)
      flags.push({
        label: buySell === "none" ? "No buy-sell" : "Buy-sell outdated",
        tone: "danger",
      });
    else if (buySell === "needs_review")
      flags.push({ label: "Buy-sell review", tone: "warning" });
    if (readinessScore != null && readinessScore < 40)
      flags.push({ label: "Low readiness", tone: "warning" });
    if (verified < TOTAL_STEPS)
      flags.push({ label: "Discovery incomplete", tone: "warning" });

    if (flags.length > 0) {
      worklist.push({
        id: c.id,
        name: person,
        business,
        domain: cb?.domain ?? null,
        value: v?.valuation_estimate != null ? Number(v.valuation_estimate) : null,
        flags,
      });
    }
  }

  // Worklist: most flags first, then by value.
  worklist.sort(
    (a, b) => b.flags.length - a.flags.length || (b.value ?? 0) - (a.value ?? 0),
  );

  const clientCount = caseList.length;
  const riskTotal = riskCounts.low + riskCounts.moderate + riskCounts.high || 1;
  const maxExitBucket = Math.max(...exitBuckets.map((b) => b.count), 1);
  const pathEntries = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]);
  const maxPath = Math.max(...pathEntries.map(([, n]) => n), 1);

  return (
    <main className="flex flex-1 flex-col px-5 pt-7 pb-12 md:px-10 md:pt-9 md:pb-16">
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mb-7 space-y-1.5">
          <p className="text-eyebrow uppercase text-text-tertiary">Your book</p>
          <h1 className="text-page font-semibold text-text-primary">Dashboard</h1>
          <p className="text-meta text-text-secondary">
            Across {clientCount}{" "}
            {clientCount === 1 ? "client" : "clients"} · {formatUSD(totalRevenue)}{" "}
            revenue · {formatUSD(totalEbitda)} EBITDA under advisement
          </p>
        </div>

        {/* Row 1 — hero KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi
            label="Total client value"
            value={formatUSD(totalValue)}
            sub="Aggregate enterprise value"
          />
          <Kpi
            label="Total client equity"
            value={formatUSD(totalEquity)}
            sub="Owners' combined stake"
          />
          <Kpi
            label="Active clients"
            value={String(clientCount)}
            sub="Business owners advised"
          />
          <Kpi
            label="Projected liquidity"
            value={formatUSD(projectedLiquidity)}
            sub="Net proceeds at planned exits"
            accent
          />
        </div>

        {/* Row 2 — risk + buy-sell */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Risk across the book">
            {/* Low → high, left to right. Green matches the valuation slider. */}
            <div className="flex h-3 overflow-hidden rounded-full">
              <Seg n={riskCounts.low} total={riskTotal} color={RISK_LOW} />
              <Seg n={riskCounts.moderate} total={riskTotal} color={RISK_MOD} />
              <Seg n={riskCounts.high} total={riskTotal} color={RISK_HIGH} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <RiskLegend color={RISK_LOW} label="Low" n={riskCounts.low} />
              <RiskLegend
                color={RISK_MOD}
                label="Moderate"
                n={riskCounts.moderate}
              />
              <RiskLegend color={RISK_HIGH} label="High" n={riskCounts.high} />
            </div>
          </Card>

          <Card title="Buy-sell protection">
            <div className="flex items-end gap-3">
              <span className="font-mono text-stat font-semibold tabular-nums text-text-primary">
                {buySellGaps}
              </span>
              <span className="pb-1 text-meta text-text-secondary">
                {buySellGaps === 1 ? "client has" : "clients have"} no current
                buy-sell agreement
              </span>
            </div>
            <p className="mt-3 text-meta text-text-secondary">
              {buySellReview > 0 ? (
                <>
                  <span className="font-medium text-warning-fg">
                    {buySellReview}
                  </span>{" "}
                  more {buySellReview === 1 ? "needs" : "need"} review.{" "}
                </>
              ) : null}
              An updated agreement protects each owner&apos;s equity at death,
              disability, or dispute.
            </p>
          </Card>
        </div>

        {/* Row 3 — exit timeline + succession mix */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card
            title="Exit timeline"
            hint={`${exitWithin5} ${exitWithin5 === 1 ? "client exits" : "clients exit"} within 5 years`}
          >
            <div className="space-y-3">
              {exitBuckets.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-meta text-text-secondary">
                    {b.label}
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-sm bg-bg-hover">
                    <div
                      className="h-full rounded-sm bg-green-400"
                      style={{ width: `${(b.count / maxExitBucket) * 100}%` }}
                      aria-hidden
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right font-mono tabular-nums text-meta text-text-primary">
                    {b.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Succession paths">
            {pathEntries.length === 0 ? (
              <p className="text-meta text-text-secondary">
                No transition paths chosen yet.
              </p>
            ) : (
              <div className="space-y-3">
                {pathEntries.map(([path, n]) => (
                  <div key={path} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-meta text-text-secondary">
                      {PATH_LABEL[path] ?? path}
                    </span>
                    <div className="h-6 flex-1 overflow-hidden rounded-sm bg-bg-hover">
                      <div
                        className="h-full rounded-sm bg-green-600"
                        style={{ width: `${(n / maxPath) * 100}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right font-mono tabular-nums text-meta text-text-primary">
                      {n}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Row 4 — needs-attention worklist */}
        <div className="mt-4">
          <Card
            title="Needs attention"
            hint={`${worklist.length} of ${clientCount} ${worklist.length === 1 ? "client" : "clients"}`}
          >
            {worklist.length === 0 ? (
              <p className="text-meta text-text-secondary">
                Every client is in good shape — no open risk, protection, or
                discovery gaps.
              </p>
            ) : (
              <div className="-mx-2">
                {worklist.map((w) => (
                  <Link
                    key={w.id}
                    href={`/app/cases/${w.id}`}
                    className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-bg-hover"
                  >
                    <ClientAvatar
                      businessName={w.business}
                      domain={w.domain}
                      size={26}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-meta font-semibold text-text-primary">
                        {w.name}
                      </p>
                      <p className="truncate text-[12px] text-text-secondary">
                        {w.business}
                      </p>
                    </div>
                    <div className="hidden flex-wrap items-center justify-end gap-1.5 sm:flex">
                      {w.flags.map((f) => (
                        <span
                          key={f.label}
                          className={[
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            f.tone === "danger"
                              ? "bg-danger-bg text-danger-fg"
                              : "bg-warning-bg text-warning-fg",
                          ].join(" ")}
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono tabular-nums text-meta text-text-primary">
                      {formatUSD(w.value)}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-text-tertiary"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/app/cases"
              className="mt-3 inline-flex items-center gap-1.5 text-meta font-medium text-green-600 transition-colors hover:text-green-800"
            >
              View all clients <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[10px] border bg-bg-card px-5 py-5 shadow-card",
        accent ? "border-green-400" : "border-border-subtle",
      ].join(" ")}
    >
      <p className="text-eyebrow uppercase text-text-tertiary">{label}</p>
      <p className="mt-2 font-mono text-stat font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      <p className="mt-1 text-[12px] text-text-secondary">{sub}</p>
    </div>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-border-subtle bg-bg-card px-6 py-5 shadow-card">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-meta font-semibold text-text-primary">{title}</h2>
        {hint ? (
          <span className="text-[12px] text-text-tertiary">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Seg({
  n,
  total,
  color,
}: {
  n: number;
  total: number;
  color: string;
}) {
  if (n === 0) return null;
  return (
    <div style={{ width: `${(n / total) * 100}%`, backgroundColor: color }} />
  );
}

function RiskLegend({
  color,
  label,
  n,
}: {
  color: string;
  label: string;
  n: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="text-[12px] text-text-secondary">{label}</span>
      </div>
      <p className="mt-1 font-mono text-body font-semibold tabular-nums text-text-primary">
        {n}
      </p>
    </div>
  );
}
