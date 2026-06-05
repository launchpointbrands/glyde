"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateBusinessDescription } from "@/lib/business-description";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

// Soft-delete one or more clients (cases + their client_businesses). Sets
// deleted_at rather than hard-deleting so the action is recoverable; the
// clients list and dashboard filter on deleted_at is null. RLS scopes the
// update to the advisor's own cases.
export async function deleteCases(caseIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const ids = (caseIds ?? []).filter((id) => typeof id === "string" && id);
  if (ids.length === 0) return;

  const now = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("cases")
    .update({ deleted_at: now })
    .in("id", ids)
    .is("deleted_at", null)
    .select("client_business_id");
  if (error) throw new Error(error.message);

  const cbIds = (rows ?? [])
    .map((r) => r.client_business_id as string | null)
    .filter((v): v is string => Boolean(v));
  if (cbIds.length > 0) {
    await supabase
      .from("client_businesses")
      .update({ deleted_at: now })
      .in("id", cbIds);
  }

  revalidatePath("/app");
  revalidatePath("/app/cases");
}

export async function createCase(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advisor } = await supabase
    .from("advisors")
    .select("id, firm_id")
    .eq("id", user.id)
    .single();

  if (!advisor) {
    redirect(
      `/app/cases/new?error=${encodeURIComponent("Advisor profile not found.")}`,
    );
  }

  const contactName = String(formData.get("contact_name") ?? "").trim();
  if (!contactName) {
    redirect(
      `/app/cases/new?error=${encodeURIComponent("Full name is required.")}`,
    );
  }

  const contactEmailRaw = String(formData.get("contact_email") ?? "").trim();
  if (contactEmailRaw && !EMAIL_RE.test(contactEmailRaw)) {
    redirect(
      `/app/cases/new?error=${encodeURIComponent("Enter a valid email address.")}`,
    );
  }
  const contactEmail = contactEmailRaw || null;

  const contactTitle =
    String(formData.get("contact_title") ?? "").trim() || null;

  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  if (!domain) {
    redirect(
      `/app/cases/new?error=${encodeURIComponent("Domain is required.")}`,
    );
  }

  const businessName =
    String(formData.get("business_name") ?? "").trim() ||
    `${contactName} Business`;

  const { data: cb, error: cbErr } = await supabase
    .from("client_businesses")
    .insert({
      advisor_id: advisor.id,
      firm_id: advisor.firm_id,
      business_name: businessName,
      domain,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_title: contactTitle,
      created_via: "advisor_manual",
    })
    .select("id")
    .single();

  if (cbErr || !cb) {
    redirect(
      `/app/cases/new?error=${encodeURIComponent(cbErr?.message ?? "Could not create client business.")}`,
    );
  }

  const { data: caseRow, error: caseErr } = await supabase
    .from("cases")
    .insert({
      client_business_id: cb.id,
      advisor_id: advisor.id,
      firm_id: advisor.firm_id,
      status: "tier_1",
    })
    .select("id")
    .single();

  if (caseErr || !caseRow) {
    redirect(
      `/app/cases/new?error=${encodeURIComponent(caseErr?.message ?? "Could not create case.")}`,
    );
  }

  // Best-effort: kick off the AI business description. A failure here
  // (no API key, network) shouldn't block the redirect into discovery.
  try {
    await generateBusinessDescription({
      clientBusinessId: cb.id,
      domain,
      businessName,
    });
  } catch (e) {
    console.error("generateBusinessDescription (createCase) failed", e);
  }

  // NOTE: financial estimation (ensureFinancials) is deliberately NOT run
  // here. It makes a second Anthropic call which, stacked on the business
  // description call above, pushed this Server Action past the serverless
  // function time budget — the function was killed before redirect(), so
  // the form appeared to "go nowhere" and advisors re-submitted, creating
  // duplicate empty cases. Financials are now generated lazily by the
  // dashboard pages (ensureFinancials is idempotent + self-healing) after
  // the advisor finishes discovery, where the questionnaire answers also
  // make the estimates sharper.

  revalidatePath("/app");
  revalidatePath("/app/cases");
  // Drop the advisor straight into the full-screen discovery questionnaire
  // instead of the processing animation — they answer (or skip) the
  // questions first, then the processing step crunches the analysis.
  redirect(`/app/cases/${caseRow.id}/discovery/walkthrough?q=1`);
}
