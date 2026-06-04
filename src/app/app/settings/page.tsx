import Link from "next/link";
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

  const isFirmAdmin = advisor?.role === "firm_admin";

  const { data: firm } = advisor?.firm_id
    ? await supabase
        .from("firms")
        .select("name")
        .eq("id", advisor.firm_id)
        .single()
    : { data: null };

  return (
    <main className="flex flex-1 items-start justify-center px-10 py-10">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-page font-semibold text-text-primary">Settings</h1>
        <dl className="grid grid-cols-[120px_1fr] gap-y-3 rounded-[10px] border border-border-subtle bg-bg-card px-6 py-5 text-meta shadow-card">
          <dt className="text-text-tertiary">Name</dt>
          <dd className="text-text-primary">{advisor?.full_name ?? "—"}</dd>
          <dt className="text-text-tertiary">Email</dt>
          <dd className="text-text-primary">
            {advisor?.email ?? user?.email ?? "—"}
          </dd>
          <dt className="text-text-tertiary">Firm</dt>
          <dd className="text-text-primary">{firm?.name ?? "—"}</dd>
          <dt className="text-text-tertiary">Role</dt>
          <dd className="text-text-primary">{advisor?.role ?? "—"}</dd>
        </dl>
        {isFirmAdmin ? (
          <Link
            href="/app/settings/branding"
            className="flex items-center justify-between rounded-[10px] border border-border-subtle bg-bg-card px-6 py-4 shadow-card transition-colors hover:bg-bg-hover"
          >
            <span>
              <span className="block text-meta font-medium text-text-primary">
                Branding &amp; team
              </span>
              <span className="block text-meta text-text-secondary">
                White-label your reports, manage subentities, and invite advisors.
              </span>
            </span>
            <span className="text-green-600">→</span>
          </Link>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          <form action={seedDemoCase}>
            <button
              type="submit"
              className="rounded-md border border-border-default bg-bg-card px-3 py-2 text-meta font-medium text-text-primary transition-colors hover:bg-bg-hover"
            >
              Load demo case
            </button>
          </form>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-border-default bg-bg-card px-3 py-2 text-meta font-medium text-text-primary transition-colors hover:bg-bg-hover"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
