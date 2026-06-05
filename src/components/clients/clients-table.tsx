"use client";

import { ChevronRight, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ClientAvatar } from "@/components/clients/client-avatar";
import { deleteCases } from "@/lib/cases";

export type ClientRow = {
  id: string;
  contactPrimary: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  businessName: string;
  domain: string | null;
  revenue: number | null;
  verified: number;
  totalSteps: number;
  readinessScore: number | null;
};

function formatUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function readinessDot(score: number): string {
  if (score < 40) return "bg-danger-fg";
  if (score <= 65) return "bg-warning-fg";
  return "bg-green-400";
}

const CELL_EMAIL = "hidden w-[200px] shrink-0 md:block";
const CELL_BUSINESS = "min-w-0 flex-[1.4]";
const CELL_WEBSITE = "hidden w-[140px] shrink-0 md:block";
const CELL_REVENUE = "hidden w-[100px] shrink-0 md:block";
const CELL_DISCOVERY = "hidden w-[110px] shrink-0 md:block";
const CELL_READINESS = "hidden w-[110px] shrink-0 md:block";

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const allSelected = clients.length > 0 && selected.size === clients.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === clients.length
        ? new Set()
        : new Set(clients.map((c) => c.id)),
    );
  }

  function confirmDelete() {
    const ids = [...selected];
    startTransition(async () => {
      try {
        await deleteCases(ids);
        setSelected(new Set());
        setConfirmOpen(false);
      } catch (e) {
        console.error("deleteCases failed", e);
        setConfirmOpen(false);
      }
    });
  }

  const count = selected.size;

  return (
    <>
      <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-bg-card shadow-card">
        {/* Header — toggles to a selection toolbar when rows are picked. */}
        {count > 0 ? (
          <div className="flex items-center gap-4 border-b border-border-subtle bg-green-50 px-5 py-2.5">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
              ariaLabel="Select all clients"
            />
            <p className="flex-1 text-meta font-medium text-text-primary">
              {count} selected
            </p>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-meta text-text-tertiary transition-colors hover:text-text-primary"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-danger-fg px-3 py-1.5 text-meta font-medium text-text-inverse transition-opacity hover:opacity-90"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-4 border-b border-border-subtle bg-bg-card px-5 py-3 md:flex">
            <Checkbox
              checked={false}
              onChange={toggleAll}
              ariaLabel="Select all clients"
            />
            <p className="min-w-0 flex-1 text-eyebrow uppercase text-text-tertiary">
              Client
            </p>
            <p className={`${CELL_EMAIL} text-eyebrow uppercase text-text-tertiary`}>
              Email
            </p>
            <p className={`${CELL_BUSINESS} text-eyebrow uppercase text-text-tertiary`}>
              Business
            </p>
            <p className={`${CELL_WEBSITE} text-eyebrow uppercase text-text-tertiary`}>
              Website
            </p>
            <p className={`${CELL_REVENUE} text-eyebrow uppercase text-text-tertiary`}>
              Revenue
            </p>
            <p className={`${CELL_DISCOVERY} text-eyebrow uppercase text-text-tertiary`}>
              Discovery
            </p>
            <p className={`${CELL_READINESS} text-eyebrow uppercase text-text-tertiary`}>
              Readiness
            </p>
            <span className="w-4 shrink-0" aria-hidden />
          </div>
        )}

        {clients.map((c) => {
          const isSelected = selected.has(c.id);
          const discoveryComplete = c.verified === c.totalSteps;
          return (
            <div
              key={c.id}
              className={[
                "flex items-center gap-4 border-b border-border-subtle px-5 transition-colors last:border-b-0",
                isSelected ? "bg-green-50" : "hover:bg-bg-hover",
              ].join(" ")}
            >
              <Checkbox
                checked={isSelected}
                onChange={() => toggle(c.id)}
                ariaLabel={`Select ${c.contactPrimary ?? c.businessName}`}
              />
              <Link
                href={`/app/cases/${c.id}`}
                className="flex min-h-[44px] min-w-0 flex-1 items-center gap-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-meta font-semibold text-text-primary">
                    {c.contactPrimary ?? c.businessName}
                  </p>
                  {c.contactPrimary && c.contactTitle && (
                    <p className="truncate text-[12px] text-text-secondary">
                      {c.contactTitle}
                    </p>
                  )}
                </div>
                <p className={`${CELL_EMAIL} truncate text-meta text-text-secondary`}>
                  {c.contactEmail ?? "—"}
                </p>
                <div className={`${CELL_BUSINESS} flex items-center gap-2`}>
                  <ClientAvatar
                    businessName={c.businessName}
                    domain={c.domain}
                    size={20}
                  />
                  <p className="truncate text-meta text-text-primary">
                    {c.businessName}
                  </p>
                </div>
                <p className={`${CELL_WEBSITE} truncate text-meta text-text-tertiary`}>
                  {c.domain ?? "—"}
                </p>
                <p
                  className={`${CELL_REVENUE} truncate font-mono tabular-nums text-meta text-text-primary`}
                >
                  {formatUSD(c.revenue)}
                </p>
                <div className={CELL_DISCOVERY}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${discoveryComplete ? "bg-green-400" : "bg-warning-fg"}`}
                      aria-hidden
                    />
                    <span className="font-mono tabular-nums text-meta text-text-primary">
                      {c.verified} / {c.totalSteps}
                    </span>
                  </span>
                </div>
                <div className={CELL_READINESS}>
                  {c.readinessScore != null ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${readinessDot(c.readinessScore)}`}
                        aria-hidden
                      />
                      <span className="font-mono tabular-nums text-meta text-text-primary">
                        {c.readinessScore} / 100
                      </span>
                    </span>
                  ) : (
                    <span className="text-meta text-text-tertiary">—</span>
                  )}
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-text-tertiary"
                  aria-hidden
                />
              </Link>
            </div>
          );
        })}
      </div>

      {confirmOpen ? (
        <ConfirmDialog
          count={count}
          pending={pending}
          onCancel={() => !pending && setConfirmOpen(false)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </>
  );
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-border-default text-green-400 accent-green-400 focus:ring-green-400"
    />
  );
}

function ConfirmDialog({
  count,
  pending,
  onCancel,
  onConfirm,
}: {
  count: number;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Escape to cancel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const noun = count === 1 ? "client" : "clients";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-[12px] border border-border-subtle bg-bg-card p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="delete-dialog-title"
            className="text-section font-semibold text-text-primary"
          >
            Delete {count} {noun}?
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="-mr-1 -mt-1 text-text-tertiary transition-colors hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-meta text-text-secondary">
          {count === 1 ? "This client" : `These ${count} clients`} and all of
          their discovery, valuation, risk, wealth, and succession analysis
          will be removed from your book. You can&apos;t undo this from the app.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border border-border-default bg-bg-card px-4 py-2 text-meta font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-danger-fg px-4 py-2 text-meta font-medium text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {pending ? "Deleting…" : `Delete ${noun}`}
          </button>
        </div>
      </div>
    </div>
  );
}
