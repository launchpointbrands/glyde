"use client";

import { Check, Pencil } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveResponse } from "@/lib/discovery";

type Choice = { value: string; label: string };

type InputType = "enum_single" | "enum_multi" | "numeric" | "percentage" | "text";

export function EditableValue({
  caseId,
  fieldKey,
  inputType,
  choices,
  value,
  display,
}: {
  caseId: string;
  fieldKey: string;
  inputType: InputType;
  choices: Choice[] | null;
  value: unknown;
  display: string;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState(false);
  const [localValue, setLocalValue] = useState<unknown>(value);
  const [localDisplay, setLocalDisplay] = useState(display);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync from server after revalidation. If the server's value matches
  // our optimistic local value, this is a no-op; if it diverged, server wins.
  useEffect(() => {
    setLocalValue(value);
    setLocalDisplay(display);
  }, [value, display]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  function commit(newValue: string | number | null, newDisplay: string) {
    setLocalValue(newValue);
    setLocalDisplay(newDisplay);
    setEditing(false);
    startTransition(() => {
      saveResponse(caseId, fieldKey, newValue)
        .then(() => {
          setFlash(true);
          if (flashTimer.current) clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setFlash(false), 150);
        })
        .catch((e) => console.error("saveResponse failed", e));
    });
  }

  if (editing) {
    if (inputType === "enum_single" && choices) {
      return (
        <select
          autoFocus
          defaultValue={typeof localValue === "string" ? localValue : ""}
          onChange={(e) => {
            const v = e.target.value;
            const match = choices.find((c) => c.value === v);
            commit(v, match?.label ?? v);
          }}
          onBlur={() => setEditing(false)}
          className="rounded-[6px] border border-green-400 bg-bg-input px-2 py-1 text-meta text-text-primary focus:outline-none focus:ring-[3px] focus:ring-green-50"
        >
          <option value="" disabled>
            Select…
          </option>
          {choices.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      );
    }

    if (inputType === "numeric" || inputType === "percentage") {
      const initial =
        typeof localValue === "number"
          ? String(localValue)
          : typeof localValue === "string"
            ? localValue
            : "";
      return (
        <span className="inline-flex items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            defaultValue={initial}
            min={inputType === "percentage" ? 0 : undefined}
            max={inputType === "percentage" ? 100 : undefined}
            onBlur={(e) => {
              const trimmed = e.target.value.trim();
              if (trimmed === "") {
                setEditing(false);
                return;
              }
              const n = Number(trimmed);
              if (!Number.isFinite(n)) {
                setEditing(false);
                return;
              }
              if (n === Number(localValue)) {
                setEditing(false);
                return;
              }
              commit(n, String(n));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                setEditing(false);
              }
            }}
            className="w-20 rounded-[6px] border border-green-400 bg-bg-input px-2 py-1 text-right text-meta tabular-nums font-mono text-text-primary focus:outline-none focus:ring-[3px] focus:ring-green-50"
          />
          {inputType === "percentage" && (
            <span className="text-meta text-text-tertiary">%</span>
          )}
        </span>
      );
    }

    if (inputType === "text") {
      const initial = typeof localValue === "string" ? localValue : "";
      return (
        <input
          type="text"
          autoFocus
          defaultValue={initial}
          onBlur={(e) => {
            const trimmed = e.target.value.trim();
            if (trimmed === "" || trimmed === initial) {
              setEditing(false);
              return;
            }
            commit(trimmed, trimmed);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setEditing(false);
            }
          }}
          className="rounded-[6px] border border-green-400 bg-bg-input px-2 py-1 text-meta text-text-primary focus:outline-none focus:ring-[3px] focus:ring-green-50"
        />
      );
    }
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-[6px] px-1 py-0.5 text-meta tabular-nums font-mono text-text-primary transition-colors disabled:opacity-60"
    >
      {flash && (
        <Check
          className="h-3.5 w-3.5 text-success-fg"
          strokeWidth={2.5}
          aria-hidden
        />
      )}
      <span>{localDisplay}</span>
      <Pencil
        className="h-3 w-3 text-text-tertiary opacity-0 transition-opacity group-hover/row:opacity-100"
        aria-hidden
      />
    </button>
  );
}
