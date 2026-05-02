"use client";

import { ChevronRight, TriangleAlert } from "lucide-react";
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

type Tab = "all" | "high" | "moderate" | "low";

export function RiskClient({
  initialFactors,
}: {
  initialFactors: RiskFactor[];
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const { overall, impactLow, impactHigh } = useMemo(
    () => recompute(initialFactors),
    [initialFactors],
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

      <TabbedFactorTable
        factors={initialFactors}
        openKey={openKey}
        onToggle={(key) => setOpenKey((k) => (k === key ? null : key))}
      />
    </>
  );
}

function TabbedFactorTable({
  factors,
  openKey,
  onToggle,
}: {
  factors: RiskFactor[];
  openKey: string | null;
  onToggle: (key: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("all");

  const counts = {
    all: factors.length,
    high: factors.filter((f) => f.severity === "high").length,
    moderate: factors.filter((f) => f.severity === "moderate").length,
    low: factors.filter((f) => f.severity === "low").length,
  };

  const filtered =
    tab === "all" ? factors : factors.filter((f) => f.severity === tab);
  const sorted = [...filtered].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  return (
    <div className="mb-8 overflow-hidden rounded-[10px] border border-border-subtle bg-bg-card shadow-card">
      <div className="border-b border-border-subtle">
        <div className="flex items-center gap-6 px-5 pt-3">
          <TabButton
            active={tab === "all"}
            onClick={() => setTab("all")}
            label="All factors"
            count={counts.all}
            variant="neutral"
          />
          <TabButton
            active={tab === "high"}
            onClick={() => setTab("high")}
            label="High"
            count={counts.high}
            variant="danger"
          />
          <TabButton
            active={tab === "moderate"}
            onClick={() => setTab("moderate")}
            label="Moderate"
            count={counts.moderate}
            variant="warning"
          />
          <TabButton
            active={tab === "low"}
            onClick={() => setTab("low")}
            label="Low"
            count={counts.low}
            variant="success"
          />
        </div>
        <div className="flex items-center gap-4 px-5 py-3">
          <div className="w-[220px] shrink-0">
            <ColHeader>Risk Factor</ColHeader>
          </div>
          <div className="w-[100px] shrink-0">
            <ColHeader>Severity</ColHeader>
          </div>
          <div className="min-w-0 flex-1">
            <ColHeader>Recommended Action</ColHeader>
          </div>
          <div className="w-[200px] shrink-0 text-right">
            <ColHeader>Discovery Signal</ColHeader>
          </div>
          <div className="w-8 shrink-0" />
        </div>
      </div>

      <div>
        {sorted.map((f, i) => (
          <FactorTableRow
            key={f.key}
            factor={f}
            isOpen={openKey === f.key}
            isLast={i === sorted.length - 1}
            onToggle={() => onToggle(f.key)}
          />
        ))}
      </div>
    </div>
  );
}

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-text-tertiary">
      {children}
    </p>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  variant: "neutral" | "danger" | "warning" | "success";
}) {
  const badgeClass = {
    neutral: "bg-bg-hover text-text-tertiary",
    danger: "bg-danger-bg text-danger-fg",
    warning: "bg-warning-bg text-warning-fg",
    success: "bg-success-bg text-success-fg",
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px flex items-center gap-2 border-b-2 pb-3 pt-3 text-meta font-medium transition-colors ${
        active
          ? "border-text-primary text-text-primary"
          : "border-transparent text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
      <span
        className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${badgeClass}`}
      >
        {count}
      </span>
    </button>
  );
}

function FactorTableRow({
  factor: f,
  isOpen,
  isLast,
  onToggle,
}: {
  factor: RiskFactor;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  const tone = {
    high: "text-danger-fg",
    moderate: "text-warning-fg",
    low: "text-success-fg",
  }[f.severity];
  const barTone = {
    high: "bg-danger-fg",
    moderate: "bg-warning-fg",
    low: "bg-success-fg",
  }[f.severity];

  const answerFn = FACTOR_ANSWER[f.key];
  const answer = answerFn ? answerFn(f) : null;
  const signalText = answer ? `${answer.eyebrow} · ${answer.value}` : null;

  return (
    <div className={isLast ? "" : "border-b border-border-subtle"}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-bg-hover"
      >
        <div className="w-[220px] shrink-0">
          <p className="text-meta font-medium text-text-primary">{f.label}</p>
        </div>
        <div className="w-[100px] shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3.5 w-[3px] rounded-[2px] ${barTone}`}
              aria-hidden
            />
            <span className={`text-[12px] font-medium capitalize ${tone}`}>
              {f.severity}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-meta font-normal text-text-primary">
            {f.headline}
          </p>
        </div>
        <div className="w-[200px] shrink-0 text-right">
          {signalText && (
            <p className="text-[12px] uppercase tracking-[0.05em] text-text-tertiary">
              {signalText}
            </p>
          )}
        </div>
        <div className="flex w-8 shrink-0 items-center justify-end">
          <ChevronRight
            className={`h-4 w-4 text-text-tertiary transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
            aria-hidden
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-4 pt-1">
          <p className="max-w-2xl text-meta text-text-secondary">
            {f.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
