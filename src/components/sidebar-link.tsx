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
        "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
        isActive
          ? "bg-sidebar-accent text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
      ].join(" ")}
    >
      {isActive && (
        <span className="absolute top-1.5 bottom-1.5 -left-3 w-[2px] rounded-r bg-ink-teal" />
      )}
      <span
        className={[
          "flex h-4 w-4 shrink-0 items-center justify-center",
          isActive ? "text-foreground" : "text-muted-foreground",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}
