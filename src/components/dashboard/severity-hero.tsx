// Severity word with a colored vertical bar — the bar is the only
// colored element; the word stays in primary text. Severity colors
// pull from the new muted DESIGN.md severity palette.

import type { Severity } from "./severity-pill";

const BAR_COLOR: Record<Severity, string> = {
  high: "bg-danger-fg",
  moderate: "bg-warning-fg",
  low: "bg-success-fg",
};

const SIZE_CLASSES = {
  lg: { word: "text-display", bar: "w-1.5" },
  md: { word: "text-stat", bar: "w-1.5" },
  sm: { word: "text-page", bar: "w-1" },
} as const;

const LABEL: Record<Severity, string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export function SeverityHero({
  severity,
  label,
  size = "md",
}: {
  severity: Severity;
  label?: string;
  size?: keyof typeof SIZE_CLASSES;
}) {
  const s = SIZE_CLASSES[size];
  return (
    <div className="inline-flex items-stretch gap-3">
      <div
        className={`${s.bar} self-stretch rounded-sm ${BAR_COLOR[severity]}`}
        aria-hidden
      />
      <span
        className={`${s.word} font-light leading-none text-text-primary`}
      >
        {label ?? LABEL[severity]}
      </span>
    </div>
  );
}
