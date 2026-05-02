// Valuation scale bar — shared between the Overview banner and the
// Valuation page hero. Vivid traffic-light gradient (red → amber → green)
// is intentionally hex-literal so the scale reads at a glance; everything
// else uses CSS custom properties.

function formatUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export function ValuationScaleBar({
  currentEstimate,
}: {
  currentEstimate: number;
}) {
  const SCALE_MAX = 20_000_000;
  const markerPct = Math.min((currentEstimate / SCALE_MAX) * 100, 96);

  return (
    <div className="mt-5 mb-5">
      {/* Track + marker pin */}
      <div className="relative">
        <div
          className="h-2 rounded-[4px]"
          style={{
            background:
              "linear-gradient(to right, #EF4444 0%, #F59E0B 45%, #22C55E 80%, #16A34A 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg-card"
          style={{
            left: `${markerPct}%`,
            border: "2px solid var(--color-text-primary)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
          aria-hidden
        />
      </div>

      {/* Marker label below pin */}
      <div className="relative mt-2 h-4">
        <span
          className="absolute -translate-x-1/2 font-mono text-[11px] tabular-nums text-text-primary"
          style={{ left: `${markerPct}%` }}
        >
          {formatUSD(currentEstimate)}
        </span>
      </div>

      {/* Scale ends */}
      <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums text-text-tertiary">
        <span>$0</span>
        <span>$20M+</span>
      </div>

      {/* Zone labels */}
      <div className="mt-2 grid grid-cols-3 text-[11px] uppercase tracking-[0.05em] text-text-tertiary">
        <span className="text-left">Lower value</span>
        <span className="text-center">Average</span>
        <span className="text-right">Higher value</span>
      </div>
    </div>
  );
}
