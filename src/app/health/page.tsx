import { createClient } from "@/lib/supabase/server";

// Temporary: a smoke test that the Supabase wiring is correct.
// Removed in step 5 when /app routes replace it.
export default async function HealthPage() {
  const supabase = await createClient();
  const { error } = await supabase.from("_glyde_health").select("*").limit(0);

  // PostgREST returns 42P01 (undefined_table) if it can reach Postgres
  // but the relation doesn't exist. That's the green signal here:
  // DNS resolved, TLS up, anon key accepted, query parsed.
  const ok = error?.code === "42P01";

  return (
    <main className="flex flex-1 items-center justify-center px-8">
      <pre className="font-mono text-sm">
        supabase:{" "}
        {ok ? "reachable" : `unexpected — ${error?.message ?? "no error"}`}
      </pre>
    </main>
  );
}
