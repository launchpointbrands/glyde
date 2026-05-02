"use client";

import { Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import {
  generateCoachingNote,
  type CoachingNote,
} from "@/lib/coaching";

export function CoachingPanel({
  caseId,
  itemKey,
  itemHeadline,
}: {
  caseId: string;
  itemKey: string;
  itemHeadline: string;
}) {
  const [note, setNote] = useState<CoachingNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateCoachingNote({
          caseId,
          itemKey,
          itemHeadline,
        });
        setNote(result);
      } catch (e) {
        console.error("generateCoachingNote failed", e);
        setError("Couldn't generate coaching note. Try again.");
      }
    });
  }

  function close() {
    setNote(null);
    setError(null);
  }

  // Idle: AI-pill trigger
  if (!note && !pending && !error) {
    return (
      <button
        type="button"
        onClick={load}
        className="group/glyde mt-2 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[12px] font-medium text-green-600 transition-[background-color,box-shadow] duration-200 hover:bg-green-100 hover:shadow-[0_0_0_3px_var(--color-green-100)]"
      >
        <Sparkles
          className="h-3.5 w-3.5 text-green-400 transition-transform duration-200 ease-out group-hover/glyde:rotate-[20deg] group-hover/glyde:scale-125"
          aria-hidden
        />
        Ask Glyde →
      </button>
    );
  }

  // Loading (first call, no note yet)
  if (pending && !note) {
    return (
      <div className="mt-3 inline-flex items-center gap-2 text-meta text-text-secondary">
        <Dots />
        Preparing your coaching note...
      </div>
    );
  }

  // Error (no note to show)
  if (error && !note) {
    return (
      <p className="mt-3 text-meta text-danger-fg">
        Couldn&apos;t generate coaching note.{" "}
        <button
          type="button"
          onClick={load}
          className="underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          Try again
        </button>
      </p>
    );
  }

  // Loaded — show panel. If a regenerate is in flight, the old content
  // stays visible and the Regenerate link reads "Regenerating…".
  return (
    <div className="relative mt-3 rounded-md border border-green-100 bg-green-50 p-5">
      <button
        type="button"
        onClick={close}
        aria-label="Close coaching note"
        className="absolute right-3 top-3 text-text-tertiary transition-colors hover:text-text-primary"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="divide-y divide-green-100">
        {/* Opening line — pull-quote treatment */}
        <div className="pb-4">
          <SectionLabel>Opening line</SectionLabel>
          <div className="rounded-[6px] border-l-[3px] border-green-400 bg-bg-card px-[14px] py-[10px]">
            <p className="text-[14px] font-medium leading-[1.5] text-text-primary">
              {note!.opening}
            </p>
          </div>
        </div>

        <div className="py-4">
          <SectionLabel>Why it matters</SectionLabel>
          <p className="text-meta leading-[1.7] text-text-primary">
            {note!.why}
          </p>
        </div>

        <div className="py-4">
          <SectionLabel>What good looks like</SectionLabel>
          <p className="text-meta leading-[1.7] text-text-primary">
            {note!.goodLooks}
          </p>
        </div>

        <div className="pt-4">
          <SectionLabel>Likely objection</SectionLabel>
          <p className="text-meta leading-[1.7] text-text-primary">
            {note!.objection}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={load}
        disabled={pending}
        className="mt-4 text-[12px] text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-60"
      >
        {pending ? "Regenerating…" : "Regenerate"}
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold tracking-[0.06em] text-green-800">
      {children}
    </p>
  );
}

function Dots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 [animation-delay:300ms]" />
    </span>
  );
}
