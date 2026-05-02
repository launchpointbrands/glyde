import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PathItemRow } from "@/components/dashboard/path-item";
import { SeverityHero } from "@/components/dashboard/severity-hero";
import type { Severity } from "@/components/dashboard/severity-pill";
import { StatCard, StatCardHeading } from "@/components/dashboard/stat-card";
import { buildPathItems } from "@/lib/path";
import { createClient } from "@/lib/supabase/server";

const formatUSD = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
};

const formatUSDFull = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

const capitalize = (s: string | null | undefined) =>
  !s ? "—" : s.charAt(0).toUpperCase() + s.slice(1);

const BUY_SELL_LABEL: Record<string, string> = {
  none: "None",
  in_place: "In place",
  needs_review: "Needs review",
  outdated: "Outdated",
};

const PATH_TITLE: Record<string, string> = {
  family: "Transition to family",
  internal: "Internal transition",
  third_party: "Third-party sale",
  esop: "ESOP",
};

export default async function CaseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = await params;
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

  const pathItems = await buildPathItems(caseId);

  const overallRisk = (risk?.overall_risk ?? null) as Severity | null;
  const factors = (risk?.factors ?? []) as Array<{ severity: Severity }>;
  const highCount = factors.filter((f) => f.severity === "high").length;

  const personalCount = (readiness ?? []).filter((r) => r.category === "personal");
  const businessCount = (readiness ?? []).filter((r) => r.category === "business");
  const personalScore =
    personalCount.length === 0
      ? 0
      : Math.round(
          (personalCount.filter((r) => r.is_complete).length /
            personalCount.length) *
            100,
        );
  const businessScore =
    businessCount.length === 0
      ? 0
      : Math.round(
          (businessCount.filter((r) => r.is_complete).length /
            businessCount.length) *
            100,
        );
  const overallScore =
    personalCount.length + businessCount.length === 0
      ? null
      : Math.round((personalScore + businessScore) / 2);

  const ebitdaGap =
    wealth?.goal_ebitda != null && valuation?.normalized_ebitda != null
      ? wealth.goal_ebitda - valuation.normalized_ebitda
      : null;

  const activeItems = pathItems.filter((i) => i.status !== "done");
  const doneItems = pathItems.filter((i) => i.status === "done");

  const pathLabel = succession?.selected_path
    ? PATH_TITLE[succession.selected_path] ?? "—"
    : "—";

  return (
    <main className="flex flex-1 flex-col px-10 pt-8 pb-16">
      <div className="mx-auto w-full max-w-[1120px]">
        <OverviewBanner
          low={valuation?.valuation_low ?? null}
          high={valuation?.valuation_high ?? null}
          estimate={valuation?.valuation_estimate ?? null}
          overallScore={overallScore}
          overallRisk={overallRisk}
          ebitdaGap={ebitdaGap}
        />

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* LEFT — Advisor path */}
          <div>
            <h2 className="text-section font-semibold text-text-primary">
              Advisor path
            </h2>
            <p className="mt-2 max-w-xl text-meta text-text-secondary">
              The conversations to have, in priority order. Click the
              indicator to mark progress.
            </p>

            {pathItems.length === 0 ? (
              <div className="mt-6 rounded-[10px] border border-dashed border-border-default bg-bg-card px-6 py-10 text-center">
                <p className="text-body text-text-secondary">
                  No path items yet — complete discovery to see suggested
                  actions.
                </p>
                <Link
                  href={`/app/cases/${caseId}/discovery`}
                  className="mt-3 inline-flex items-center gap-1.5 text-meta font-medium text-green-600 transition-colors hover:text-green-800"
                >
                  Go to discovery <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-border-subtle rounded-[10px] border border-border-subtle bg-bg-card px-5 shadow-card">
                {activeItems.map((item) => (
                  <PathItemRow key={item.key} caseId={caseId} item={item} />
                ))}
                {doneItems.length > 0 && (
                  <>
                    <li className="pt-5 pb-2">
                      <p className="text-eyebrow uppercase text-text-tertiary">
                        Done
                      </p>
                    </li>
                    {doneItems.map((item) => (
                      <PathItemRow key={item.key} caseId={caseId} item={item} />
                    ))}
                  </>
                )}
              </ul>
            )}
          </div>

          {/* RIGHT — module summary cards */}
          <div className="space-y-4">
            <ModuleCard
              title="Valuation"
              href={`/app/cases/${caseId}/valuation`}
              hero={
                valuation ? (
                  <span className="font-mono text-stat font-light tabular-nums text-text-primary">
                    {formatUSD(valuation.valuation_low)} –{" "}
                    {formatUSD(valuation.valuation_high)}
                  </span>
                ) : (
                  <span className="text-text-tertiary">No data yet</span>
                )
              }
              rows={
                valuation
                  ? [
                      {
                        k: "Current estimate",
                        v: formatUSDFull(valuation.valuation_estimate),
                      },
                      {
                        k: "EBITDA multiple",
                        v: valuation.ebitda_multiple
                          ? `${valuation.ebitda_multiple.toFixed(2)}x`
                          : "—",
                      },
                      {
                        k: "Revenue multiple",
                        v: valuation.revenue_multiple
                          ? `${valuation.revenue_multiple.toFixed(2)}x`
                          : "—",
                      },
                    ]
                  : []
              }
            />

            <ModuleCard
              title="Risk"
              href={`/app/cases/${caseId}/risk`}
              hero={
                overallRisk ? (
                  <SeverityHero severity={overallRisk} size="md" />
                ) : (
                  <span className="text-text-tertiary">No data yet</span>
                )
              }
              rows={
                risk
                  ? [
                      { k: "High-severity factors", v: String(highCount) },
                      {
                        k: "Buy-sell status",
                        v: BUY_SELL_LABEL[risk.buy_sell_status] ?? "—",
                      },
                    ]
                  : []
              }
            />

            <ModuleCard
              title="Succession"
              href={`/app/cases/${caseId}/succession`}
              hero={
                overallScore != null ? (
                  <span className="font-mono text-stat font-light tabular-nums text-text-primary">
                    {overallScore}
                    <span className="ml-1.5 text-meta font-normal text-text-tertiary">
                      / 100
                    </span>
                  </span>
                ) : (
                  <span className="text-text-tertiary">No data yet</span>
                )
              }
              rows={
                readiness && readiness.length > 0
                  ? [
                      { k: "Personal", v: `${personalScore} / 100` },
                      { k: "Business", v: `${businessScore} / 100` },
                      { k: "Path", v: pathLabel },
                    ]
                  : []
              }
            />

            <ModuleCard
              title="Wealth"
              href={`/app/cases/${caseId}/wealth`}
              hero={
                wealth ? (
                  <span className="font-mono text-stat font-light tabular-nums text-text-primary">
                    {formatUSD(wealth.goal_valuation)}
                  </span>
                ) : (
                  <span className="text-text-tertiary">No data yet</span>
                )
              }
              rows={
                wealth
                  ? [
                      {
                        k: "Current EBITDA",
                        v: formatUSDFull(valuation?.normalized_ebitda),
                      },
                      {
                        k: "Goal EBITDA",
                        v: formatUSDFull(wealth.goal_ebitda),
                      },
                      {
                        k: "Equity risk",
                        v: capitalize(wealth.current_risk),
                      },
                    ]
                  : []
              }
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function OverviewBanner({
  low,
  high,
  estimate,
  overallScore,
  overallRisk,
  ebitdaGap,
}: {
  low: number | null;
  high: number | null;
  estimate: number | null;
  overallScore: number | null;
  overallRisk: Severity | null;
  ebitdaGap: number | null;
}) {
  const hasRange = low != null && high != null;

  const riskTone =
    overallRisk === "high"
      ? "text-danger-fg"
      : overallRisk === "moderate"
        ? "text-warning-fg"
        : "";
  const ebitdaTone =
    ebitdaGap != null && ebitdaGap > 500_000 ? "text-warning-fg" : "";

  return (
    <div className="flex flex-col items-stretch gap-8 rounded-[10px] border border-border-subtle bg-bg-card px-8 py-7 shadow-card md:flex-row md:items-center md:justify-between">
      {/* Left — valuation */}
      <div className="min-w-0">
        <p className="whitespace-nowrap text-[36px] font-light leading-none tracking-tight text-text-primary">
          {hasRange ? `${formatUSD(low)} – ${formatUSD(high)}` : "—"}
        </p>
        <p className="mt-3 text-eyebrow uppercase text-text-tertiary">
          Business valuation range
        </p>
        {estimate != null && (
          <p className="mt-3 text-meta text-text-secondary">
            Current estimate{" "}
            <span className="font-mono tabular-nums text-text-primary">
              {formatUSDFull(estimate)}
            </span>
          </p>
        )}
      </div>

      {/* Right — three inline stats with vertical dividers between them */}
      <div className="flex shrink-0 items-stretch gap-6 md:ml-auto">
        <InlineStat
          label="Overall readiness"
          value={
            overallScore != null ? (
              <>
                <span className="font-mono tabular-nums">{overallScore}</span>
                <span className="ml-1 text-meta font-normal text-text-tertiary">
                  / 100
                </span>
              </>
            ) : (
              "—"
            )
          }
        />
        <InlineStat
          label="Business risk"
          divider
          value={
            <span className={riskTone}>
              {overallRisk ? capitalize(overallRisk) : "—"}
            </span>
          }
        />
        <InlineStat
          label="EBITDA gap"
          divider
          value={
            <span className={`font-mono tabular-nums ${ebitdaTone}`}>
              {ebitdaGap != null ? formatUSD(ebitdaGap) : "—"}
            </span>
          }
        />
      </div>
    </div>
  );
}

