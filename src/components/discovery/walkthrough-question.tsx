"use client";

import { Check, Info } from "lucide-react";
import { useState, useTransition } from "react";
import { markSkipped, saveResponse } from "@/lib/discovery";
import { ChoiceCard } from "./choice-card";
import { NaicsCombobox } from "./naics-combobox";

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

  // Multi-select (enum_multi) tracks an array of selected values. Keyed by
  // a JSON string so the same not-while-pending reconciliation guards it
  // against a background save's revalidate clobbering an in-flight toggle.
  const initialMulti = Array.isArray(response?.value)
    ? (response.value as string[])
    : [];
  const initialMultiKey = JSON.stringify(initialMulti);
  const [multiDraft, setMultiDraft] = useState<string[]>(initialMulti);
  const [lastServerMulti, setLastServerMulti] = useState(initialMultiKey);

  // Adopt the server-confirmed value only when no save is in flight, so an
  // earlier save's revalidate can't clobber a selection the advisor just
  // made (which would read as a flicker).
  if (!pending && lastServer !== initial) {
    setLastServer(initial);
    setDraft(initial);
  }
  if (!pending && lastServerMulti !== initialMultiKey) {
    setLastServerMulti(initialMultiKey);
    setMultiDraft(initialMulti);
  }

  const isAnswered = response?.status === "answered";
  const currentValue = isAnswered ? response.value : null;

  function commit(value: string | number | string[] | null) {
    startTransition(() => {
      saveResponse(caseId, field.key, value).catch((e) =>
        console.error("saveResponse failed", e),
      );
    });
  }

  // Optimistic select for tap-to-choose inputs: paint the selection
  // immediately via local `draft`, then persist in the background. Without
  // this the highlight waits on the save + risk re-eval + revalidate round
  // trip, which reads as a laggy click.
  function selectValue(value: string) {
    setDraft(value);
    commit(value);
  }

  // Optimistic toggle for multi-select: update the local array immediately,
  // then persist the whole array in the background.
  function toggleMulti(value: string) {
    const next = multiDraft.includes(value)
      ? multiDraft.filter((v) => v !== value)
      : [...multiDraft, value];
    setMultiDraft(next);
    commit(next);
  }

  function skip() {
    startTransition(() => {
      markSkipped(caseId, field.key).catch((e) =>
        console.error("markSkipped failed", e),
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
              selected={draft === c.value}
              onSelect={() => selectValue(c.value)}
            />
          ))}
        </div>
      )}

      {field.input_type === "enum_multi" && (
        <div className="space-y-2">
          {field.choices?.map((c) => {
            const checked = multiDraft.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleMulti(c.value)}
                aria-pressed={checked}
                className={[
                  "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors",
                  checked
                    ? "border-green-400 bg-green-50"
                    : "border-border-default bg-bg-input hover:border-border-strong",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    checked
                      ? "border-green-400 bg-green-400 text-text-inverse"
                      : "border-border-default",
                  ].join(" ")}
                  aria-hidden
                >
                  {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="text-body text-text-primary">{c.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* NAICS is a free-text field in the schema but gets a searchable
          picker so advisors don't have to know the 6-digit code by heart. */}
      {field.input_type === "text" && field.key === "industry_naics" && (
        <NaicsCombobox
          value={draft || null}
          onSelect={selectValue}
          disabled={pending}
        />
      )}

      {field.input_type === "text" && field.key !== "industry_naics" && (
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
      </div>
    </div>
  );
}
