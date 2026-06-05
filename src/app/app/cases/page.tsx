import Link from "next/link";
import { ClientsTable, type ClientRow } from "@/components/clients/clients-table";
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

export default async function ClientsPage() {
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
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("discovery_responses").select("case_id, status, source"),
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

  // Verified discovery count — answered AND not simulated.
  const verifiedByCase = new Map<string, number>();
  for (const r of discoveryRows ?? []) {
    if (r.status !== "answered" || r.source === "simulated") continue;
    verifiedByCase.set(r.case_id, (verifiedByCase.get(r.case_id) ?? 0) + 1);
  }

  const readinessByCase = new Map<string, { complete: number; total: number }>();
  for (const r of readinessRows ?? []) {
    const cur = readinessByCase.get(r.case_id) ?? { complete: 0, total: 0 };
    cur.total += 1;
    if (r.is_complete) cur.complete += 1;
    readinessByCase.set(r.case_id, cur);
  }

  const revenueByCase = new Map<string, number | null>();
  for (const v of valuationRows ?? []) {
    if (revenueByCase.has(v.case_id)) continue;
    revenueByCase.set(v.case_id, v.revenue_ttm ?? null);
  }

  const clients: ClientRow[] = (cases as CaseRow[]).map((c) => {
    const cb = Array.isArray(c.client_business)
      ? c.client_business[0]
      : c.client_business;
    const readiness = readinessByCase.get(c.id);
    const readinessScore =
      readiness && readiness.total > 0
        ? Math.round((readiness.complete / readiness.total) * 100)
        : null;
    return {
      id: c.id,
      contactPrimary: cb?.contact_name ?? cb?.primary_owner_name ?? null,
      contactTitle: cb?.contact_title ?? null,
      contactEmail: cb?.contact_email ?? null,
      businessName: cb?.business_name ?? "Unknown business",
      domain: cb?.domain ?? null,
      revenue: revenueByCase.get(c.id) ?? null,
      verified: verifiedByCase.get(c.id) ?? 0,
      totalSteps: TOTAL_STEPS,
      readinessScore,
    };
  });

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

        <ClientsTable clients={clients} />
      </div>
    </main>
  );
}
