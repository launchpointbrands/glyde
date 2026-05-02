"use client";

import { X } from "lucide-react";
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

  // Idle: show the trigger link
  if (!note && !pending && !error) {
    return (
      <button
        type="button"
        onClick={load}
        className="mt-2 text-meta font-medium text-green-600 transition-colors hover:text-green-800"
      >
        How to approach this →
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
    <div className="relative mt-3 rounded-md border border-green-100 bg-green-50 px-[18px] py-4">
      <button
        type="button"
        onClick={close}
        aria-label="Close coaching note"
        className="absolute right-3 top-3 text-text-tertiary transition-colors hover:text-text-primary"
      >
        <X className="h-3 w-3" />
      </button>
      <Section label="Opening line">{note!.opening}</Section>
      <Section label={`Why it matters for ${note!.clientName}`}>
        {note!.why}
      </Section>
      <Section label="What good looks like">{note!.goodLooks}</Section>
      <Section label="Likely objection">{note!.objection}</Section>
      <button
        type="button"
        onClick={load}
        disabled={pending}
        className="text-[12px] text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-60"
      >
        {pending ? "Regenerating…" : "Regenerate"}
      </button>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-green-800">
        {label}
      </p>
      <p className="mt-1 text-meta leading-relaxed text-text-primary">
        {children}
      </p>
    </div>
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
