"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";
import { toggleReadinessItem } from "@/lib/readiness";

export type ReadinessItem = {
  item_key: string;
  label: string;
  is_complete: boolean;
};

export function ReadinessChecklist({
  caseId,
  items,
}: {
  caseId: string;
  items: ReadinessItem[];
}) {
  const [pending, startTransition] = useTransition();

  function toggle(item: ReadinessItem) {
    startTransition(() => {
      toggleReadinessItem(caseId, item.item_key, !item.is_complete).catch(
        (e) => console.error("toggleReadinessItem failed", e),
      );
    });
  }

  return (
    <ul className="divide-y">
      {items.map((it) => (
        <li key={it.item_key}>
          <button
            type="button"
            onClick={() => toggle(it)}
            disabled={pending}
            className="flex w-full items-center gap-3 py-3 text-left hover:bg-bg-hover"
          >
            <span
              className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                it.is_complete
                  ? "border-green-400 bg-green-400 text-text-inverse"
                  : "border-border-default",
              ].join(" ")}
              aria-hidden
            >
              {it.is_complete && <Check className="h-3 w-3" />}
            </span>
            <span
              className={[
                "text-meta",
                it.is_complete
                  ? "text-text-secondary line-through"
                  : "text-foreground",
              ].join(" ")}
            >
              {it.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
