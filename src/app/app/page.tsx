import { createClient } from "@/lib/supabase/server";

export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The signup trigger should have created this advisors row.
  // RLS lets the user see only their own row.
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
    <main className="flex flex-1 items-center justify-center px-8">
      <div className="max-w-md space-y-3 text-center">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Welcome
        </p>
        <h1 className="text-2xl font-medium">
          {advisor?.full_name ?? user!.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          {firm?.name ?? "—"} · {advisor?.role ?? "—"}
        </p>
      </div>
    </main>
  );
}
