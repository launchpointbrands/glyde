import Image from "next/image";
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
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { caseId } = await params;
  const { step: stepParam } = await searchParams;

  const stepNum = Number(stepParam ?? 1);
  const step = getStep(stepNum);
  if (!step) redirect(`/walkthrough/${caseId}?step=1`);

  const supabase = await createClient();
  const [{ data: field }, { data: response }] = await Promise.all([
    supabase
      .from("discovery_fields")
      .select("key, label, help_text, input_type, choices")
      .eq("key", step.fieldKey)
      .maybeSingle(),
    supabase
      .from("discovery_responses")
      .select("field_key, value, source, status")
      .eq("case_id", caseId)
      .eq("field_key", step.fieldKey)
      .maybeSingle(),
  ]);

  if (!field) redirect(`/walkthrough/${caseId}?step=1`);

  const typedField = field as FieldRow;
  const typedResponse = (response as ResponseRow | null) ?? undefined;

  const rowsForCheck = new Map<string, { status: string }>(
    typedResponse
      ? [[typedResponse.field_key, { status: typedResponse.status }]]
      : [],
  );
  const canAdvance = isStepComplete(step, rowsForCheck);

  const isLast = step.number === TOTAL_STEPS;
  const backHref =
    step.number === 1
      ? `/app/cases/${caseId}`
      : `/walkthrough/${caseId}?step=${step.number - 1}`;
  const nextHref = isLast
    ? `/app/cases/${caseId}/discovery?from=walkthrough_complete`
    : `/walkthrough/${caseId}?step=${step.number + 1}`;

  const progressPct = (step.number / TOTAL_STEPS) * 100;

  return (
    <main className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex items-start justify-between px-10 py-7">
        <Image
          src="/brand/glyde-wordmark.svg"
          alt="Glyde"
          width={140}
          height={28}
          unoptimized
          priority
          className="h-7 w-auto"
        />
        <div className="flex flex-col items-end gap-2">
          <p className="text-eyebrow uppercase text-text-tertiary">
            Question{" "}
            <span className="font-mono tabular-nums text-text-primary">
              {step.number}
            </span>{" "}
            of{" "}
            <span className="font-mono tabular-nums text-text-primary">
              {TOTAL_STEPS}
            </span>
          </p>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-border-subtle">
            <div
              className="h-full bg-green-400 transition-all"
              style={{ width: `${progressPct}%` }}
              aria-hidden
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-start justify-center px-6 py-10">
        <div className="w-full max-w-[640px]">
          <div className="rounded-[10px] border border-border-subtle bg-bg-card px-12 py-12 shadow-card">
            <WalkthroughQuestion
              caseId={caseId}
              field={typedField}
              response={typedResponse}
            />

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
                  title="Answer, skip, or flag this question to continue"
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
