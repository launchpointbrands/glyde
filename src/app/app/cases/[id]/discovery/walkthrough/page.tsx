import Link from "next/link";
import { X } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { WalkthroughQuestion } from "@/components/discovery/walkthrough-question";
import { Wordmark } from "@/components/wordmark";
import {
  SECTIONS,
  TOTAL_STEPS,
  getStep,
  sectionState,
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

// Per-question explanatory copy. Lives next to the page that uses it
// because it is single-use UI copy, not domain config.
const TOOLTIPS: Record<string, string> = {
  business_tax_structure:
    "How the business files its taxes. This affects how a buyer structures a deal and what the owner takes home at exit.",
  industry_naics:
    "A standard 6-digit code that classifies the business type. Buyers and lenders use this to find comparable transactions.",
  customer_count:
    "A rough count of paying customers in the last year. Fewer customers means more concentration risk — if one leaves, it hurts more.",
  top_2_customer_revenue_pct:
    "What share of total revenue comes from the two biggest customers. Buyers get nervous above 30%. Above 50% is a red flag.",
  revenue_recurring_pct:
    "Revenue that renews automatically — subscriptions, retainers, contracts. Higher recurring revenue commands a higher valuation multiple.",
  top_vendor_revenue_pct:
    "How dependent the business is on one supplier. A single vendor supplying 25%+ of spend is a vulnerability buyers will flag in diligence.",
  financial_record_manager:
    "The quality of bookkeeping signals operational maturity. A CPA reviewing the books is significantly better than owner-managed.",
  owner_departure_impact:
    "The honest answer to: would this business keep running if the owner left tomorrow? Buyers pay more for businesses that don't need their founder.",
  key_employee_departure_impact:
    "Same question for the team. Key-person dependency suppresses value — retention plans and cross-training are the fix.",
  buy_sell_status:
    "A legal agreement among owners governing what happens to equity at death, disability, or departure. Essential for any exit planning.",
  buy_sell_last_reviewed:
    "When the agreement was last updated. A stale buy-sell creates disputes at the worst possible moment — at death, disability, or exit.",
};

export default async function WalkthroughPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id: caseId } = await params;
  const { q: qParam } = await searchParams;

  const qNum = Number(qParam ?? 1);
  const step = getStep(qNum);
  if (!step) redirect(`/app/cases/${caseId}/discovery/walkthrough?q=1`);

  const supabase = await createClient();
  const [{ data: field }, { data: response }, { data: caseRow }] =
    await Promise.all([
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
      supabase
        .from("cases")
        .select("client_business:client_businesses(business_name)")
        .eq("id", caseId)
        .single(),
    ]);

  if (!field) redirect(`/app/cases/${caseId}/discovery/walkthrough?q=1`);
  if (!caseRow) notFound();

  const cb = Array.isArray(caseRow.client_business)
    ? caseRow.client_business[0]
    : caseRow.client_business;
  const businessName = cb?.business_name ?? "this business";

  const typedField = field as FieldRow;
  const typedResponse = (response as ResponseRow | null) ?? undefined;

  const isLast = step.number === TOTAL_STEPS;
  const backHref =
    step.number === 1
      ? `/app/cases/${caseId}/discovery`
      : `/app/cases/${caseId}/discovery/walkthrough?q=${step.number - 1}`;
  const nextHref = isLast
    ? `/app/processing?caseId=${caseId}`
    : `/app/cases/${caseId}/discovery/walkthrough?q=${step.number + 1}`;

  // Whether the advisor has answered (vs. skipped / not yet touched). Used
  // only to label the primary button — Next is always available so they can
  // move forward, or skip for later, on any question.
  const isAnswered = typedResponse?.status === "answered";

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg-page">
      {/* Top bar — brand, segmented progress, exit */}
      <header className="shrink-0 border-b border-border-subtle bg-bg-card px-6 py-4 md:px-10">
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-6">
          <Wordmark className="hidden text-[18px] text-text-primary sm:block" />
          <p className="truncate text-meta font-medium text-text-primary">
            <span className="text-text-tertiary">Question </span>
            <span className="font-mono tabular-nums">{step.number}</span>
            <span className="text-text-tertiary"> / {TOTAL_STEPS}</span>
          </p>
          <Link
            href={`/app/cases/${caseId}`}
            className="inline-flex items-center gap-1.5 text-meta text-text-tertiary transition-colors hover:text-text-primary"
          >
            Save &amp; exit
            <X className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[760px] px-6 pt-8 pb-16">
        <div className="mb-6">
          <h1 className="text-[26px] font-semibold leading-tight text-text-primary md:text-[30px]">
            Tell us about {businessName}
          </h1>
          <p className="mt-1.5 text-body text-text-secondary">
            Answer what you can — skip anything you don&apos;t know yet and come
            back to it later.
          </p>
        </div>

        <SectionProgress currentQ={step.number} />

        <div className="mt-8">
          <div
            key={step.number /* fade between questions */}
            className="animate-[corarc-fadein_300ms_ease-out] rounded-[10px] border border-border-subtle bg-bg-card px-7 py-9 shadow-card md:px-10"
          >
            <WalkthroughQuestion
              caseId={caseId}
              field={typedField}
              response={typedResponse}
              tooltip={TOOLTIPS[typedField.key]}
            />

            <div className="mt-10 flex items-center justify-between border-t border-border-subtle pt-6">
              <Link
                href={backHref}
                className="text-meta text-text-tertiary transition-colors hover:text-text-primary"
              >
                ← Back
              </Link>
              <Link
                href={nextHref}
                className="rounded-md bg-green-400 px-5 py-2 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
              >
                {isLast ? "Complete →" : isAnswered ? "Next →" : "Skip for now →"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionProgress({ currentQ }: { currentQ: number }) {
  const SEGMENT_CLASS: Record<string, string> = {
    completed: "bg-green-400",
    current: "bg-green-200",
    upcoming: "bg-border-default",
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {SECTIONS.map((s) => {
        const state = sectionState(s, currentQ);
        return (
          <div key={s.label} className="flex flex-col gap-2">
            <p className="text-eyebrow uppercase text-text-tertiary">
              {s.label}
            </p>
            <div
              className={`h-1 rounded-[2px] ${SEGMENT_CLASS[state]}`}
              aria-hidden
            />
          </div>
        );
      })}
    </div>
  );
}