function InlineStat({
  label,
  value,
  divider,
}: {
  label: string;
  value: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col justify-center",
        divider ? "border-l border-border-subtle pl-6" : "",
      ].join(" ")}
    >
      <p className="text-eyebrow uppercase text-text-tertiary">{label}</p>
      <p className="mt-2 text-section font-medium leading-none text-text-primary">
        {value}
      </p>
    </div>
  );
}

function ModuleCard({
  title,
  href,
  hero,
  rows,
}: {
  title: string;
  href: string;
  hero: React.ReactNode;
  rows: { k: string; v: string }[];
}) {
  return (
    <StatCard className="px-5 py-5">
      <StatCardHeading>{title}</StatCardHeading>
      <div className="mt-4">{hero}</div>
      {rows.length > 0 && (
        <div className="mt-5 space-y-1">
          {rows.map((r) => (
            <div
              key={r.k}
              className="flex items-baseline justify-between gap-3 border-t border-border-subtle py-2 first:border-t-0 first:pt-0 text-meta"
            >
              <span className="text-text-secondary">{r.k}</span>
              <span className="font-mono tabular-nums text-text-primary">
                {r.v}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 border-t border-border-subtle pt-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-meta font-medium text-green-400 transition-colors hover:text-green-600"
        >
          View report <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </StatCard>
  );
}
