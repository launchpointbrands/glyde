import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { TOTAL_STEPS } from "@/lib/discovery-walkthrough";
import { seedDemoCase } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

type ClientBusinessSummary = {
  business_name: string | null;
  domain: string | null;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  primary_owner_name: string | null;
};

type CaseRow = {
  id: string;
  status: string;
  created_at: string;
  client_business: ClientBusinessSummary | ClientBusinessSummary[] | null;
};

function formatUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function readinessDot(score: number): string {
  if (score < 40) return "bg-danger-fg";
  if (score <= 65) return "bg-warning-fg";
  return "bg-green-400";
}

// Shared cell width classes — keeps the header row and data rows
// horizontally aligned. Mobile drops 5 columns; CLIENT and BUSINESS
// flex to fill the remaining space and the chevron pins right.
const CELL_CLIENT = "min-w-0 flex-1";
const CELL_EMAIL = "hidden w-[200px] shrink-0 md:block";
const CELL_BUSINESS = "min-w-0 flex-[1.4]";
const CELL_WEBSITE = "hidden w-[140px] shrink-0 md:block";
const CELL_REVENUE = "hidden w-[100px] shrink-0 md:block";
const CELL_DISCOVERY = "hidden w-[110px] shrink-0 md:block";
const CELL_READINESS = "hidden w-[110px] shrink-0 md:block";

