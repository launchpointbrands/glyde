// Tiny circular progress indicator for discovery completion. 14px SVG
// donut, single arc. Color is success-fg when complete, muted otherwise.

export function DiscoveryArc({
  count,
  total,
  size = 14,
}: {
  count: number;
  total: number;
  size?: number;
}) {
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : Math.max(0, Math.min(1, count / total));
  const offset = c * (1 - pct);
  const isComplete = total > 0 && count >= total;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        className="text-border-subtle"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className={isComplete ? "text-green-400" : "text-text-tertiary"}
      />
    </svg>
  );
}
