import type { RiskFactor } from "@/components/dashboard/risk-client";
import type { Severity } from "@/components/dashboard/severity-pill";

// Plain-language sentence per (factor.key + severity). The literal
// "[Owner]" token is replaced with the contact's first name at render.
const FACTOR_COPY: Record<string, Partial<Record<Severity, string>>> = {
  owner_dependency: {
    high: "[Owner] is central to daily operations — buyers will discount the business significantly until this changes.",
    moderate:
      "[Owner]'s involvement creates some dependency — building a stronger management team will improve valuation.",
  },
  customer_concentration: {
    high: "Revenue is heavily concentrated in a few customers — losing one would materially impact the business.",
    moderate:
      "A moderate concentration in top customers creates some risk — diversification improves resilience.",
  },
  key_employee_dependency: {
    high: "Key employees could disrupt operations if they left — retention plans and cross-training reduce this risk.",
    moderate:
      "Some reliance on key staff — retention programs would strengthen the business's market position.",
  },
  buy_sell: {
    high: "The buy-sell agreement needs immediate attention — an outdated agreement creates legal risk at the worst moment.",
    moderate:
      "The buy-sell agreement should be reviewed — it may not reflect current valuation or ownership intentions.",
  },
  revenue_quality: {
    high: "Revenue is primarily transactional — shifting toward recurring contracts would increase valuation multiples.",
    moderate:
      "Recurring revenue could be stronger — even small improvements in contract structure improve valuation.",
  },
  supplier_diversity: {
    high: "Heavy reliance on a single supplier creates operational vulnerability — backup sourcing is critical.",
    moderate:
      "Some supplier concentration exists — diversifying spend reduces risk in a transaction.",
  },
};

const FACTOR_ACTION: Record<string, string> = {
  owner_dependency: "Build a leadership team that can run the business without direct involvement.",
  customer_concentration: "Develop strategies to diversify the customer base.",
  key_employee_dependency: "Implement retention plans and cross-training for critical roles.",
  buy_sell: "Schedule a buy-sell review with their attorney this quarter.",
  revenue_quality: "Evaluate opportunities to add recurring revenue streams.",
  supplier_diversity: "Identify and qualify backup suppliers for key inputs.",
};

const GENERIC: Callout[] = [
  {
    severity: "high",
    name: "Owner dependency",
    body: "Most privately held businesses are heavily dependent on their owner. This is typically the single biggest discount buyers apply to valuation.",
    action: "Complete discovery to assess this client's specific situation.",
  },
  {
    severity: "moderate",
    name: "Exit readiness",
    body: "Business owners who plan their exit achieve significantly better outcomes than those who don't. Starting the conversation early is the most valuable thing an advisor can do.",
    action: "Schedule an exit planning conversation.",
  },
  {
    severity: "moderate",
    name: "Business transferability",
    body: "A business that runs without its owner is worth significantly more. Systems, processes, and a strong team are the foundation of transferability.",
    action: "Assess operational independence.",
  },
];

const POSITIVE: Callout = {
  severity: "low",
  name: "Strong fundamentals",
  body: "This business shows strong fundamentals across all risk categories. Focus conversations on growth, succession planning, and protecting the value already built.",
  action: "Keep the momentum — protect what's working.",
};

const SEVERITY_RANK: Record<Severity, number> = {
  high: 0,
  moderate: 1,
  low: 2,
};

const DOT_BG: Record<Severity, string> = {
  high: "bg-danger-text",
  moderate: "bg-warning-text",
  low: "bg-success-text",
};

type Callout = {
  severity: Severity;
  name: string;
  body: string;
  action: string;
};

export function KeyRisksCard({
  factors,
  contactName,
}: {
  factors: RiskFactor[];
  contactName: string;
}) {
  const callouts = pickCallouts(factors, contactName);

  return (
    <section className="mt-8 rounded-[10px] border border-border-subtle bg-bg-card px-7 py-6 shadow-card">
      <h2 className="text-section font-medium text-text-primary">
        Key business risks
      </h2>
      <p className="mt-1.5 text-meta text-text-secondary">
        Top risks affecting marketability and valuation. Each callout pairs the
        risk with one suggested next step.
      </p>
      <div className="mt-5 space-y-4">
        {callouts.map((c) => (
          <div key={c.name} className="flex items-start gap-3">
            <span
              aria-hidden
              className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT_BG[c.severity]}`}
            />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-text-primary">
                {c.name}
              </p>
              <p className="mt-1 text-meta text-text-secondary">{c.body}</p>
              <p className="mt-1.5 text-meta text-green-600 italic">
                {c.action}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function pickCallouts(
  factors: RiskFactor[],
  contactName: string,
): Callout[] {
  if (factors.length === 0) return GENERIC;

  const allLow = factors.every((f) => f.severity === "low");
  if (allLow) return [POSITIVE];

  const ranked = [...factors].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
  const topThree = ranked
    .filter((f) => f.severity !== "low")
    .slice(0, 3);

  return topThree.map((f) => {
    const copy =
      FACTOR_COPY[f.key]?.[f.severity] ?? f.headline ?? f.explanation;
    const body = copy.replaceAll("[Owner]", contactName);
    const action = FACTOR_ACTION[f.key] ?? "Discuss with your client at the next meeting.";
    return {
      severity: f.severity,
      name: f.label,
      body,
      action,
    };
  });
}
