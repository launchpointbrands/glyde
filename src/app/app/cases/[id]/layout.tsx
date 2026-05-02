import { Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileCaseNav } from "@/components/case/mobile-case-nav";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { NavLink } from "@/components/nav-link";
import {
  STEPS,
  TOTAL_STEPS,
  firstStepNeedingWork,
} from "@/lib/discovery-walkthrough";
import { createClient } from "@/lib/supabase/server";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: caseRow }, { data: responses }] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, status, client_business:client_businesses(business_name, primary_owner_name, domain, business_description)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("discovery_responses")
      .select("field_key, source, status")
      .eq("case_id", id),
  ]);

  if (!caseRow) notFound();

  const cb = Array.isArray(caseRow.client_business)
    ? caseRow.client_business[0]
    : caseRow.client_business;

  const responseByKey = new Map(
    (responses ?? []).map((r) => [
      r.field_key as string,
      { source: r.source as string, status: r.status as string },
    ]),
  );
  const verifiedCount = STEPS.filter((s) => {
    const r = responseByKey.get(s.fieldKey);
    return r?.status === "answered" && r.source !== "simulated";
  }).length;
  const isComplete = verifiedCount === TOTAL_STEPS;
  const resumeQ = firstStepNeedingWork(responseByKey);

  return (
    <div className="flex flex-1 flex-col pt-[52px] md:pt-0">
      <MobileCaseNav caseId={id} />
      <header className="border-b border-border-subtle bg-bg-card px-5 pt-6 pb-5 md:px-10 md:pt-8 md:pb-6">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className={cb?.primary_owner_name ? "mt-[22px]" : ""}>
              <ClientAvatar
                businessName={cb?.business_name ?? "Unnamed business"}
                domain={cb?.domain ?? null}
                variant="brand"
              />
            </div>
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
              {cb?.business_description && (
                <p
                  className="hidden line-clamp-3 max-w-[640px] text-meta leading-[1.5] text-text-secondary md:block"
                  title={cb.business_description}
                >
                  {cb.business_description}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <DiscoveryStatus
              caseId={id}
              verifiedCount={verifiedCount}
              isComplete={isComplete}
              resumeQ={resumeQ}
            />
          </div>
        </div>
      </header>

      <nav className="hidden items-center gap-9 border-b border-border-subtle bg-bg-card px-10 md:flex">
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

function DiscoveryStatus({
  caseId,
  verifiedCount,
  isComplete,
  resumeQ,
}: {
  caseId: string;
  verifiedCount: number;
  isComplete: boolean;
  resumeQ: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-text-tertiary">
        Discovery
      </p>
      {isComplete ? (
        <p className="inline-flex items-center gap-1.5 text-meta text-success-fg">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Complete
        </p>
      ) : (
        <>
          <p className="text-meta text-text-secondary">
            <span className="font-mono tabular-nums text-text-primary">
              {verifiedCount}
            </span>{" "}
            of{" "}
            <span className="font-mono tabular-nums text-text-primary">
              {TOTAL_STEPS}
            </span>{" "}
            verified
          </p>
          <Link
            href={`/app/cases/${caseId}/discovery/walkthrough?q=${resumeQ}`}
            className="rounded-md bg-green-400 px-3 py-1.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
          >
            Continue →
          </Link>
        </>
      )}
    </div>
  );
}
