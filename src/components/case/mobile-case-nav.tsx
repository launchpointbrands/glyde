"use client";

import {
  BarChart3,
  Compass,
  LayoutGrid,
  Menu,
  ShieldAlert,
  TrendingUp,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Mobile-only chrome for the case detail surface. Top bar (52px, fixed)
// + slide-in panel from the right replace the sidebar and the
// horizontal tab bar below md. Above md, every wrapper carries
// `md:hidden` so the entire component vanishes and the desktop chrome
// (sidebar + horizontal tabs) takes over.

const TAB_DEFS = [
  { slug: "", label: "Overview", icon: LayoutGrid },
  { slug: "/valuation", label: "Valuation", icon: BarChart3 },
  { slug: "/risk", label: "Risk", icon: ShieldAlert },
  { slug: "/wealth", label: "Wealth", icon: TrendingUp },
  { slug: "/succession", label: "Succession", icon: Compass },
] as const;

export function MobileCaseNav({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const base = `/app/cases/${caseId}`;

  const tabs = TAB_DEFS.map((t) => ({ ...t, href: `${base}${t.slug}` }));
  const active =
    tabs.find((t) =>
      t.slug === "" ? pathname === t.href : pathname.startsWith(t.href),
    ) ?? tabs[0];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-[52px] items-center justify-between border-b border-border-subtle bg-bg-card px-4 md:hidden">
        <Image
          src="/brand/glyde-icon.svg"
          alt="Glyde"
          width={28}
          height={28}
          unoptimized
          priority
        />
        <p className="text-body font-medium text-text-primary">{active.label}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="-mr-2 flex h-11 w-11 items-center justify-center text-text-primary"
        >
          <Menu className="h-[22px] w-[22px]" />
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={[
          "fixed top-0 right-0 z-50 h-full w-[280px] bg-bg-card transition-transform duration-200 ease-out md:hidden",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="px-5 pt-4 pb-2 text-[11px] font-medium uppercase tracking-[0.05em] text-text-tertiary">
          Navigation
        </p>
        <nav className="flex flex-col">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active.href === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => setOpen(false)}
                className={[
                  "flex min-h-[48px] items-center gap-3 border-b border-border-subtle px-5 py-3.5 text-body",
                  isActive
                    ? "border-l-[3px] border-l-green-400 bg-green-50 pl-[17px] text-green-800"
                    : "text-text-primary",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-4 w-4 shrink-0",
                    isActive ? "text-green-600" : "text-text-tertiary",
                  ].join(" ")}
                  aria-hidden
                />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
