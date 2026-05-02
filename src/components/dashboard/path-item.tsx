"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";
import { CoachingPanel } from "@/components/dashboard/coaching-panel";
import { cyclePathItemStatus } from "@/lib/path";
import type { PathItem } from "@/lib/path-types";

export function PathItemRow({
  caseId,
  item,
}: {
  caseId: string;
  item: PathItem;
}) {
  const [pending, startTransition] = useTransition();

  function cycle() {
    startTransition(() => {
      cyclePathItemStatus(caseId, item.key).catch((e) =>
        console.error("cyclePathItemStatus failed", e),
      );
    });
  }

  const isDone = item.status === "done";

  return (
    <li className="flex items-start gap-4 py-3.5">
      <button
        type="button"
        onClick={cycle}
        disabled={pending}
        aria-label={`Status: ${item.status}. Click to advance.`}
        className="mt-0.5 shrink-0"
      >
        <StatusCircle status={item.status} />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-body leading-snug",
            isDone
              ? "text-text-tertiary line-through"
              : "font-medium text-text-primary",
          ].join(" ")}
        >
          {item.headline}
        </p>
        <p
          className={[
            "mt-1 text-eyebrow uppercase",
            isDone ? "text-text-tertiary/60" : "text-text-tertiary",
          ].join(" ")}
        >
          {item.moduleTag}
        </p>
        {!isDone && (
          <CoachingPanel
            caseId={caseId}
            itemKey={item.key}
            itemHeadline={item.headline}
          />
        )}
      </div>
    </li>
  );
}

function StatusCircle({ status }: { status: PathItem["status"] }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-400 text-text-inverse">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  }
  if (status === "inprogress") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-green-400">
        <span className="h-2 w-2 rounded-full bg-green-400" />
      </span>
    );
  }
  return (
    <span className="block h-5 w-5 rounded-full border-2 border-border-default transition-colors hover:border-green-400" />
  );
}
