import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { DiscoveryArc } from "@/components/clients/discovery-arc";
import { StatusPill } from "@/components/ui/status-pill";
import { seedDemoCase } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

const TOTAL_DISCOVERY_FIELDS = 11;

type Severity = "low" | "moderate" | "high";

type ClientBusinessSummary = {
  business_name: string | null;
  domain: string | null;
  contact_name: string | null;
  contact_title: string | null;
  primary_owner_name: string | null;
};

type CaseRow = {
  id: string;
  status: string;
  created_at: string;
  client_business: ClientBusinessSummary | ClientBusinessSummary[] | null;
};

function readinessDot(score: number): string {
  if (score < 40) return "bg-danger-fg";
  if (score <= 65) return "bg-warning-fg";
  return "bg-success-fg";
}

export default async function CasesPage() {
  const supabase = await createClient();

  const [
    { data: cases },
    { data: discoveryRows },
    { data: riskRows },
    { data: readinessRows },
  ] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, status, created_at, client_business:client_businesses(business_name, domain, contact_name, contact_title, primary_owner_name)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("discovery_responses").select("case_id, status"),
    supabase
      .from("risk_assessments")
      .select("case_id, overall_risk, computed_at")
      .order("computed_at", { ascending: false }),
    supabase.from("readiness_items").select("case_id, is_complete"),
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

  const discoveryCount = new Map<string, number>();
  for (const r of discoveryRows ?? []) {
    if (r.status !== "answered") continue;
    discoveryCount.set(r.case_id, (discoveryCount.get(r.case_id) ?? 0) + 1);
  }

  const latestRiskByCase = new Map<string, Severity>();
  for (const r of riskRows ?? []) {
    if (!latestRiskByCase.has(r.case_id)) {
      latestRiskByCase.set(r.case_id, r.overall_risk as Severity);
    }
  }

  const readinessByCase = new Map<string, { complete: number; total: number }>();
  for (const r of readinessRows ?? []) {
    const cur = readinessByCase.get(r.case_id) ?? { complete: 0, total: 0 };
    cur.total += 1;
    if (r.is_complete) cur.complete += 1;
    readinessByCase.set(r.case_id, cur);
  }

  return (
    <main className="flex flex-1 flex-col px-10 pt-9 pb-12">
      <div className="mx-auto w-full max-w-[960px]">
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

        <ul className="space-y-3">
          {(cases as CaseRow[]).map((c) => {
            const cb = Array.isArray(c.client_business)
              ? c.client_business[0]
              : c.client_business;
            const businessName = cb?.business_name ?? "Unknown business";
            const domain = cb?.domain ?? null;
            const contactName = cb?.contact_name ?? cb?.primary_owner_name ?? null;
            const contactTitle = cb?.contact_title ?? null;

            const dCount = discoveryCount.get(c.id) ?? 0;
            const risk = latestRiskByCase.get(c.id) ?? null;
            const readiness = readinessByCase.get(c.id);
            const readinessScore =
              readiness && readiness.total > 0
                ? Math.round((readiness.complete / readiness.total) * 100)
                : null;

            return (
              <li key={c.id}>
                <Link
                  href={`/app/cases/${c.id}`}
                  className="group flex items-center gap-4 rounded-[10px] border border-border-subtle bg-bg-card px-5 py-4 shadow-card transition-colors hover:border-border-default"
                >
                  <ClientAvatar businessName={businessName} domain={domain} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold text-text-primary">
                      {businessName}
                    </p>
                    {contactName && (
                      <p className="truncate text-meta text-text-secondary">
                        {contactName}
                        {contactTitle && (
                          <span className="text-text-tertiary">
                            {" · "}
                            {contactTitle}
                          </span>
                        )}
                      </p>
                    )}
                    {domain && (
                      <p className="truncate text-meta text-text-tertiary">
                        {domain}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    <span className="inline-flex items-center gap-1.5 font-mono text-meta tabular-nums">
                      <DiscoveryArc
                        count={dCount}
                        total={TOTAL_DISCOVERY_FIELDS}
                      />
                      <span
                        className={
                          dCount >= TOTAL_DISCOVERY_FIELDS
                            ? "text-green-600"
                            : "text-text-tertiary"
                        }
                      >
                        {dCount} / {TOTAL_DISCOVERY_FIELDS}
                      </span>
                    </span>

                    {risk && <StatusPill variant={risk} />}

                    {readinessScore != null && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-meta tabular-nums text-text-secondary">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${readinessDot(
                            readinessScore,
                          )}`}
                          aria-hidden
                        />
                        {readinessScore} / 100
                      </span>
                    )}
                  </div>

                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-text-secondary"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
