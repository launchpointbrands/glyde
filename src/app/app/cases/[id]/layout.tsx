import { MoreHorizontal } from "lucide-react";
import { notFound } from "next/navigation";
import { NavLink } from "@/components/nav-link";
import { getCaseStats } from "@/lib/case-stats";
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

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: caseRow }, stats] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, status, client_business:client_businesses(business_name, primary_owner_name, domain)",
      )
      .eq("id", id)
      .single(),
    getCaseStats(id),
  ]);

  if (!caseRow) notFound();

  const cb = Array.isArray(caseRow.client_business)
    ? caseRow.client_business[0]
    : caseRow.client_business;

  const { valuation, risk, overallScore, ebitdaGap } = stats;
  const overallRisk = risk?.overall_risk ?? null;
  const riskTone =
    overallRisk === "high"
      ? "text-danger-fg"
      : overallRisk === "moderate"
        ? "text-warning-fg"
        : "text-text-primary";
  const ebitdaTone =
    ebitdaGap != null && ebitdaGap > 500_000
      ? "text-warning-fg"
      : "text-text-primary";
  const valuationRange =
    valuation?.valuation_low != null && valuation?.valuation_high != null
      ? `${formatUSD(valuation.valuation_low)} – ${formatUSD(valuation.valuation_high)}`
      : "—";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border-subtle bg-bg-card px-10 pt-8 pb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 space-y-1.5">
            {cb?.primary_owner_name && (
              <p className="text-eyebrow uppercase text-text-tertiary">
                {cb.primary_owner_name}
              </p>
            )}
            <h1 className="text-stat font-semibold text-text-primary">
              {cb?.business_name ?? "Unnamed business"}
            </h1>
            {cb?.domain && (
              <p className="text-meta text-text-secondary">{cb.domain}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              aria-label="More actions"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-bg-page px-10 py-4">
        <div className="grid grid-cols-4 gap-3">
          <StatCardA
            label="Valuation range"
            value={
              <span className="font-mono tabular-nums text-text-primary">
                {valuationRange}
              </span>
            }
            secondary={
              valuation?.valuation_estimate != null
                ? `Current estimate ${formatUSDFull(valuation.valuation_estimate)}`
                : undefined
            }
          />
          <StatCardA
            label="Overall readiness"
            value={
              overallScore != null ? (
                <span className="text-text-primary">
                  <span className="font-mono tabular-nums">{overallScore}</span>
                  <span className="ml-1.5 text-meta font-normal text-text-tertiary">
                    / 100
                  </span>
                </span>
              ) : (
                <span className="text-text-tertiary">—</span>
              )
            }
          />
          <StatCardA
            label="Business risk"
            value={
              <span className={riskTone}>
                {overallRisk ? capitalize(overallRisk) : "—"}
              </span>
            }
          />
          <StatCardA
            label="EBITDA gap"
            value={
              <span className={`font-mono tabular-nums ${ebitdaTone}`}>
                {ebitdaGap != null ? formatUSD(ebitdaGap) : "—"}
              </span>
            }
          />
        </div>
      </div>

      <nav className="flex items-center gap-9 border-b border-border-subtle bg-bg-card px-10">
        <NavLink href={`/app/cases/${id}`}>Overview</NavLink>
        <NavLink href={`/app/cases/${id}/valuation`}>Valuation</NavLink>
        <NavLink href={`/app/cases/${id}/risk`}>Risk</NavLink>
        <NavLink href={`/app/cases/${id}/wealth`}>Wealth</NavLink>
        <NavLink href={`/app/cases/${id}/succession`}>Succession</NavLink>
      </nav>

      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function StatCardA({
  label,
  value,
  secondary,
}: {
  label: string;
  value: React.ReactNode;
  secondary?: string;
}) {
  return (
    <div className="flex min-h-[120px] flex-col rounded-[10px] border border-border-subtle bg-bg-card px-6 py-5 shadow-card">
      <p className="mb-3 text-eyebrow uppercase text-text-tertiary">{label}</p>
      <p className="text-stat font-medium leading-none">{value}</p>
      {secondary && (
        <p className="mt-2 font-mono tabular-nums text-meta text-text-secondary">
          {secondary}
        </p>
      )}
    </div>
  );
}
