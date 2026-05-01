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
      <div className="flex items-start justify-between border-b px-6 py-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {cb?.primary_owner_name ?? "Unassigned owner"}
          </p>
          <h1 className="text-lg font-medium">
            {cb?.business_name ?? "—"}
            {cb?.domain && (
              <span className="ml-2 text-sm text-muted-foreground">
                {cb.domain}
              </span>
            )}
          </h1>
        </div>
        <CaseStatusBadge status={caseRow.status} />
      </div>
      <nav className="flex items-center gap-6 border-b px-6 py-2 text-sm">
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
