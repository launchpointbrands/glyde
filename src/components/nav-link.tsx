"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
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
        "relative py-3.5 text-[15px] transition-colors",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-px right-0 left-0 h-[2px] bg-ink-teal" />
      )}
    </Link>
  );
}
