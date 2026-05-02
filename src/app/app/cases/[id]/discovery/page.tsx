import { redirect } from "next/navigation";
import Link from "next/link";
import {
  DiscoveryRow,
  type DiscoveryField,
  type DiscoveryResponse,
} from "@/components/discovery/discovery-row";
import { firstStepNeedingWork } from "@/lib/discovery-walkthrough";
import { verifyAllSimulated } from "@/lib/discovery";
import { createClient } from "@/lib/supabase/server";

const MODULE_ORDER: { key: string; label: string }[] = [
  { key: "business_profile", label: "Business profile" },
  { key: "risk", label: "Risk" },
  { key: "wealth", label: "Wealth" },
  { key: "succession", label: "Succession" },
];

export default async function DiscoveryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id: caseId } = await params;
  const { from } = await searchParams;
  const supabase = await createClient();

  const [{ data: fields }, { data: responses }] = await Promise.all([
    supabase
      .from("discovery_fields")
      .select("key, label, help_text, input_type, choices, module, display_order")
      .order("display_order"),
    supabase
      .from("discovery_responses")
      .select("field_key, value, source, status")
      .eq("case_id", caseId),
  ]);

  if ((responses ?? []).length === 0) {
    redirect(`/app/cases/${caseId}/discovery/walkthrough?q=1`);
  }

  if (!fields) return null;

  const responseByKey = new Map<string, DiscoveryResponse>(
    (responses ?? []).map((r) => [r.field_key, r as DiscoveryResponse]),
  );

  const fieldsByModule = new Map<string, DiscoveryField[]>();
  for (const f of fields as DiscoveryField[]) {
    if (!fieldsByModule.has(f.module)) fieldsByModule.set(f.module, []);
    fieldsByModule.get(f.module)!.push(f);
  }

  const totalAskable = (fields as DiscoveryField[]).length;
  let verifiedCount = 0;
  let followUpCount = 0;
  let simulatedCount = 0;
  for (const f of fields as DiscoveryField[]) {
    const r = responseByKey.get(f.key);
    if (!r) continue;
    if (r.status === "answered" && r.source !== "simulated") verifiedCount++;
    if (r.status === "answered" && r.source === "simulated") simulatedCount++;
    if (r.status === "unknown") followUpCount++;
  }

  const resumeRowsForCheck = new Map(
    Array.from(responseByKey.entries()).map(([k, r]) => [
      k,
      { source: r.source, status: r.status },
    ]),
  );
  const resumeStep = firstStepNeedingWork(resumeRowsForCheck);
  const resumeHref = `/app/cases/${caseId}/discovery/walkthrough?q=${resumeStep}`;

  const verifyAll = verifyAllSimulated.bind(null, caseId);
  const showCompleteBanner = from === "walkthrough_complete";

  return (
    <main className="flex flex-1 flex-col px-10 pt-8 pb-16">
      <div className="mx-auto w-full max-w-[1000px]">
        {showCompleteBanner && (
          <div className="mb-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-meta text-green-800">
            Discovery complete · {verifiedCount} of {totalAskable} verified
            {followUpCount > 0 && (
              <>
                {" · "}
                <span className="text-danger-fg">
                  {followUpCount} to follow up on
                </span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-6 pb-5">
          <p className="text-meta text-text-secondary">
            <span className="font-mono tabular-nums text-text-primary">
              {verifiedCount}
            </span>{" "}
            of{" "}
            <span className="font-mono tabular-nums text-text-primary">
              {totalAskable}
            </span>{" "}
            verified
            {simulatedCount > 0 && (
              <>
                {" · "}
                <span>
                  <span className="font-mono tabular-nums text-text-primary">
                    {simulatedCount}
                  </span>{" "}
                  simulated
                </span>
              </>
            )}
            {followUpCount > 0 && (
              <>
                {" · "}
                <span className="text-danger-fg">
                  <span className="font-mono tabular-nums">{followUpCount}</span>{" "}
                  to follow up on
                </span>
              </>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {simulatedCount > 0 && (
              <form action={verifyAll}>
                <button
                  type="submit"
                  className="rounded-md border border-border-default bg-bg-card px-3 py-1.5 text-meta font-medium text-text-primary transition-colors hover:bg-bg-hover"
                >
                  Verify all simulated
                </button>
              </form>
            )}
            <Link
              href={resumeHref}
              className="rounded-md bg-green-400 px-3.5 py-1.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
            >
              Resume walkthrough
            </Link>
          </div>
        </div>

        {MODULE_ORDER.map((mod) => {
          const moduleFields = fieldsByModule.get(mod.key);
          if (!moduleFields || moduleFields.length === 0) return null;
          return (
            <section
              key={mod.key}
              className="mt-3 rounded-[10px] border border-border-subtle bg-bg-card px-6 pt-5 pb-2 shadow-card"
            >
              <h3 className="text-eyebrow uppercase text-text-tertiary">
                {mod.label}
              </h3>
              <div className="mt-2 divide-y divide-border-subtle">
                {moduleFields.map((f) => (
                  <DiscoveryRow
                    key={f.key}
                    caseId={caseId}
                    field={f}
                    response={responseByKey.get(f.key)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
