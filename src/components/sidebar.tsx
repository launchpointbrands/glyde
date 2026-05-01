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

  const displayName = advisor?.full_name ?? advisor?.email ?? user?.email ?? "—";

  return (
    <aside className="flex w-56 flex-col border-r">
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Glyde
        </p>
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        <SidebarLink href="/app" activeWhen={["/app/cases"]}>
          Clients
        </SidebarLink>
        <SidebarLink href="/app/discovery">Discovery</SidebarLink>
        <SidebarLink href="/app/reports">Reports</SidebarLink>
      </nav>

      <div className="flex-1" />

      <div className="border-t">
        <nav className="flex flex-col gap-0.5 px-3 pt-3">
          <SidebarLink href="/app/settings">Settings</SidebarLink>
          <SidebarLink href="/app/help">Help</SidebarLink>
        </nav>
        <div className="mt-2 flex items-center justify-between gap-2 px-5 pt-2 pb-4">
          <p className="truncate text-sm">{displayName}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
