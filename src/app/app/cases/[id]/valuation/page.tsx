import { TriangleAlert } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { FooterActions } from "@/components/dashboard/footer-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { createClient } from "@/lib/supabase/server";

const formatUSD = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const formatUSDFull = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

const capitalize = (s: string | null | undefined) =>
  !s ? "—" : s.charAt(0).toUpperCase() + s.slice(1);

// Demo financial fixture matching the Peter Smith / Precision Auto sample
// in the RISR teardown. Used for the appendix tables until we have a real
// financials-upload pipeline. Only shown when the case is the demo seed.
const DEMO_PL = [
  { label: "Revenue", y2024: 5796069, y2023: 4991881, y2022: 4310801 },
  { label: "Cost of goods sold", y2024: 2740936, y2023: 2376306, y2022: 2069369 },
  { label: "Operating expenses", y2024: 1194259, y2023: 900899, y2022: 650545 },
  { label: "Non-operating expenses", y2024: 711100, y2023: 710091, y2022: 709174 },
  { label: "Interest expense", y2024: 5648, y2023: 5134, y2022: 4668 },
  { label: "Depreciation", y2024: 73160, y2023: 72054, y2022: 71140 },
  { label: "Amortization", y2024: 12172, y2023: 11065, y2022: 10059 },
  { label: "Net income", y2024: 1058794, y2023: 916332, y2022: 795846 },
];

const DEMO_BS_ASSETS = [
  { label: "Cash & Cash equivalents", value: 857814 },
  { label: "Accounts receivable", value: 596571 },
  { label: "Other current assets", value: 254798 },
  { label: "Fixed assets & Land", value: 650000 },
  { label: "Other long-term assets", value: 345672 },
];

const DEMO_BS_LIAB = [
  { label: "Accounts payable", value: 114868 },
  { label: "Credit cards & Short-term debt", value: 85837 },
  { label: "Other current liabilities", value: 471217 },
  { label: "Other long-term debt", value: 918922 },
];

