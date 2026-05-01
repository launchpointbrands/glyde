import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CasesPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select(
      "id, status, created_at, client_business:client_businesses(business_name, domain)",
    )
    .order("created_at", { ascending: false });

  if (!cases || cases.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-8">
        <div className="max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-medium">Start with a client.</h1>
          <p className="text-sm text-muted-foreground">
            Drop in a business domain and you&apos;ll have valuation, risk,
            and exit-readiness ready before your next meeting with them.
          </p>
          <Link
            href="/app/cases/new"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Add a business
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-xl font-medium">Cases</h1>
          <Link
            href="/app/cases/new"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            New case
          </Link>
        </div>
        <ul className="border-t border-b divide-y">
          {cases.map((c) => {
            const cb = Array.isArray(c.client_business)
              ? c.client_business[0]
              : c.client_business;
            return (
              <li key={c.id}>
                <Link
                  href={`/app/cases/${c.id}`}
                  className="flex items-baseline justify-between px-2 py-3 hover:bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {cb?.business_name ?? "Unknown business"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cb?.domain ?? ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.status}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
