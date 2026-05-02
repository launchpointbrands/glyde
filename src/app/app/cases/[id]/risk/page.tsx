import { Building2, ScrollText, Users } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { FooterActions } from "@/components/dashboard/footer-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  RiskClient,
  type RiskFactor,
} from "@/components/dashboard/risk-client";
import { SeverityHero } from "@/components/dashboard/severity-hero";
import { StatCard, StatCardHeading } from "@/components/dashboard/stat-card";
import type { Severity } from "@/components/dashboard/severity-pill";
import { createClient } from "@/lib/supabase/server";

const formatUSDFull = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

const BUY_SELL_LABEL: Record<string, string> = {
  none: "None",
  in_place: "In place",
  needs_review: "Needs review",
  outdated: "Outdated",
};

// Buy-sell status maps to a severity tone for the bar treatment.
const BUY_SELL_SEVERITY: Record<string, Severity> = {
  none: "high",
  needs_review: "moderate",
  outdated: "moderate",
  in_place: "low",
};

export default async function RiskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = await params;
  const supabase = await createClient();

  const { data: assessment } = await supabase
    .from("risk_assessments")
    .select(
      "overall_risk, factors, buy_sell_status, equity_at_risk_value, risk_to_equity, valuation_snapshot_id",
    )
    .eq("case_id", caseId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assessment) {
    return <DashboardEmptyState caseId={caseId} reportName="risk" />;
  }

  const factors = (assessment.factors ?? []) as RiskFactor[];
  const buySellStatus = (assessment.buy_sell_status ?? "none") as string;
  const buySellSeverity =
    BUY_SELL_SEVERITY[buySellStatus] ?? ("moderate" as Severity);

  return (
    <main className="flex flex-1 flex-col px-10 pt-10 pb-16">
      <div className="mx-auto w-full max-w-[1100px]">
        <PageHeader
          title="Business Risk Assessment"
          subtitle="A review of the risk factors that impact the marketability and valuation of your business."
        />

        <RiskClient initialFactors={factors} />

        {/* Buy-sell page section */}
        <PageHeader
          title="Protecting the value of your equity"
          subtitle="An updated buy-sell arrangement protects the value of the equity you own in the event of death, disability, or dispute."
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT — narrative */}
          <div className="space-y-8">
            <section>
              <h3 className="text-section font-medium text-text-primary">
                Why it matters to you
              </h3>
              <p className="mt-3 text-body text-text-secondary">
                You have worked hard to make your business what it is today.
                An updated buy-sell arrangement protects the value of the
                equity you own in the event of death, disability, or dispute.
              </p>
              <p className="mt-5 text-meta font-medium text-text-primary">
                Benefits to you, your family, and your business
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body text-text-secondary">
                <li>Protects the value you have built</li>
                <li>Protects the longevity and continuity of the business</li>
                <li>May open opportunities to optimize estate tax</li>
              </ul>
            </section>

            <section>
              <h3 className="text-section font-medium text-text-primary">
                How it works
              </h3>
              <p className="mt-3 text-body text-text-secondary">
                Buy-sell arrangements consist of the following two
                components.
              </p>
              <p className="mt-5 text-meta font-medium text-text-primary">
                1. A legal agreement
              </p>
              <p className="mt-1 text-body text-text-secondary">
                A legally binding contract among business owners is required
                to govern how equity is valued and what happens to your
                equity in the event of death, disability, retirement, or
                voluntary exit.
              </p>
              <p className="mt-4 text-meta font-medium text-text-primary">
                2. A funding mechanism or insurance policy
              </p>
              <p className="mt-1 text-body text-text-secondary">
                In order to be viable when triggered, buy-sell agreements
                must be backed by funding. Common vehicles include life
                insurance, disability insurance, or cash reserves.
              </p>
            </section>

            <section>
              <h3 className="text-section font-medium text-text-primary">
                Work with your advisor
              </h3>
              <p className="mt-3 text-body text-text-secondary">
                Work with your financial advisor to review the status of
                your buy-sell agreement.
              </p>
              <p className="mt-5 text-meta font-medium text-text-primary">
                Maintaining an up-to-date buy-sell arrangement
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body text-text-secondary">
                <li>Agreement and insurance should be reviewed annually.</li>
                <li>
                  Valuation methodology is clearly listed in the agreement,
                  typically via an attached Schedule A.
                </li>
                <li>
                  Funding levels reflect recent business valuation estimates.
                </li>
                <li>Insurance policies cover unforeseen events.</li>
              </ul>
            </section>
          </div>

          {/* RIGHT — stat cards */}
          <div className="space-y-5">
            <StatCard>
              <p className="text-meta text-text-secondary">
                Value of equity owned
              </p>
              <p className="mt-3 text-display font-light leading-none text-text-primary tabular-nums font-mono">
                {formatUSDFull(assessment.equity_at_risk_value)}
              </p>
            </StatCard>

            <StatCard>
              <p className="text-meta text-text-secondary">
                Risk to equity owned
              </p>
              <div className="mt-3">
                <SeverityHero
                  severity={(assessment.risk_to_equity ?? "moderate") as Severity}
                  size="md"
                />
              </div>
            </StatCard>

            <StatCard>
              <p className="text-meta text-text-secondary">
                Status of buy-sell arrangement
              </p>
              <div className="mt-3">
                <SeverityHero
                  severity={buySellSeverity}
                  label={BUY_SELL_LABEL[buySellStatus] ?? "—"}
                  size="md"
                />
              </div>
            </StatCard>

            <StatCard>
              <StatCardHeading>Example buy-sell structures</StatCardHeading>
              <div className="mt-5 space-y-5">
                <BuySellStructure
                  icon={<Users className="h-5 w-5" />}
                  title="Cross-purchase plans"
                  body="Each owner purchases an insurance policy on the other owner(s) to fund the buy-sell arrangement."
                />
                <BuySellStructure
                  icon={<Building2 className="h-5 w-5" />}
                  title="Entity redemption plans"
                  body="Business buys separate insurance contracts on the owners, pays the premiums, and is the beneficiary."
                />
                <BuySellStructure
                  icon={<ScrollText className="h-5 w-5" />}
                  title="Special purpose entities"
                  body="In some cases, a new entity may be created to buy separate insurance contracts on the owners, pay the premiums, and act as the beneficiary."
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

function BuySellStructure({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-text-primary">
        {icon}
        <p className="text-meta font-medium">{title}</p>
      </div>
      <p className="mt-1.5 text-meta text-text-secondary">{body}</p>
    </div>
  );
}
