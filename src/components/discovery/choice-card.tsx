"use client";

import { Check } from "lucide-react";

export function ChoiceCard({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        "group flex w-full items-center justify-between rounded-md border px-5 py-4 text-left transition-colors",
        selected
          ? "border-green-400 bg-green-50 text-green-800"
          : "border-border-subtle bg-bg-card hover:border-border-default",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <span
        className={[
          "text-body",
          selected ? "font-medium text-green-800" : "text-text-primary",
        ].join(" ")}
      >
        {label}
      </span>
      <Check
        className={[
          "h-4 w-4 shrink-0",
          selected ? "text-green-600" : "text-transparent",
        ].join(" ")}
        aria-hidden
      />
    </button>
  );
}
