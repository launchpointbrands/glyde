"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarLink({
  href,
  activeWhen,
  children,
}: {
  href: string;
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
        "rounded-md px-2 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
