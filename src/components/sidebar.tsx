import {
  Compass,
  FileText,
  LifeBuoy,
  Settings,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SidebarLink } from "@/components/sidebar-link";

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

  return (
    <aside className="flex w-60 flex-col border-r bg-sidebar">
      <div className="px-5 pt-7 pb-6">
        <p className="font-display text-[20px] leading-none font-medium tracking-tight">
          Glyde
        </p>
        <p className="mt-1.5 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Powered by GlydePath.ai
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 px-5">
        <SidebarLink
          href="/app"
          activeWhen={["/app/cases"]}
          icon={<Users className="h-4 w-4" />}
        >
          Clients
        </SidebarLink>
        <SidebarLink
          href="/app/discovery"
          icon={<Compass className="h-4 w-4" />}
        >
          Discovery
        </SidebarLink>
        <SidebarLink
          href="/app/reports"
          icon={<FileText className="h-4 w-4" />}
        >
          Reports
        </SidebarLink>
      </nav>

      <div className="flex-1" />

      <div className="border-t border-sidebar-border">
        <nav className="flex flex-col gap-0.5 px-5 pt-3">
          <SidebarLink
            href="/app/settings"
            icon={<Settings className="h-4 w-4" />}
          >
            Settings
          </SidebarLink>
          <SidebarLink
            href="/app/help"
            icon={<LifeBuoy className="h-4 w-4" />}
          >
            Help
          </SidebarLink>
        </nav>

        <div className="mx-3 mt-3 mb-3 rounded-md border border-sidebar-border bg-background/50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-medium">{displayName}</p>
            <form action={signOut}>
              <button
                type="submit"
                className="text-[11px] tracking-wide text-muted-foreground hover:text-foreground"
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
