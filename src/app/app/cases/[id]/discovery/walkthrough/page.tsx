import Link from "next/link";
import { redirect } from "next/navigation";
import { WalkthroughQuestion } from "@/components/discovery/walkthrough-question";
import {
  TOTAL_STEPS,
  getStep,
  isStepComplete,
} from "@/lib/discovery-walkthrough";
import { createClient } from "@/lib/supabase/server";

type FieldRow = {
  key: string;
  label: string;
  help_text: string | null;
  input_type: "enum_single" | "enum_multi" | "numeric" | "percentage" | "text";
  choices: { value: string; label: string }[] | null;
};

type ResponseRow = {
  field_key: string;
  value: unknown;
  source: "simulated" | "advisor" | "client" | "valuation_api";
  status: "answered" | "skipped" | "unknown";
};

export default async function WalkthroughPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id: caseId } = await params;
  const { step: stepParam } = await searchParams;

  const stepNum = Number(stepParam ?? 1);
  const step = getStep(stepNum);
  if (!step) redirect(`/app/cases/${caseId}/discovery/walkthrough?step=1`);

  const supabase = await createClient();
  const [{ data: fields }, { data: responses }] = await Promise.all([
    supabase
      .from("discovery_fields")
      .select("key, label, help_text, input_type, choices")
      .in("key", step.fieldKeys),
    supabase
      .from("discovery_responses")
      .select("field_key, value, source, status")
      .eq("case_id", caseId)
      .in("field_key", step.fieldKeys),
  ]);

  const fieldsByKey = new Map<string, FieldRow>(
    (fields ?? []).map((f) => [f.key, f as FieldRow]),
  );
  const responseByKey = new Map<string, ResponseRow>(
    (responses ?? []).map((r) => [r.field_key, r as ResponseRow]),
  );

  const stepRowsForCheck = new Map(
    Array.from(responseByKey.entries()).map(([k, r]) => [k, { status: r.status }]),
  );
  const canAdvance = isStepComplete(step, stepRowsForCheck);

  const isLast = step.number === TOTAL_STEPS;
  const backHref =
    step.number === 1
      ? `/app/cases/${caseId}`
      : `/app/cases/${caseId}/discovery/walkthrough?step=${step.number - 1}`;
  const nextHref = isLast
    ? `/app/cases/${caseId}/discovery?from=walkthrough_complete`
    : `/app/cases/${caseId}/discovery/walkthrough?step=${step.number + 1}`;

  const orderedFields: FieldRow[] = step.fieldKeys
    .map((k) => fieldsByKey.get(k))
    .filter((f): f is FieldRow => Boolean(f));

  const progressPct = (step.number / TOTAL_STEPS) * 100;

  return (
    <main className="flex min-h-full flex-1 flex-col bg-bg-page">
      <div className="h-[2px] w-full bg-border-subtle">
        <div
          className="h-full bg-green-400 transition-all"
          style={{ width: `${progressPct}%` }}
          aria-hidden
        />
      </div>

      <div className="flex flex-1 items-start justify-center px-6 py-14">
        <div className="w-full max-w-[640px]">
          <div className="rounded-[10px] border border-border-subtle bg-bg-card px-12 py-12 shadow-card">
            <p className="text-eyebrow uppercase text-text-tertiary">
              Step {step.number} of {TOTAL_STEPS}
            </p>
            <h1 className="mt-2 text-display font-light leading-[1.1] text-text-primary">
              {step.title}
            </h1>
            <p className="mt-3 text-body text-text-secondary">
              {step.intro}
            </p>

            <div className="mt-10 space-y-12">
              {orderedFields.map((f) => (
                <WalkthroughQuestion
                  key={f.key}
                  caseId={caseId}
                  field={f}
                  response={responseByKey.get(f.key)}
                />
              ))}
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-border-subtle pt-6">
              <Link
                href={backHref}
                className="text-meta text-text-tertiary transition-colors hover:text-text-primary"
              >
                ← Back
              </Link>
              {canAdvance ? (
                <Link
                  href={nextHref}
                  className="rounded-md bg-green-400 px-4 py-2 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
                >
                  {isLast ? "Finish" : "Next →"}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Answer, skip, or flag each question to continue"
                  className="cursor-not-allowed rounded-md bg-green-400 px-4 py-2 text-meta font-medium text-text-inverse opacity-40"
                >
                  {isLast ? "Finish" : "Next →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
