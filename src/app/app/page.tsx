import Link from "next/link";
import { seedDemoCase } from "@/lib/demo";
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
      <main className="flex flex-1 items-center justify-center px-8 py-16">
        <div className="max-w-md space-y-6 text-center">
          <h1 className="font-display text-[36px] leading-tight font-medium tracking-tight">
            Start with a client.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Drop in a business domain and you&apos;ll have valuation, risk,
            and exit-readiness ready before your next meeting with them.
          </p>
          <div className="space-y-3 pt-2">
            <Link
              href="/app/cases/new"
              className="inline-block rounded-md bg-ink-teal px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Add a business
            </Link>
            <form action={seedDemoCase}>
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                or load a demo case to explore.
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-8 pt-9 pb-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              Your book
            </p>
            <h1 className="font-display text-[32px] leading-tight font-medium tracking-tight">
              Clients
            </h1>
          </div>
          <Link
            href="/app/cases/new"
            className="rounded-md bg-ink-teal px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Add a business
          </Link>
        </div>
        <ul className="divide-y border-t border-b">
          {cases.map((c) => {
            const cb = Array.isArray(c.client_business)
              ? c.client_business[0]
              : c.client_business;
            return (
              <li key={c.id}>
                <Link
                  href={`/app/cases/${c.id}`}
                  className="flex items-center justify-between px-2 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">
                      {cb?.business_name ?? "Unknown business"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cb?.domain ?? ""}
                    </p>
                  </div>
                  <p className="ml-4 shrink-0 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                    {c.status.replace("_", " ")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
