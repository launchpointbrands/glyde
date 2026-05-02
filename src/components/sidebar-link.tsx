"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SidebarLink({
  href,
  icon,
  activeWhen,
  children,
}: {
  href: string;
  icon: ReactNode;
  activeWhen?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (activeWhen?.some((prefix) => pathname.startsWith(prefix)) ?? false);

  return (
    <Link
      href={href}
      className={[
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-meta font-medium transition-colors",
        isActive
          ? "bg-green-50 text-green-800"
          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-4 w-4 shrink-0 items-center justify-center transition-colors",
          isActive ? "text-green-400" : "text-text-tertiary",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="truncate whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
        {children}
      </span>
    </Link>
  );
}
