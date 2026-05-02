type CaseStatus = "tier_1" | "tier_2" | "tier_3" | "archived";

const LABELS: Record<CaseStatus, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  archived: "Archived",
};

// Tier represents data depth, not severity — neutral treatment across
// active tiers. Slight border weight differentiates them visually
// without colorizing.
const BORDER: Record<CaseStatus, string> = {
  tier_1: "border-border-subtle text-text-tertiary",
  tier_2: "border-border-default text-text-secondary",
  tier_3: "border-border-strong text-text-primary",
  archived: "border-border-subtle text-text-tertiary",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-[3px] text-eyebrow font-medium uppercase",
        BORDER[status],
      ].join(" ")}
    >
      {LABELS[status]}
    </span>
  );
}
