import { MoreHorizontal } from "lucide-react";
import { notFound } from "next/navigation";
import { NavLink } from "@/components/nav-link";
import { createClient } from "@/lib/supabase/server";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: caseRow } = await supabase
    .from("cases")
    .select(
      "id, status, client_business:client_businesses(business_name, primary_owner_name, domain)",
    )
    .eq("id", id)
    .single();

  if (!caseRow) notFound();

  const cb = Array.isArray(caseRow.client_business)
    ? caseRow.client_business[0]
    : caseRow.client_business;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border-subtle bg-bg-card px-10 pt-8 pb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 space-y-1.5">
            {cb?.primary_owner_name && (
              <p className="text-eyebrow uppercase text-text-tertiary">
                {cb.primary_owner_name}
              </p>
            )}
            <h1 className="text-stat font-semibold text-text-primary">
              {cb?.business_name ?? "Unnamed business"}
            </h1>
            {cb?.domain && (
              <p className="text-meta text-text-secondary">{cb.domain}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              aria-label="More actions"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <nav className="flex items-center gap-9 border-b border-border-subtle bg-bg-card px-10">
        <NavLink href={`/app/cases/${id}`}>Overview</NavLink>
        <NavLink href={`/app/cases/${id}/discovery`}>Discovery</NavLink>
        <NavLink href={`/app/cases/${id}/valuation`}>Valuation</NavLink>
        <NavLink href={`/app/cases/${id}/risk`}>Risk</NavLink>
        <NavLink href={`/app/cases/${id}/wealth`}>Wealth</NavLink>
        <NavLink href={`/app/cases/${id}/succession`}>Succession</NavLink>
      </nav>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
