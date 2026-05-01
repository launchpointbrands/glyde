type CaseStatus = "tier_1" | "tier_2" | "tier_3" | "archived";

const LABELS: Record<CaseStatus, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  archived: "Archived",
};

const BORDER: Record<CaseStatus, string> = {
  tier_1: "border-muted-foreground/20",
  tier_2: "border-muted-foreground/40",
  tier_3: "border-foreground/60",
  archived: "border-muted-foreground/20 text-muted-foreground",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase",
        BORDER[status],
      ].join(" ")}
    >
      {LABELS[status]}
    </span>
  );
}