export default async function ValuationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = await params;
  const supabase = await createClient();

  const [{ data: snap }, { data: caseRow }, { data: responses }] =
    await Promise.all([
      supabase
        .from("valuation_snapshots")
        .select(
          "valuation_low, valuation_estimate, valuation_high, equity_value_owned, naics_code, ebitda_multiple, revenue_multiple, revenue_ttm, normalized_ebitda, net_working_capital, interest_bearing_debt, balance_sheet_impact, risk_score, risk_impact_pct_low, risk_impact_pct_high",
        )
        .eq("case_id", caseId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("cases")
        .select("ownership_pct, label")
        .eq("id", caseId)
        .single(),
      supabase
        .from("discovery_responses")
        .select(
          "field_key, value, source, status, discovery_field:discovery_fields(label, help_text, choices)",
        )
        .eq("case_id", caseId),
    ]);

  if (!snap) {
    return <DashboardEmptyState caseId={caseId} reportName="valuation" />;
  }

  const ownerPct = caseRow?.ownership_pct ?? 100;
  const isDemo = caseRow?.label === "demo";

  return (
    <main className="flex flex-1 flex-col px-10 pt-10 pb-16">
      <div className="mx-auto w-full max-w-[1100px]">
        <PageHeader title="Business Valuation Report" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT — narrative */}
          <div className="space-y-10 rounded-[10px] border border-border-subtle bg-bg-card px-7 py-6 shadow-card">
            <section>
              <h2 className="text-section font-medium text-text-primary">
                Valuation estimates
              </h2>
              <p className="mt-3 text-body text-text-secondary">
                The value of all equity in the business was estimated based
                on the most recent three years of financials and current
                business characteristics.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-meta text-text-secondary">
                    Business valuation range
                  </p>
                  <p className="mt-2 text-display font-light leading-none text-text-primary tabular-nums font-mono">
                    {formatUSD(snap.valuation_low)} – {formatUSD(snap.valuation_high)}
                  </p>
                </div>
                <div>
                  <p className="text-meta text-text-secondary">
                    Current valuation estimate
                  </p>
                  <p className="mt-2 text-display font-light leading-none text-text-primary tabular-nums font-mono">
                    {formatUSDFull(snap.valuation_estimate)}
                  </p>
                </div>
                <div>
                  <p className="text-meta text-text-secondary">
                    Value of the equity you own ({ownerPct}%)
                  </p>
                  <p className="mt-2 text-display font-light leading-none text-text-primary tabular-nums font-mono">
                    {formatUSDFull(snap.equity_value_owned)}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-section font-medium text-text-primary">
                Methodology
              </h2>
              <p className="mt-3 text-body text-text-secondary">
                Three commonly accepted valuation methodologies were
                referenced and aggregated to estimate your business value:
              </p>
              <div className="mt-5 space-y-5 text-body text-text-secondary">
                <p>
                  <strong className="text-text-primary">Income Approach.</strong>{" "}
                  Estimates what the value of your business&apos;s future
                  earnings would be today based on market conditions with
                  adjustments based on your business risk and balance sheet.
                </p>
                <p>
                  <strong className="text-text-primary">
                    EBITDA Market Approach.
                  </strong>{" "}
                  References comparable transactions within your industry to
                  identify a valuation multiple applied to normalized EBITDA
                  with adjustments based on your business risk and balance
                  sheet.
                </p>
                <p>
                  <strong className="text-text-primary">
                    Revenue Market Approach.
                  </strong>{" "}
                  References comparable transactions within your industry to
                  identify a valuation multiple applied to the most recent
                  year of revenue with adjustments for your business risk
                  and balance sheet.
                </p>
              </div>
            </section>
          </div>

          {/* RIGHT — one card per key-factor section */}
          <div className="flex flex-col gap-3">
            <FactorCard
              title="Revenue & Earnings"
              description="Revenue and Normalized Earnings are the primary drivers when estimating business valuation."
            >
              <KvRow k="2024 Revenue" v={formatUSDFull(snap.revenue_ttm)} />
              <KvRow
                k="Normalized EBITDA"
                v={formatUSDFull(snap.normalized_ebitda)}
              />
            </FactorCard>

            <FactorCard
              title="Balance sheet"
              description="Debt and excess cash influence the equity value of the business directly."
            >
              <KvRow
                k="Net working capital"
                v={formatUSDFull(snap.net_working_capital)}
              />
              <KvRow
                k="Interest-bearing debt"
                v={formatUSDFull(snap.interest_bearing_debt)}
              />
              <KvRow
                k="Total impact of balance sheet"
                v={
                  <span className="inline-flex items-center gap-1.5 text-success-fg">
                    <TriangleAlert
                      className="h-3 w-3 fill-success-fg"
                      aria-hidden
                    />
                    {formatUSDFull(snap.balance_sheet_impact)}
                  </span>
                }
                bold
              />
            </FactorCard>

            <FactorCard
              title="Business risk"
              description="Current operating practices were reviewed to assess the risk of the business."
            >
              <KvRow
                k="Business risk score"
                v={capitalize(snap.risk_score)}
              />
              <KvRow
                k="Impact of business risk on value"
                v={
                  <span className="inline-flex items-center gap-1.5 text-danger-fg">
                    <TriangleAlert
                      className="h-3 w-3 -rotate-180 fill-danger-fg"
                      aria-hidden
                    />
                    {snap.risk_impact_pct_low}-{snap.risk_impact_pct_high}%
                  </span>
                }
                bold
              />
            </FactorCard>

            <FactorCard
              title="Industry"
              description="Benchmark transactions within your industry were used to identify reference multiples."
            >
              <KvRow k="NAICS Code" v={snap.naics_code ?? "—"} />
              <KvRow
                k="EBITDA multiple referenced"
                v={snap.ebitda_multiple ? `${snap.ebitda_multiple.toFixed(2)}x` : "—"}
              />
              <KvRow
                k="Revenue multiple referenced"
                v={snap.revenue_multiple ? `${snap.revenue_multiple.toFixed(2)}x` : "—"}
              />
            </FactorCard>
          </div>
        </div>

        {/* Appendix */}
        {isDemo && (
          <>
            <div className="mt-16">
              <PageHeader
                title="Appendix"
                subtitle="The financial and business characteristics data used to estimate business valuation"
              />
            </div>

            <section>
              <h2 className="text-section font-medium text-text-primary">
                Profit &amp; Loss data
              </h2>
              <table className="mt-6 w-full">
                <thead>
                  <tr className="text-meta text-text-primary">
                    <th />
                    <th className="pb-3 text-right font-medium">2024</th>
                    <th className="pb-3 text-right font-medium">2023</th>
                    <th className="pb-3 text-right font-medium">2022</th>
                  </tr>
                </thead>
                <tbody className="text-meta">
                  {DEMO_PL.map((row) => (
                    <tr key={row.label} className="border-t">
                      <td className="py-2.5 font-medium text-text-primary">
                        {row.label}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-mono text-text-primary">
                        {formatUSDFull(row.y2024)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-mono text-text-primary">
                        {formatUSDFull(row.y2023)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-mono text-text-primary">
                        {formatUSDFull(row.y2022)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t">
                    <td className="py-2.5 font-medium text-text-primary">
                      Adjustments to normalize earnings
                    </td>
                    <td colSpan={3} className="py-2.5 text-right tabular-nums font-mono text-text-primary">
                      $0
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-2.5 font-medium text-text-primary">
                      Normalized EBITDA
                    </td>
                    <td colSpan={3} className="py-2.5 text-right tabular-nums font-mono text-text-primary">
                      {formatUSDFull(snap.normalized_ebitda)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 max-w-2xl text-meta text-text-secondary">
                An estimate of the business&apos;s ability to generate
                earnings before interest, taxes, depreciation, and
                amortization (EBITDA) used as a foundational component to
                estimating business valuation.
              </p>
            </section>

            <section className="mt-12">
              <h2 className="text-section font-medium text-text-primary">
                Balance sheet data
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
                <BalanceTable title="Assets" rows={DEMO_BS_ASSETS} />
                <BalanceTable title="Liabilities" rows={DEMO_BS_LIAB} />
              </div>
            </section>
          </>
        )}

        <section className="mt-12">
          <h2 className="text-section font-medium text-text-primary">
            Business characteristics
          </h2>
          <dl className="mt-6 divide-y">
            {(responses ?? []).map((r) => {
              const field = Array.isArray(r.discovery_field)
                ? r.discovery_field[0]
                : r.discovery_field;
              if (!field) return null;
              const choices = (field.choices ?? []) as {
                value: string;
                label: string;
              }[];
              const display = displayResponseValue(r.value, choices);
              return (
                <div
                  key={r.field_key as string}
                  className="grid grid-cols-1 gap-2 py-4 md:grid-cols-[1fr_auto] md:gap-8"
                >
                  <div>
                    <dt className="text-meta font-medium text-text-primary">
                      {field.label}
                    </dt>
                    {field.help_text && (
                      <p className="mt-0.5 text-meta text-text-secondary">
                        {field.help_text}
                      </p>
                    )}
                  </div>
                  <dd className="text-meta tabular-nums font-mono text-text-primary md:text-right">
                    {display}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <FooterActions />
      </div>
    </main>
  );
}

function FactorCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-border-subtle bg-bg-card px-5 py-4 shadow-card">
      <h4 className="text-body font-semibold text-text-primary">{title}</h4>
      <p className="mt-1 text-meta text-text-secondary">{description}</p>
      <div className="mt-3 space-y-1">{children}</div>
    </div>
  );
}

function KvRow({
  k,
  v,
  bold,
}: {
  k: string;
  v: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t py-2 first:border-t-0 first:pt-0">
      <span
        className={
          "text-meta " + (bold ? "font-medium text-text-primary" : "text-text-primary")
        }
      >
        {k}
      </span>
      <span
        className={
          "text-meta tabular-nums font-mono text-text-primary " +
          (bold ? "font-medium" : "")
        }
      >
        {v}
      </span>
    </div>
  );
}

function BalanceTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b pb-3">
        <h3 className="text-section font-medium text-text-primary">
          {title}
        </h3>
        <p className="text-meta font-medium text-text-primary">2024</p>
      </div>
      <ul>
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-baseline justify-between border-b py-2.5 text-meta"
          >
            <span className="font-medium text-text-primary">{r.label}</span>
            <span className="tabular-nums font-mono text-text-primary">{`$${r.value.toLocaleString()}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function displayResponseValue(
  value: unknown,
  choices: { value: string; label: string }[],
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const match = choices.find((c) => c.value === value);
    return match?.label ?? value;
  }
  return String(value);
}
