import type { ReportBranding } from "@/components/pdf/pdf-cover";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const BRAND_COLUMNS =
  "name, logo_url, primary_color, disclosure_text, contact_email, contact_phone";

type BrandRow = {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  disclosure_text: string | null;
  contact_email: string | null;
  contact_phone: string | null;
} | null;

function toBranding(row: BrandRow): ReportBranding {
  return {
    name: row?.name ?? "",
    logoUrl: row?.logo_url ?? null,
    primaryColor: row?.primary_color ?? null,
    disclosure: row?.disclosure_text ?? null,
    contactEmail: row?.contact_email ?? null,
    contactPhone: row?.contact_phone ?? null,
  };
}

// Resolve the brand a report should carry: the advisor's subentity when one
// is assigned, otherwise the firm (entity). This is the single source of the
// subentity-over-entity precedence — Phase 1 read the firm directly here.
export async function resolveBranding(
  supabase: SupabaseServerClient,
  opts: { firmId: string; advisorId: string | null },
): Promise<ReportBranding> {
  let subentityId: string | null = null;
  if (opts.advisorId) {
    const { data: adv } = await supabase
      .from("advisors")
      .select("subentity_id")
      .eq("id", opts.advisorId)
      .maybeSingle();
    subentityId = (adv?.subentity_id as string | null) ?? null;
  }

  if (subentityId) {
    const { data: sub } = await supabase
      .from("subentities")
      .select(BRAND_COLUMNS)
      .eq("id", subentityId)
      .maybeSingle();
    if (sub) return toBranding(sub as BrandRow);
  }

  const { data: firm } = await supabase
    .from("firms")
    .select(BRAND_COLUMNS)
    .eq("id", opts.firmId)
    .maybeSingle();
  return toBranding(firm as BrandRow);
}
