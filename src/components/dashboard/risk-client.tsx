"use client";

import { ChevronDown, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { SeverityHero } from "./severity-hero";
import type { Severity } from "./severity-pill";

export type RiskFactor = {
  key: string;
  label: string;
  severity: Severity;
  headline: string;
  explanation: string;
  source_field: string | null;
  source_value: unknown;
  computed_value: unknown;
};

const SEVERITY_ORDER: Severity[] = ["high", "moderate", "low"];

function nextSeverity(s: Severity): Severity {
  const i = SEVERITY_ORDER.indexOf(s);
  return SEVERITY_ORDER[(i + 1) % SEVERITY_ORDER.length];
}

function recompute(factors: RiskFactor[]): {
  overall: Severity;
  impactLow: number;
  impactHigh: number;
} {
  const highs = factors.filter((f) => f.severity === "high").length;
  const mods = factors.filter((f) => f.severity === "moderate").length;
  const overall: Severity =
    highs >= 2 ? "high" : highs >= 1 || mods >= 3 ? "moderate" : "low";
  const impactLow = highs * 2.5 + mods * 1;
  const impactHigh = highs * 3.5 + mods * 1.5;
  return { overall, impactLow, impactHigh };
}

function projectionSentence(s: Severity): string {
  const next = nextSeverity(s);
  if (next === "low") return "Moving this to low would lift value by ~2-3%.";
  if (next === "moderate")
    return "Bringing this to moderate would lift value by ~1-2%.";
  return "Letting this drift to high would cost ~2-3% of value.";
}

// Per-factor discovery-answer presentation. The signal that drove the
// severity is shown on each row as a small uppercase eyebrow + value.
type FactorAnswer = { eyebrow: string; value: string };

function formatLikelihood(v: unknown): string {
  const map: Record<string, string> = {
    very_unlikely: "Very unlikely",
    unlikely: "Unlikely",
    neutral: "Neutral",
    likely: "Likely",
    very_likely: "Very likely",
  };
  return typeof v === "string" ? (map[v] ?? v) : "—";
}

function formatPctRange(v: unknown): string {
  if (typeof v !== "string") return "—";
  const map: Record<string, string> = {
    "0_10": "0-10%",
    "11_25": "11-25%",
    "26_50": "26-50%",
    "51_75": "51-75%",
    "76_100": "76-100%",
  };
  return map[v] ?? v;
}

const FACTOR_ANSWER: Record<string, (f: RiskFactor) => FactorAnswer> = {
  owner_dependency: (f) => ({
    eyebrow: "Owner departure",
    value: formatLikelihood(f.source_value),
  }),
  key_employee_dependency: (f) => ({
    eyebrow: "Key employee",
    value: formatLikelihood(f.source_value),
  }),
  customer_concentration: (f) => ({
    eyebrow: "Top 2 customers",
    value: `${formatPctRange(f.source_value)} of revenue`,
  }),
  supplier_diversity: (f) => ({
    eyebrow: "Top vendor",
    value:
      typeof f.source_value === "number"
        ? `${f.source_value}% of revenue`
        : "—",
  }),
  liquidity: () => ({
    eyebrow: "NWC",
    value: "$1.0M (computed)",
  }),
  financial_practice: (f) => ({
    eyebrow: "Records manager",
    value:
      typeof f.source_value === "string"
        ? f.source_value
            .split("_")
            .map((s) => (s === "and" ? "&" : s.charAt(0).toUpperCase() + s.slice(1)))
            .join(" ")
        : "—",
  }),
  revenue_quality: (f) => ({
    eyebrow: "Recurring",
    value:
      typeof f.source_value === "number"
        ? `${f.source_value}% of revenue`
        : "—",
  }),
  leverage: (f) => ({
    eyebrow: "Debt-to-equity",
    value:
      typeof f.computed_value === "string"
        ? f.computed_value
        : typeof f.computed_value === "number"
          ? String(f.computed_value)
          : "—",
  }),
};

export function RiskClient({
  initialFactors,
}: {
  initialFactors: RiskFactor[];
}) {
  const [factors, setFactors] = useState<RiskFactor[]>(initialFactors);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const { overall, impactLow, impactHigh } = useMemo(
    () => recompute(factors),
    [factors],
  );

  function cycle(key: string) {
    setFactors((prev) =>
      prev.map((f) =>
        f.key === key ? { ...f, severity: nextSeverity(f.severity) } : f,
      ),
    );
  }

  const tier = (s: Severity) => SEVERITY_ORDER.indexOf(s);
  const sorted = [...factors].sort(
    (a, b) => tier(a.severity) - tier(b.severity),
  );

  return (
    <>
      {/* Score block */}
      <section className="pb-10">
        <h2 className="text-section font-medium text-text-primary">
          Business risk score
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
          <div>
            <p className="text-meta text-text-secondary">
              Business risk score
            </p>
            <div className="mt-2">
              <SeverityHero severity={overall} size="lg" />
            </div>
          </div>
          <div>
            <p className="text-meta text-text-secondary">
              Estimated impact of risk on value
            </p>
            <p className="mt-2 inline-flex items-center gap-3 text-display font-light leading-none text-text-primary tabular-nums font-mono">
              <TriangleAlert
                className="h-7 w-7 -rotate-180 fill-danger-fg text-danger-fg"
                aria-hidden
              />
              {impactLow.toFixed(0)}-{impactHigh.toFixed(0)}%
            </p>
          </div>
        </div>
      </section>

      {/* Component risk factors */}
      <section>
        <h2 className="text-section font-medium text-text-primary">
          Component business risk factors
        </h2>
        <div className="mt-6 divide-y">
          {sorted.map((f) => (
            <FactorRow
              key={f.key}
              factor={f}
              isOpen={openKey === f.key}
              onToggle={() =>
                setOpenKey((k) => (k === f.key ? null : f.key))
              }
              onCycleSeverity={() => cycle(f.key)}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function FactorRow({
  factor: f,
  isOpen,
  onToggle,
  onCycleSeverity,
}: {
  factor: RiskFactor;
  isOpen: boolean;
  onToggle: () => void;
  onCycleSeverity: () => void;
}) {
  const answerFn = FACTOR_ANSWER[f.key];
  const answer = answerFn ? answerFn(f) : null;

  return (
    <div className="py-7">
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-1 items-start gap-6 text-left md:grid-cols-[260px_1fr_auto] md:gap-12"
      >
        <div>
          <p className="text-meta font-medium text-text-primary">{f.label}</p>
          <div className="mt-2">
            <SeverityHero severity={f.severity} size="md" />
          </div>
        </div>
        <div>
          <p className="text-body font-medium text-text-primary">{f.headline}</p>
          <p className="mt-2 text-body text-text-secondary">{f.explanation}</p>
          {answer && (
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-eyebrow text-text-tertiary uppercase">
                {answer.eyebrow}
              </span>
              <span className="text-meta text-text-primary">{answer.value}</span>
            </div>
          )}
        </div>
        <ChevronDown
          className={`mt-1 hidden h-4 w-4 shrink-0 text-text-secondary transition-transform md:block ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className="mt-5 ml-0 max-w-2xl rounded-md border border-border-subtle bg-bg-hover px-5 py-4 md:ml-[272px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={onCycleSeverity}
              className="rounded-md border border-border-default bg-bg-card px-3 py-1 text-meta text-text-primary transition-colors hover:bg-bg-hover"
            >
              Adjust severity →{" "}
              <span className="font-medium capitalize">
                {nextSeverity(f.severity)}
              </span>
            </button>
            <p className="text-meta text-text-secondary">
              {projectionSentence(f.severity)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
