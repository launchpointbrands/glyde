import { MoreHorizontal } from "lucide-react";
import { notFound } from "next/navigation";
import { CaseStatusBadge } from "@/components/case-status-badge";
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
      <header className="border-b px-8 pt-7 pb-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 space-y-1.5">
            {cb?.primary_owner_name && (
              <p className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                {cb.primary_owner_name}
              </p>
            )}
            <h1 className="font-display text-[28px] leading-tight font-medium tracking-tight">
              {cb?.business_name ?? "Unnamed business"}
            </h1>
            {cb?.domain && (
              <p className="text-sm text-muted-foreground">{cb.domain}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <CaseStatusBadge status={caseRow.status} />
            <button
              type="button"
              aria-label="More actions"
              className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <nav className="flex items-center gap-9 border-b px-8">
        <NavLink href={`/app/cases/${id}/valuation`}>Valuation</NavLink>
        <NavLink href={`/app/cases/${id}/risk`}>Risk</NavLink>
        <NavLink href={`/app/cases/${id}/wealth`}>Wealth</NavLink>
        <NavLink href={`/app/cases/${id}/succession`}>Succession</NavLink>
        <NavLink href={`/app/cases/${id}/discovery`}>Discovery</NavLink>
      </nav>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
