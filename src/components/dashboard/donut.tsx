// Score-circle donut. Track is subtle; arc is green-400. Number rendered
// in DM Mono per DESIGN.md (all financial / score figures use --font-data).

export function Donut({
  value,
  label,
  size = 120,
  stroke = 10,
}: {
  value: number;
  label?: string;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const numberSize = Math.round(size * 0.32);
  const captionSize = Math.max(10, Math.round(size * 0.085));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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
          className="text-green-400 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-light leading-none tabular-nums text-text-primary"
          style={{ fontSize: numberSize }}
        >
          {Math.round(clamped)}
        </span>
        {label && (
          <span
            className="mt-1 text-text-tertiary"
            style={{ fontSize: captionSize }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