export default async function CasesPage() {
  const supabase = await createClient();

  const [
    { data: cases },
    { data: discoveryRows },
    { data: readinessRows },
    { data: valuationRows },
  ] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, status, created_at, client_business:client_businesses(business_name, domain, contact_name, contact_title, contact_email, primary_owner_name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("discovery_responses")
      .select("case_id, status, source"),
    supabase.from("readiness_items").select("case_id, is_complete"),
    supabase
      .from("valuation_snapshots")
      .select("case_id, revenue_ttm, computed_at")
      .order("computed_at", { ascending: false }),
  ]);

  if (!cases || cases.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-8 py-16">
        <div className="max-w-md space-y-5 text-center">
          <h1 className="text-stat font-semibold text-text-primary">
            Your book is empty
          </h1>
          <p className="text-body text-text-secondary">
            Add your first business owner client to get started.
          </p>
          <div className="space-y-3 pt-2">
            <Link
              href="/app/cases/new"
              className="inline-block rounded-md bg-green-400 px-5 py-2.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
            >
              Add a client
            </Link>
            <form action={seedDemoCase}>
              <button
                type="submit"
                className="text-meta text-text-tertiary transition-colors hover:text-text-primary"
              >
                or load a demo case to explore.
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Verified discovery count — answered AND not simulated. Matches the
  // case-header DiscoveryStatus widget's definition.
  const verifiedByCase = new Map<string, number>();
  for (const r of discoveryRows ?? []) {
    if (r.status !== "answered") continue;
    if (r.source === "simulated") continue;
    verifiedByCase.set(r.case_id, (verifiedByCase.get(r.case_id) ?? 0) + 1);
  }

  const readinessByCase = new Map<string, { complete: number; total: number }>();
  for (const r of readinessRows ?? []) {
    const cur = readinessByCase.get(r.case_id) ?? { complete: 0, total: 0 };
    cur.total += 1;
    if (r.is_complete) cur.complete += 1;
    readinessByCase.set(r.case_id, cur);
  }

  // Latest revenue per case (snapshot rows are ordered desc by computed_at).
  const revenueByCase = new Map<string, number | null>();
  for (const v of valuationRows ?? []) {
    if (revenueByCase.has(v.case_id)) continue;
    revenueByCase.set(v.case_id, v.revenue_ttm ?? null);
  }

  return (
    <main className="flex flex-1 flex-col px-5 pt-7 pb-10 md:px-10 md:pt-9 md:pb-12">
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mb-7 flex items-end justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-eyebrow uppercase text-text-tertiary">
              Your book
            </p>
            <h1 className="text-page font-semibold text-text-primary">
              Clients
            </h1>
          </div>
          <Link
            href="/app/cases/new"
            className="rounded-md bg-green-400 px-4 py-2 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
          >
            Add a client
          </Link>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-card shadow-card">
          {/* Header row — hidden on mobile (with only CLIENT + BUSINESS
              visible the labels add noise; rows speak for themselves). */}
          <div className="hidden items-center gap-4 border-b border-border-subtle bg-bg-card px-5 py-3 md:flex">
            <p className={`${CELL_CLIENT} text-eyebrow uppercase text-text-tertiary`}>
              Client
            </p>
            <p className={`${CELL_EMAIL} text-eyebrow uppercase text-text-tertiary`}>
              Email
            </p>
            <p className={`${CELL_BUSINESS} text-eyebrow uppercase text-text-tertiary`}>
              Business
            </p>
            <p className={`${CELL_WEBSITE} text-eyebrow uppercase text-text-tertiary`}>
              Website
            </p>
            <p className={`${CELL_REVENUE} text-eyebrow uppercase text-text-tertiary`}>
              Revenue
            </p>
            <p className={`${CELL_DISCOVERY} text-eyebrow uppercase text-text-tertiary`}>
              Discovery
            </p>
            <p className={`${CELL_READINESS} text-eyebrow uppercase text-text-tertiary`}>
              Readiness
            </p>
            <span className="w-4 shrink-0" aria-hidden />
          </div>

          {(cases as CaseRow[]).map((c) => {
            const cb = Array.isArray(c.client_business)
              ? c.client_business[0]
              : c.client_business;
            const businessName = cb?.business_name ?? "Unknown business";
            const domain = cb?.domain ?? null;
            const contactPrimary =
              cb?.contact_name ?? cb?.primary_owner_name ?? null;
            const contactTitle = cb?.contact_title ?? null;
            const contactEmail = cb?.contact_email ?? null;

            const verified = verifiedByCase.get(c.id) ?? 0;
            const discoveryComplete = verified === TOTAL_STEPS;

            const readiness = readinessByCase.get(c.id);
            const readinessScore =
              readiness && readiness.total > 0
                ? Math.round((readiness.complete / readiness.total) * 100)
                : null;

            const revenue = revenueByCase.get(c.id) ?? null;

            return (
              <Link
                key={c.id}
                href={`/app/cases/${c.id}`}
                className="flex min-h-[44px] items-center gap-4 border-b border-border-subtle px-5 py-3 transition-colors last:border-b-0 hover:bg-bg-hover"
              >
                {/* CLIENT */}
                <div className={CELL_CLIENT}>
                  <p className="truncate text-meta font-semibold text-text-primary">
                    {contactPrimary ?? businessName}
                  </p>
                  {contactPrimary && contactTitle && (
                    <p className="truncate text-[12px] text-text-secondary">
                      {contactTitle}
                    </p>
                  )}
                </div>

                {/* EMAIL */}
                <p className={`${CELL_EMAIL} truncate text-meta text-text-secondary`}>
                  {contactEmail ?? "—"}
                </p>

                {/* BUSINESS */}
                <div className={`${CELL_BUSINESS} flex items-center gap-2`}>
                  <ClientAvatar
                    businessName={businessName}
                    domain={domain}
                    size={20}
                  />
                  <p className="truncate text-meta text-text-primary">
                    {businessName}
                  </p>
                </div>

                {/* WEBSITE */}
                <p className={`${CELL_WEBSITE} truncate text-meta text-text-tertiary`}>
                  {domain ?? "—"}
                </p>

                {/* REVENUE */}
                <p
                  className={`${CELL_REVENUE} truncate font-mono tabular-nums text-meta text-text-primary`}
                >
                  {formatUSD(revenue)}
                </p>

                {/* DISCOVERY */}
                <div className={CELL_DISCOVERY}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        discoveryComplete ? "bg-green-400" : "bg-warning-fg"
                      }`}
                      aria-hidden
                    />
                    <span className="font-mono tabular-nums text-meta text-text-primary">
                      {verified} / {TOTAL_STEPS}
                    </span>
                  </span>
                </div>

                {/* READINESS */}
                <div className={CELL_READINESS}>
                  {readinessScore != null ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${readinessDot(readinessScore)}`}
                        aria-hidden
                      />
                      <span className="font-mono tabular-nums text-meta text-text-primary">
                        {readinessScore} / 100
                      </span>
                    </span>
                  ) : (
                    <span className="text-meta text-text-tertiary">—</span>
                  )}
                </div>

                <ChevronRight
                  className="h-4 w-4 shrink-0 text-text-tertiary"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
