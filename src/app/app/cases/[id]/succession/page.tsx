import {
  Compass,
  Eye,
  Megaphone,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Donut } from "@/components/dashboard/donut";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { FooterActions } from "@/components/dashboard/footer-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  ReadinessChecklist,
  type ReadinessItem,
} from "@/components/dashboard/readiness-checklist";
import { StatCard, StatCardHeading } from "@/components/dashboard/stat-card";
import { ensureFinancials } from "@/lib/financials";
import { createClient } from "@/lib/supabase/server";

const formatUSD = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}m`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
};

const PATH_TITLE: Record<string, string> = {
  family: "Transition to Family",
  internal: "Internal Transition",
  third_party: "Third-Party Sale",
  esop: "ESOP",
};

const ROADMAP = [
  {
    icon: Eye,
    title: "Clarify your vision",
    body: "Reflect on what a successful transition means to you and make a plan for life after exit.",
  },
  {
    icon: Wrench,
    title: "Prepare yourself and the business",
    body: "Work with your advisor and team of professionals to prepare yourself and your business for the transition.",
  },
  {
    icon: Compass,
    title: "Identify and plan the exit structure",
    body: "Engage your team of professionals well in advance of deal formulation so they can align and optimize your exit structure and personal plan.",
  },
  {
    icon: Megaphone,
    title: "Communicate and execute",
    body: "Align all stakeholders and work with your team of professionals to implement the structure and business transition plan.",
  },
  {
    icon: Sparkles,
    title: "Start the next chapter",
    body: "An exciting new life chapter begins after transitioning from your business!",
  },
];

export default async function SuccessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = await params;

  try {
    await ensureFinancials({ caseId });
  } catch (e) {
    console.error("ensureFinancials (succession) failed", e);
  }

  const supabase = await createClient();

  const [
    { data: plan },
    { data: items },
    { data: ref },
    { data: wealthPlan },
    { data: valuation },
  ] = await Promise.all([
    supabase
      .from("succession_plans")
      .select("selected_path, priorities")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("readiness_items")
      .select("item_key, category, is_complete")
      .eq("case_id", caseId),
    supabase
      .from("readiness_item_reference")
      .select("key, category, label, display_order")
      .order("display_order"),
    supabase
      .from("wealth_plans")
      .select("net_proceeds_target, goal_valuation")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("valuation_snapshots")
      .select("valuation_estimate")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!plan) {
    return <DashboardEmptyState caseId={caseId} reportName="succession" />;
  }

  const itemByKey = new Map(
    (items ?? []).map((it) => [it.item_key as string, it]),
  );

  const personalItems: ReadinessItem[] = [];
  const businessItems: ReadinessItem[] = [];
  for (const r of ref ?? []) {
    const it = itemByKey.get(r.key as string);
    const enriched: ReadinessItem = {
      item_key: r.key as string,
      label: r.label as string,
      is_complete: Boolean(it?.is_complete),
    };
    if (r.category === "personal") personalItems.push(enriched);
    else businessItems.push(enriched);
  }

  const score = (xs: ReadinessItem[]) =>
    xs.length === 0
      ? 0
      : Math.round((xs.filter((x) => x.is_complete).length / xs.length) * 100);
  const personalScore = score(personalItems);
  const businessScore = score(businessItems);
  const overallScore = Math.round((personalScore + businessScore) / 2);

  const path = plan.selected_path ?? "family";
  const pathTitle = PATH_TITLE[path] ?? "Transition";
  const priorities = (plan.priorities ?? []) as string[];

  const currentValuation = valuation?.valuation_estimate ?? 0;
  const goalValuation = wealthPlan?.goal_valuation ?? 0;
  const netProceeds = wealthPlan?.net_proceeds_target ?? 0;
  const maxBar = Math.max(currentValuation, goalValuation, netProceeds, 1);

  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-12 md:px-10 md:pt-10 md:pb-16">
      <div className="mx-auto w-full max-w-[1100px]">
        <PageHeader title={`Succession Plan: ${pathTitle}`} />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT — narrative */}
          <div className="space-y-10 rounded-[10px] border border-border-subtle bg-bg-card px-7 py-6 shadow-card">
            <section>
              <h2 className="text-section font-medium text-text-primary">
                Your priorities
              </h2>
              <p className="mt-3 text-body text-text-secondary">
                Clarity on what&apos;s most important to you during a future
                exit will guide the development of your transition plans and
                align them to your priorities.
              </p>
              <p className="mt-5 text-meta font-medium text-text-primary">
                What&apos;s important to you during an exit
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body text-text-secondary">
                {priorities.map((p) => (
                  <li key={p}>{humanizePriority(p)}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-section font-medium text-text-primary">
                Transitioning the business to family
              </h2>
              <p className="mt-3 text-body text-text-secondary">
                Transitioning to family prioritizes legacy, continuity, and
                relationships. This is one of the most meaningful ways to
                preserve your business&apos;s values, identity, and long-term
                impact.
              </p>
              <p className="mt-5 text-meta font-medium text-text-primary">
                Elements to a successful transition
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body text-text-secondary">
                <li>Identifying the right successor(s)</li>
                <li>Preserving harmony by aligning family and business</li>
                <li>Navigating ownership, compensation, and governance</li>
              </ul>
              <p className="mt-5 text-meta font-medium text-text-primary">
                Key questions to consider
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body text-text-secondary">
                <li>How will this impact family relationships?</li>
                <li>Are your successors prepared for leadership?</li>
                <li>How do you envision your role after the transition?</li>
                <li>What is your plan for income and lifestyle post-exit?</li>
              </ul>
            </section>

            <section>
              <h2 className="text-section font-medium text-text-primary">
                It takes a village
              </h2>
              <p className="mt-3 text-body text-text-secondary">
                Planning a transition can be overwhelming, but you don&apos;t
                need to manage it yourself. Your village will include a mix
                of advisors, accountants, lawyers, bankers, and consultants.
              </p>
              <p className="mt-5 text-meta font-medium text-text-primary">
                Where a team of professionals will help
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body text-text-secondary">
                <li>
                  Planning for life after the business personally and
                  financially
                </li>
                <li>Aligning exit with your personal and financial goals</li>
                <li>Identifying tax strategies before a deal is formulated</li>
                <li>
                  Exploring gifting, trusts, and phased exits strategies
                </li>
              </ul>
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
              <StatCardHeading>Your Roadmap</StatCardHeading>
              <ol className="mt-5 space-y-5">
                {ROADMAP.map((step) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title}>
                      <div className="flex items-center gap-2 text-text-primary">
                        <Icon className="h-5 w-5" />
                        <p className="text-meta font-medium">{step.title}</p>
                      </div>
                      <p className="mt-1.5 ml-7 text-meta text-text-secondary">
                        {step.body}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </StatCard>
          </div>
        </div>

        {/* Page 2 — readiness scoring */}
        <div className="mt-16">
          <PageHeader title="Succession & Exit Readiness Score" />

          <div className="rounded-[10px] border border-border-subtle bg-bg-card px-7 py-6 shadow-card">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr_1fr]">
            <div className="flex flex-col items-center">
              <p className="text-section font-medium text-text-primary">
                Overall readiness
              </p>
              <div className="mt-4">
                <Donut value={overallScore} label="out of 100" size={180} stroke={14} />
              </div>
            </div>
            <div className="flex items-center gap-5">
              <Donut value={personalScore} label="out of 100" size={120} stroke={10} />
              <div>
                <p className="text-body font-medium text-text-primary">
                  Personal readiness
                </p>
                <p className="mt-1 text-meta text-text-secondary">
                  You&apos;re taking meaningful action towards being
                  emotionally and financially prepared for an exit. Maintain
                  momentum on the key actions that will solidify your
                  long-term plan.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <Donut value={businessScore} label="out of 100" size={120} stroke={10} />
              <div>
                <p className="text-body font-medium text-text-primary">
                  Business readiness
                </p>
                <p className="mt-1 text-meta text-text-secondary">
                  There&apos;s a fair amount of work to be done to prepare
                  your business for exit. Continue taking steps to strengthen
                  the stability and marketability of your business.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h3 className="text-section font-medium text-text-primary">
                Personal readiness
              </h3>
              <p className="mt-1 text-meta font-medium text-text-primary">
                Next best actions
              </p>
              <div className="mt-3">
                <ReadinessChecklist caseId={caseId} items={personalItems} />
              </div>
            </div>
            <div>
              <h3 className="text-section font-medium text-text-primary">
                Business readiness
              </h3>
              <p className="mt-1 text-meta font-medium text-text-primary">
                Next best actions
              </p>
              <div className="mt-3">
                <ReadinessChecklist caseId={caseId} items={businessItems} />
              </div>
            </div>
          </div>
          </div>
        </div>

        <FooterActions />
      </div>
    </main>
  );
}

function humanizePriority(key: string): string {
  const KNOWN: Record<string, string> = {
    maintain_family_ownership:
      "Maintain control over the timing and terms of the exit",
    preserve_operating_culture:
      "Preserve the business mission, values, and culture",
    optimize_tax_for_transition: "Maximize the financial value of the exit",
  };
  return (
    KNOWN[key] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
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
