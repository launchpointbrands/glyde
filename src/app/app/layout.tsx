import Link from "next/link";
import { redirect } from "next/navigation";
import { NavLink } from "@/components/nav-link";
import { signOut } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/app"
            className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground"
          >
            Glyde
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <NavLink href="/app" activeWhen={["/app/cases"]}>
              Cases
            </NavLink>
            <NavLink href="/app/settings">Settings</NavLink>
          </nav>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
