import { signOut } from "@/lib/auth";
import { seedDemoCase } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: advisor } = await supabase
    .from("advisors")
    .select("full_name, email, role, firm_id")
    .eq("id", user!.id)
    .single();

  const { data: firm } = advisor?.firm_id
    ? await supabase
        .from("firms")
        .select("name")
        .eq("id", advisor.firm_id)
        .single()
    : { data: null };

  return (
    <main className="flex flex-1 items-start justify-center px-6 py-8">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-xl font-medium">Settings</h1>
        <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{advisor?.full_name ?? "—"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{advisor?.email ?? user?.email ?? "—"}</dd>
          <dt className="text-muted-foreground">Firm</dt>
          <dd>{firm?.name ?? "—"}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd>{advisor?.role ?? "—"}</dd>
        </dl>
        <div className="flex items-center gap-3 pt-2">
          <form action={seedDemoCase}>
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted/30"
            >
              Load demo case
            </button>
          </form>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm hover:bg-muted/30"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
