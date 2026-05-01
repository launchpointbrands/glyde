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
      className={
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}
