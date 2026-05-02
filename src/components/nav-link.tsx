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
        "relative py-3.5 text-body font-medium transition-colors",
        isActive
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary",
      ].join(" ")}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-px right-0 left-0 h-[2px] bg-green-400" />
      )}
    </Link>
  );
}
