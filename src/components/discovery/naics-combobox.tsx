"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { naicsLabel, searchNaics } from "@/lib/naics";

// Searchable NAICS picker. Type to filter by code or industry name; click
// or press Enter to select. Selection is reported as the 6-digit code via
// onSelect so the caller can optimistically highlight + save it.

export function NaicsCombobox({
  value,
  onSelect,
  disabled,
}: {
  value: string | null;
  onSelect: (code: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedLabel = naicsLabel(value);
  // When closed, show the selected label; when open, show what's being typed.
  const inputValue = open ? query : selectedLabel;
  const results = searchNaics(open ? query : "");

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function choose(code: string) {
    onSelect(code);
    setQuery("");
    setOpen(false);
  }

  function openWith(text: string) {
    setQuery(text);
    setActive(0);
    setOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      openWith("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[active];
      if (pick) choose(pick.code);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-[440px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="naics-listbox"
          autoComplete="off"
          disabled={disabled}
          value={inputValue}
          placeholder="Search by industry or code…"
          onChange={(e) => openWith(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full rounded-md border border-border-default bg-bg-input py-3 pl-10 pr-9 text-body text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50"
        />
        <ChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </div>

      {open && (
        <ul
          id="naics-listbox"
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-[280px] w-full overflow-y-auto rounded-md border border-border-subtle bg-bg-card py-1 shadow-card"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-meta text-text-tertiary">
              No matching industries. Try a different term.
            </li>
          ) : (
            results.map((n, i) => {
              const isSelected = n.code === value;
              const isActive = i === active;
              return (
                <li key={n.code} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    // onMouseDown (not onClick) so selection fires before the
                    // input's blur/outside-click handler closes the list.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(n.code);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={[
                      "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                      isActive ? "bg-green-50" : "",
                    ].join(" ")}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-meta text-text-primary">
                        {n.title}
                      </span>
                      <span className="block font-mono text-[11px] tabular-nums text-text-tertiary">
                        {n.code}
                      </span>
                    </span>
                    <Check
                      className={`h-4 w-4 shrink-0 ${isSelected ? "text-green-600" : "text-transparent"}`}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
