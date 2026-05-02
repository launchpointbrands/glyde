// Single status-pill primitive. Severity, status, and neutral states
// share one visual vocabulary so the system reads as a set.
// Severity families (high/moderate/low) follow DESIGN.md exactly.

export type Family = "success" | "warning" | "danger" | "neutral";

export type StatusVariant =
  | "verified"
  | "simulated"
  | "skipped"
  | "follow_up"
  | "high"
  | "moderate"
  | "low";

const VARIANT_FAMILY: Record<StatusVariant, Family> = {
  verified: "success",
  simulated: "neutral",
  skipped: "warning",
  follow_up: "danger",
  high: "danger",
  moderate: "warning",
  low: "success",
};

const VARIANT_LABEL: Record<StatusVariant, string> = {
  verified: "Verified",
  simulated: "Simulated",
  skipped: "Skipped",
  follow_up: "Follow up",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

const FAMILY_CLASSES: Record<Family, string> = {
  success: "bg-success-bg border-success-border text-success-fg",
  warning: "bg-warning-bg border-warning-border text-warning-fg",
  danger: "bg-danger-bg border-danger-border text-danger-fg",
  neutral: "bg-bg-hover border-border-default text-text-secondary",
};

const FAMILY_DOT: Record<Family, string> = {
  success: "bg-success-fg",
  warning: "bg-warning-fg",
  danger: "bg-danger-fg",
  neutral: "bg-text-tertiary",
};

export function StatusPill({
  variant,
  showDot = true,
  label,
}: {
  variant: StatusVariant;
  showDot?: boolean;
  label?: string;
}) {
  const family = VARIANT_FAMILY[variant];
  const text = label ?? VARIANT_LABEL[variant];

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-[3px] text-eyebrow font-medium uppercase",
        FAMILY_CLASSES[family],
      ].join(" ")}
    >
      {showDot && (
        <span
          className={`h-1 w-1 rounded-full ${FAMILY_DOT[family]}`}
          aria-hidden
        />
      )}
      {text}
    </span>
  );
}
