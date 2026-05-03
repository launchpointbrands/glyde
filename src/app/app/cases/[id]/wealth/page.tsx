import { FooterActions } from "@/components/dashboard/footer-actions";
import { GeneratingReport } from "@/components/dashboard/generating-report";
import { PageHeader } from "@/components/dashboard/page-header";
import { SeverityHero } from "@/components/dashboard/severity-hero";
import type { Severity } from "@/components/dashboard/severity-pill";
import { StatCard, StatCardHeading } from "@/components/dashboard/stat-card";
import { ensureFinancials } from "@/lib/financials";
import { createClient } from "@/lib/supabase/server";

const formatUSD = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};
const formatUSDFull = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString()}`;
const formatPct = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n * 100)}%`;

export default async function WealthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = await params;

  try {
    await ensureFinancials({ caseId });
  } catch (e) {
    console.error("ensureFinancials (wealth) failed", e);
  }

  const supabase = await createClient();

  const [{ data: plan }, { data: valuation }] = await Promise.all([
    supabase
      .from("wealth_plans")
      .select(
        "net_proceeds_target, exit_year, target_age, goal_valuation, goal_ebitda, historic_avg_revenue_growth, goal_revenue_growth, current_risk, goal_risk, historic_ebitda_series",
      )
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("valuation_snapshots")
      .select("valuation_estimate, normalized_ebitda")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!plan) {
    return <GeneratingReport title="Business Wealth Blueprint" />;
  }

  const currentValuation = valuation?.valuation_estimate ?? 0;
  const goalValuation = plan.goal_valuation ?? 0;
  const netProceeds = plan.net_proceeds_target ?? 0;
  const maxBar = Math.max(currentValuation, goalValuation, netProceeds, 1);

  const historicSeries = (plan.historic_ebitda_series ?? []) as Array<{
    year: number;
    value: number;
  }>;
  const goalEbitda = plan.goal_ebitda ?? 0;
  const ebitdaMax = Math.max(...historicSeries.map((s) => s.value), goalEbitda, 1);
  const normalizedEbitda = valuation?.normalized_ebitda ?? null;
  const yearsToExit = plan.exit_year
    ? plan.exit_year - new Date().getFullYear()
    : null;

  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-12 md:px-10 md:pt-10 md:pb-16">
      <div className="mx-auto w-full max-w-[1100px]">
        <PageHeader title="Business Wealth Blueprint" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT — narrative */}
          <div className="space-y-10 rounded-[10px] border border-border-subtle bg-bg-card px-7 py-6 shadow-card">
            <section>
              <h2 className="text-section font-medium text-text-primary">
                Wealth goals
              </h2>
              <p className="mt-3 text-body text-text-secondary">
                Knowing how your business fits into your long-term financial
                plan starts with knowing what it needs to be worth and how to
                get there.
              </p>
              <p className="mt-5 text-meta font-medium text-text-primary">
                How potential business liquidity fits into your long-term
                plans
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-text-secondary">
                <li>
                  <strong className="text-text-primary">
                    You need {formatUSD(netProceeds)} in net proceeds
                  </strong>{" "}
                  to fund your goals
                </li>
                <li>
                  <strong className="text-text-primary">
                    You want to exit in {yearsToExit ?? "—"} years
                  </strong>{" "}
                  at age {plan.target_age ?? "—"}
                </li>
                <li>
                  <strong className="text-text-primary">
                    The business needs to be worth {formatUSD(goalValuation)}
                  </strong>{" "}
                  by {plan.exit_year ?? "—"}
                </li>
                <li>
                  <strong className="text-text-primary">
                    Business EBITDA needs to be {formatUSD(goalEbitda)}
                  </strong>{" "}
                  to reach that valuation
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-section font-medium text-text-primary">
                Business performance goals
              </h2>
              <p className="mt-4 text-meta font-medium text-text-primary">
                EBITDA: Historic v. Goal
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-meta text-text-secondary">
                <LegendDot color="bg-green-200" label="Historic" />
                <LegendDot color="bg-green-400" label="Goal" />
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-px w-6 border-t border-dashed border-text-secondary" />
                  Normalized EBITDA: {formatUSD(normalizedEbitda)}
                </span>
              </div>
              <div className="mt-6">
                <EbitdaChart
                  series={historicSeries}
                  goalYear={plan.exit_year ?? null}
                  goalValue={goalEbitda}
                  max={ebitdaMax}
                  normalized={normalizedEbitda}
                />
              </div>
            </section>

            <section>
              <h2 className="text-section font-medium text-text-primary">
                Equity risks &amp; Exit readiness
              </h2>
              <p className="mt-3 max-w-xl text-body text-text-secondary">
                Work with your advisor to ensure the wealth in your business
                is protected and you have a plan to exit when the time is
                right.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-meta text-text-secondary">
                    Equity risk
                  </p>
                  <div className="mt-2">
                    <SeverityHero
                      severity={(plan.current_risk ?? "moderate") as Severity}
                      size="sm"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-meta text-text-secondary">
                    Exit readiness
                  </p>
                  <p className="mt-2 inline-flex items-baseline gap-2 text-display font-light leading-none text-text-primary tabular-nums font-mono">
                    46
                    <span className="text-meta font-normal text-text-secondary">
                      out of 100
                    </span>
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT — stat cards */}
          <div className="space-y-5">
            <StatCard>
              <StatCardHeading>Liquidity goals</StatCardHeading>
              <div className="mt-5 space-y-4">
                <LiquidityBar
                  label="Current business valuation (est.)"
                  value={currentValuation}
                  pct={(currentValuation / maxBar) * 100}
                />
                <LiquidityBar
                  label="Goal business valuation"
                  value={goalValuation}
                  pct={(goalValuation / maxBar) * 100}
                />
                <LiquidityBar
                  label="Net proceeds needed to fund goals"
                  value={netProceeds}
                  pct={(netProceeds / maxBar) * 100}
                />
              </div>
            </StatCard>

            <StatCard>
              <StatCardHeading>Business KPIs</StatCardHeading>

              <div className="mt-5 space-y-1.5">
                <p className="text-meta font-medium text-text-primary">
                  Earnings (EBITDA)
                </p>
                <KpiPair
                  leftLabel="2024"
                  leftValue={formatUSDFull(normalizedEbitda)}
                />
                <KpiPair
                  leftLabel="Goal"
                  leftValue={formatUSDFull(goalEbitda)}
                />
              </div>

              <div className="mt-5 space-y-1.5">
                <p className="text-meta font-medium text-text-primary">
                  Annual revenue growth
                </p>
                <KpiPair
                  leftLabel="Historic Average"
                  leftValue={formatPct(plan.historic_avg_revenue_growth)}
                />
                <KpiPair
                  leftLabel="Goal"
                  leftValue={formatPct(plan.goal_revenue_growth)}
                />
              </div>

              <div className="mt-5 space-y-1.5">
                <p className="text-meta font-medium text-text-primary">
                  Business risk score
                </p>
                <KpiPair
                  leftLabel="Current"
                  leftValue={capitalize(plan.current_risk ?? "—")}
                />
                <KpiPair
                  leftLabel="Goal"
                  leftValue={capitalize(plan.goal_risk ?? "—")}
                />
              </div>
            </StatCard>
          </div>
        </div>

        <FooterActions />
      </div>
    </main>
  );
}

