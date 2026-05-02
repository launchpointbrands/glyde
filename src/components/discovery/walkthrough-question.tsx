"use client";

import { Info } from "lucide-react";
import { useState, useTransition } from "react";
import {
  markSkipped,
  markUnknown,
  saveResponse,
} from "@/lib/discovery";
import { ChoiceCard } from "./choice-card";

type Field = {
  key: string;
  label: string;
  help_text: string | null;
  input_type: "enum_single" | "enum_multi" | "numeric" | "percentage" | "text";
  choices: { value: string; label: string }[] | null;
};

type Response = {
  value: unknown;
  source: "simulated" | "advisor" | "client" | "valuation_api";
  status: "answered" | "skipped" | "unknown";
};

function valueAsString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

const inputClass =
  "w-full rounded-md border border-border-default bg-bg-input px-4 py-3 text-body text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50";

export function WalkthroughQuestion({
  caseId,
  field,
  response,
  tooltip,
}: {
  caseId: string;
  field: Field;
  response: Response | undefined;
  tooltip?: string;
}) {
  const [pending, startTransition] = useTransition();
  const initial = valueAsString(response?.value);
  const [draft, setDraft] = useState(initial);
  const [lastServer, setLastServer] = useState(initial);

  if (lastServer !== initial) {
    setLastServer(initial);
    setDraft(initial);
  }

  const isAnswered = response?.status === "answered";
  const currentValue = isAnswered ? response.value : null;

  function commit(value: string | number | null) {
    startTransition(() => {
      saveResponse(caseId, field.key, value).catch((e) =>
        console.error("saveResponse failed", e),
      );
    });
  }

  function skip() {
    startTransition(() => {
      markSkipped(caseId, field.key).catch((e) =>
        console.error("markSkipped failed", e),
      );
    });
  }

  function unknown() {
    startTransition(() => {
      markUnknown(caseId, field.key).catch((e) =>
        console.error("markUnknown failed", e),
      );
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-page font-semibold leading-snug text-text-primary">
          {field.label}
          {tooltip && (
            <span className="group/tip relative ml-2 inline-flex align-middle">
              <button
                type="button"
                aria-label="What does this mean?"
                className="flex h-5 w-5 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-text-secondary focus:outline-none focus-visible:text-text-secondary"
              >
                <Info className="h-4 w-4" aria-hidden />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute top-full left-0 z-20 mt-2 w-72 rounded-md border border-border-subtle bg-bg-card px-3.5 py-3 text-meta leading-relaxed text-text-secondary opacity-0 shadow-card transition-opacity duration-100 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
              >
                {tooltip}
              </span>
            </span>
          )}
        </h2>
        {field.help_text && (
          <p className="mt-1.5 text-meta text-text-secondary">
            {field.help_text}
          </p>
        )}
      </div>

      {field.input_type === "enum_single" && (
        <div className="space-y-2">
          {field.choices?.map((c) => (
            <ChoiceCard
              key={c.value}
              label={c.label}
              selected={currentValue === c.value}
              disabled={pending}
              onSelect={() => commit(c.value)}
            />
          ))}
        </div>
      )}

      {field.input_type === "text" && (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const trimmed = draft.trim();
            if (trimmed === "" || trimmed === valueAsString(currentValue))
              return;
            commit(trimmed);
          }}
          disabled={pending}
          className={inputClass}
        />
      )}

      {(field.input_type === "numeric" ||
        field.input_type === "percentage") && (
        <div className="relative w-44">
          <input
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const trimmed = draft.trim();
              if (trimmed === "") return;
              const n = Number(trimmed);
              if (!Number.isFinite(n)) return;
              if (currentValue === n) return;
              commit(n);
            }}
            disabled={pending}
            min={field.input_type === "percentage" ? 0 : undefined}
            max={field.input_type === "percentage" ? 100 : undefined}
            className={`${inputClass} font-mono pr-10`}
          />
          {field.input_type === "percentage" && (
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-meta text-text-tertiary">
              %
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-5 pt-1 text-meta">
        <button
          type="button"
          onClick={skip}
          disabled={pending}
          className={[
            "underline-offset-4 transition-colors hover:underline",
            response?.status === "skipped"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-primary",
          ].join(" ")}
        >
          {response?.status === "skipped" ? "Skipped" : "Skip for now"}
        </button>
        <button
          type="button"
          onClick={unknown}
          disabled={pending}
          className={[
            "underline-offset-4 transition-colors hover:underline",
            response?.status === "unknown"
              ? "text-danger-fg"
              : "text-text-tertiary hover:text-text-primary",
          ].join(" ")}
        >
          {response?.status === "unknown"
            ? "Flagged for follow-up"
            : "I don't know yet"}
        </button>
      </div>
    </div>
  );
}
