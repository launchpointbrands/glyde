"use client";

import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import {
  clearResponse,
  markSkipped,
  markUnknown,
  saveResponse,
  verifyResponse,
} from "@/lib/discovery";
import { FIELD_TO_STEP } from "@/lib/discovery-walkthrough";
import { StatusPill, type PillState } from "./status-pill";

export type DiscoveryField = {
  key: string;
  label: string;
  help_text: string | null;
  input_type: "enum_single" | "enum_multi" | "numeric" | "percentage" | "text";
  choices: { value: string; label: string }[] | null;
  module: string;
  display_order: number;
};

export type DiscoveryResponse = {
  field_key: string;
  value: unknown;
  source: "simulated" | "advisor" | "client" | "valuation_api";
  status: "answered" | "skipped" | "unknown";
};

function pillState(r: DiscoveryResponse | undefined): PillState | null {
  if (!r) return null;
  if (r.status === "skipped") return "skipped";
  if (r.status === "unknown") return "follow_up";
  return r.source === "simulated" ? "simulated" : "verified";
}

function valueAsString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return "";
}

const fieldInputClass =
  "rounded-md border border-border-default bg-bg-input px-2.5 py-1.5 text-meta text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50";

export function DiscoveryRow({
  caseId,
  field,
  response,
}: {
  caseId: string;
  field: DiscoveryField;
  response: DiscoveryResponse | undefined;
}) {
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initialString = valueAsString(response?.value);
  const [draft, setDraft] = useState(initialString);
  const [lastServerValue, setLastServerValue] = useState(initialString);

  if (lastServerValue !== initialString) {
    setLastServerValue(initialString);
    setDraft(initialString);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const state = pillState(response);
  const hasValue = response && response.status === "answered";
  const isSimulated = response?.source === "simulated" && hasValue;

  function commit(value: string | number | null) {
    startTransition(() => {
      saveResponse(caseId, field.key, value).catch((err) =>
        console.error("saveResponse failed", err),
      );
    });
  }

  function handleEnumChange(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setDraft(v);
    if (v === "") return;
    commit(v);
  }

  function handleTextBlur() {
    const trimmed = draft.trim();
    const original = valueAsString(response?.value);
    if (trimmed === original && response?.status === "answered") return;
    if (trimmed === "") return;
    commit(trimmed);
  }

  function handleNumberBlur() {
    const trimmed = draft.trim();
    if (trimmed === "") return;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;
    if (response?.status === "answered" && response.value === n) return;
    commit(n);
  }

  function runMenuAction(fn: () => Promise<void>) {
    setMenuOpen(false);
    startTransition(() => {
      fn().catch((err) => console.error("menu action failed", err));
    });
  }

  const stepNumber = FIELD_TO_STEP[field.key];
  const walkthroughHref = stepNumber
    ? `/app/cases/${caseId}/discovery/walkthrough?step=${stepNumber}`
    : null;

  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div className="group min-w-0 max-w-md">
        {walkthroughHref ? (
          <Link
            href={walkthroughHref}
            className="block focus:outline-none"
            title="Open in walkthrough"
          >
            <span className="inline-flex items-center gap-1.5 text-meta font-medium text-text-primary transition-colors group-hover:text-green-600">
              {field.label}
              <ArrowUpRight
                className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </span>
            {field.help_text && (
              <p className="mt-1 text-meta text-text-tertiary">
                {field.help_text}
              </p>
            )}
          </Link>
        ) : (
          <>
            <label
              htmlFor={`field-${field.key}`}
              className="text-meta font-medium text-text-primary"
            >
              {field.label}
            </label>
            {field.help_text && (
              <p className="mt-1 text-meta text-text-tertiary">
                {field.help_text}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {field.input_type === "enum_single" && (
          <select
            id={`field-${field.key}`}
            value={draft}
            onChange={handleEnumChange}
            disabled={pending}
            className={`${fieldInputClass} w-56`}
          >
            <option value="" disabled>
              Select…
            </option>
            {field.choices?.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}

        {field.input_type === "text" && (
          <input
            id={`field-${field.key}`}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleTextBlur}
            disabled={pending}
            className={`${fieldInputClass} w-56`}
          />
        )}

        {(field.input_type === "numeric" ||
          field.input_type === "percentage") && (
          <div className="flex items-center gap-1.5">
            <input
              id={`field-${field.key}`}
              type="number"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleNumberBlur}
              disabled={pending}
              min={field.input_type === "percentage" ? 0 : undefined}
              max={field.input_type === "percentage" ? 100 : undefined}
              className={`${fieldInputClass} w-28 text-right font-mono`}
            />
            {field.input_type === "percentage" && (
              <span className="text-meta text-text-tertiary">%</span>
            )}
          </div>
        )}

        <div className="w-20 text-right">
          {state && <StatusPill state={state} />}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Field actions"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 z-10 mt-1 w-44 overflow-hidden rounded-md border border-border-subtle bg-bg-card py-1 text-meta shadow-card">
              {isSimulated && (
                <MenuItem
                  onClick={() =>
                    runMenuAction(() => verifyResponse(caseId, field.key))
                  }
                >
                  Verify as-is
                </MenuItem>
              )}
              <MenuItem
                onClick={() =>
                  runMenuAction(() => markSkipped(caseId, field.key))
                }
              >
                Skip for now
              </MenuItem>
              <MenuItem
                onClick={() =>
                  runMenuAction(() => markUnknown(caseId, field.key))
                }
              >
                Flag for follow-up
              </MenuItem>
              {response && (
                <MenuItem
                  onClick={() =>
                    runMenuAction(() => clearResponse(caseId, field.key))
                  }
                  destructive
                >
                  Clear
                </MenuItem>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3 py-1.5 text-left transition-colors hover:bg-bg-hover ${
        destructive ? "text-danger-fg" : "text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