function capitalize(s: string): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function LiquidityBar({
  label,
  value,
  pct,
}: {
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <div>
      <p className="text-meta text-text-secondary">{label}</p>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="h-7 flex-1 rounded-sm bg-bg-hover">
          <div
            className="h-full rounded-sm bg-green-400"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            aria-hidden
          />
        </div>
        <span className="shrink-0 text-meta font-medium tabular-nums font-mono text-text-primary">
          {formatUSD(value)}
        </span>
      </div>
    </div>
  );
}

function KpiPair({
  leftLabel,
  leftValue,
}: {
  leftLabel: string;
  leftValue: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-meta">
      <span className="font-medium text-text-primary">{leftLabel}</span>
      <span className="tabular-nums font-mono text-text-primary">{leftValue}</span>
    </div>
  );
}

function EbitdaChart({
  series,
  goalYear,
  goalValue,
  max,
  normalized,
}: {
  series: { year: number; value: number }[];
  goalYear: number | null;
  goalValue: number;
  max: number;
  normalized: number | null;
}) {
  const chartHeight = 220;
  const bars = [
    ...series.map((s) => ({ year: s.year, value: s.value, isGoal: false })),
  ];
  if (goalYear) bars.push({ year: goalYear, value: goalValue, isGoal: true });

  const normalizedY =
    normalized != null ? chartHeight - (normalized / max) * chartHeight : null;

  return (
    <div>
      <div className="relative" style={{ height: chartHeight }}>
        {normalizedY != null && (
          <div
            className="absolute right-0 left-0 border-t border-dashed border-text-tertiary"
            style={{ top: normalizedY }}
            aria-hidden
          />
        )}
        <div className="flex h-full items-end gap-3">
          {bars.map((b, i) => {
            const showGap =
              i === series.length &&
              i > 0 &&
              goalYear &&
              goalYear > series[i - 1].year + 1;
            return (
              <div
                key={`${b.year}-${b.isGoal}`}
                className="flex flex-1 items-end gap-3"
              >
                {showGap && (
                  <div className="flex h-full flex-1 items-end justify-center">
                    <span className="pb-2 text-text-secondary">…</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col items-center justify-end">
                  <span className="mb-1 text-meta tabular-nums font-mono text-text-primary">
                    {formatUSD(b.value)}
                  </span>
                  <div
                    className={`w-full rounded-t-sm ${
                      b.isGoal ? "bg-green-400" : "bg-green-200"
                    }`}
                    style={{
                      height: `${(b.value / max) * (chartHeight - 30)}px`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-3 text-meta tabular-nums font-mono text-text-secondary">
        {bars.map((b, i) => {
          const showGap =
            i === series.length &&
            i > 0 &&
            goalYear &&
            goalYear > series[i - 1].year + 1;
          return (
            <div key={`${b.year}-label`} className="flex flex-1 gap-3">
              {showGap && <div className="flex-1" />}
              <div className="flex-1 text-center">
                {b.isGoal ? `Goal by ${b.year}` : b.year}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
