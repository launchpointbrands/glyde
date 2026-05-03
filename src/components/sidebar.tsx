import { Users } from "lucide-react";
import Image from "next/image";
import { signOut } from "@/lib/auth";
import { InviteButton } from "@/components/invite-button";
import { SidebarLink } from "@/components/sidebar-link";
import { createClient } from "@/lib/supabase/server";

// Notion / Linear-style hover-to-expand rail. Fixed-position, overlays
// content on hover. Outer named group is `sidebar` so children can
// gate visibility via `group-hover/sidebar:`.

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: advisor } = user
    ? await supabase
        .from("advisors")
        .select("full_name, email")
        .eq("id", user.id)
        .single()
    : { data: null };

  const displayName =
    advisor?.full_name ?? advisor?.email ?? user?.email ?? "—";
  const initial =
    displayName && displayName !== "—"
      ? displayName.trim()[0]?.toUpperCase()
      : "?";

  return (
    <aside className="group/sidebar fixed inset-y-0 left-0 z-30 hidden w-14 flex-col overflow-hidden border-r border-border-subtle bg-bg-sidebar transition-[width] duration-150 ease-out hover:w-[220px] md:flex">
      {/* Brand: icon (collapsed) crossfades to wordmark (expanded). */}
      <div className="relative flex h-12 items-center px-3 pt-6 pb-5">
        <Image
          src="/brand/glyde-icon.svg"
          alt="Glyde"
          width={32}
          height={32}
          unoptimized
          priority
          className="h-8 w-8 transition-opacity duration-150 group-hover/sidebar:opacity-0"
        />
        <Image
          src="/brand/glyde-wordmark.svg"
          alt="Glyde"
          width={170}
          height={32}
          unoptimized
          priority
          className="absolute top-1/2 left-3 h-8 w-auto -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100"
        />
      </div>

      <nav className="mt-4 flex flex-col gap-0.5 px-2">
        <SidebarLink
          href="/app"
          activeWhen={["/app/cases"]}
          icon={<Users className="h-4 w-4" />}
        >
          Clients
        </SidebarLink>
      </nav>

      <div className="flex-1" />

      <div className="border-t border-border-subtle px-3 py-3">
        <InviteButton />
      </div>

      <div className="border-t border-border-subtle px-3 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-hover text-meta font-medium text-text-primary">
            {initial}
          </span>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
            <p className="truncate text-meta font-medium text-text-primary">
              {displayName}
            </p>
            <form action={signOut}>
              <button
                type="submit"
                className="text-eyebrow text-text-tertiary transition-colors hover:text-text-primary"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
