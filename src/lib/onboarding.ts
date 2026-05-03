"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateBusinessDescription } from "@/lib/business-description";
import { ensureFinancials } from "@/lib/financials";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdvisor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

// Onboarding step 1 — save name + title to the advisor row that the
// signup trigger already created. Advance to step 2.
export async function saveAdvisorProfile(formData: FormData) {
  const { supabase, userId } = await requireAdvisor();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;

  if (!fullName) {
    redirect(
      `/onboarding?step=1&error=${encodeURIComponent("Name is required.")}`,
    );
  }

  const { error } = await supabase
    .from("advisors")
    .update({ full_name: fullName, title })
    .eq("id", userId);

  if (error) {
    redirect(
      `/onboarding?step=1&error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/onboarding?step=2");
}

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

function deriveBusinessName(domain: string): string {
  const root = domain.split(".")[0] ?? domain;
  return root.charAt(0).toUpperCase() + root.slice(1);
}

async function markCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { error } = await supabase
    .from("advisors")
    .update({ onboarding_completed: true })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

// Onboarding step 2 (skip path) — the demo case is auto-seeded by the
// signup trigger, so skipping is safe: advisor lands on /app with
// Peter Smith already in their book.
export async function skipOnboarding() {
  const { supabase, userId } = await requireAdvisor();
  await markCompleted(supabase, userId);
  revalidatePath("/", "layout");
  redirect("/app");
}

// Onboarding step 2 — manual client. Creates a client_business + case,
// kicks off AI business description and financials, marks onboarding
// complete, redirects to the processing animation which lands on the
// new case's Overview tab.
export async function completeOnboardingWithClient(formData: FormData) {
  const { supabase, userId } = await requireAdvisor();

  const { data: advisor } = await supabase
    .from("advisors")
    .select("id, firm_id")
    .eq("id", userId)
    .single();

  if (!advisor) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent("Advisor profile not found.")}`,
    );
  }

  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  if (!domain) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent("Domain is required.")}`,
    );
  }

  const contactName =
    String(formData.get("contact_name") ?? "").trim() || null;

  const contactEmailRaw = String(formData.get("contact_email") ?? "").trim();
  if (contactEmailRaw && !EMAIL_RE.test(contactEmailRaw)) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent("Enter a valid email address.")}`,
    );
  }
  const contactEmail = contactEmailRaw || null;

  const businessNameRaw = String(formData.get("business_name") ?? "").trim();
  const businessName =
    businessNameRaw ||
    (contactName ? `${contactName} Business` : deriveBusinessName(domain));

  const { data: cb, error: cbErr } = await supabase
    .from("client_businesses")
    .insert({
      advisor_id: advisor.id,
      firm_id: advisor.firm_id,
      business_name: businessName,
      domain,
      contact_name: contactName,
      contact_email: contactEmail,
      created_via: "advisor_manual",
    })
    .select("id")
    .single();

  if (cbErr || !cb) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent(cbErr?.message ?? "Could not create client business.")}`,
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
      `/onboarding?step=2&error=${encodeURIComponent(caseErr?.message ?? "Could not create case.")}`,
    );
  }

  // Best-effort: kick off the AI business description. A failure here
  // (no API key, network) shouldn't block the redirect.
  try {
    await generateBusinessDescription({
      clientBusinessId: cb.id,
      domain,
      businessName,
    });
  } catch (e) {
    console.error("generateBusinessDescription (onboarding) failed", e);
  }

  // AI-powered financials populate valuation_snapshots /
  // risk_assessments / wealth_plans / succession_plans. Self-healing
  // on partial failure; falls back to the clamped simulator if AI is
  // unavailable.
  try {
    await ensureFinancials({ caseId: caseRow.id });
  } catch (e) {
    console.error("ensureFinancials (onboarding) failed", e);
  }

  await markCompleted(supabase, userId);
  revalidatePath("/", "layout");
  redirect(`/app/processing?caseId=${caseRow.id}`);
}
