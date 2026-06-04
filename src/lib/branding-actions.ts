"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const SETTINGS = "/app/settings/branding";

// Every action here is firm-admin only. RLS enforces this at the database
// level too; this is a fast, friendly guard with a clear redirect.
async function requireFirmAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advisor } = await supabase
    .from("advisors")
    .select("id, firm_id, role")
    .eq("id", user.id)
    .single();

  if (!advisor || advisor.role !== "firm_admin") {
    redirect("/app/settings?error=admin_only");
  }
  return { supabase, advisor };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function back(msg: string) {
  redirect(`${SETTINGS}?status=${encodeURIComponent(msg)}`);
}

// Like back(), but honors an optional `next` form field so the same action
// can be reused from onboarding (which continues to the next step) and from
// settings (which stays on the branding page).
function backTo(formData: FormData, msg: string): never {
  const next = String(formData.get("next") ?? "");
  const base = next.startsWith("/") ? next : SETTINGS;
  const sep = base.includes("?") ? "&" : "?";
  redirect(`${base}${sep}status=${encodeURIComponent(msg)}`);
}

// --- Logo upload -----------------------------------------------------------
// scope = "firm" updates the firm's logo; scope = a subentity id updates that
// subentity's logo. The object path is server-controlled so a client can't
// point logo_url at someone else's brand.
export async function uploadBrandLogo(formData: FormData) {
  const { supabase, advisor } = await requireFirmAdmin();

  const scope = String(formData.get("scope") ?? "firm");
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    backTo(formData, "No file selected.");
  }
  const f = file as File;
  if (!["image/png", "image/jpeg", "image/svg+xml"].includes(f.type)) {
    backTo(formData, "Logo must be a PNG, JPG, or SVG.");
  }
  if (f.size > 2 * 1024 * 1024) {
    backTo(formData, "Logo must be under 2MB.");
  }

  const ext =
    f.type === "image/png" ? "png" : f.type === "image/jpeg" ? "jpg" : "svg";
  const targetIsFirm = scope === "firm";
  const folder = targetIsFirm ? `firm/${advisor.firm_id}` : `subentity/${scope}`;
  const path = `${folder}/logo-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("branding")
    .upload(path, f, { upsert: true, contentType: f.type });
  if (upErr) backTo(formData, `Upload failed: ${upErr.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("branding").getPublicUrl(path);

  if (targetIsFirm) {
    const { error } = await supabase
      .from("firms")
      .update({ logo_url: publicUrl })
      .eq("id", advisor.firm_id);
    if (error) backTo(formData, error.message);
  } else {
    const { error } = await supabase
      .from("subentities")
      .update({ logo_url: publicUrl })
      .eq("id", scope)
      .eq("firm_id", advisor.firm_id);
    if (error) backTo(formData, error.message);
  }

  revalidatePath(SETTINGS);
  backTo(formData, "Logo updated.");
}

// --- Firm (entity) branding ------------------------------------------------
export async function updateFirmBranding(formData: FormData) {
  const { supabase, advisor } = await requireFirmAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const primaryColorRaw = String(formData.get("primary_color") ?? "").trim();
  const disclosure = String(formData.get("disclosure_text") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const contactPhone = String(formData.get("contact_phone") ?? "").trim() || null;

  if (!name) backTo(formData, "Firm name is required.");
  if (primaryColorRaw && !HEX_RE.test(primaryColorRaw)) {
    backTo(formData, "Brand color must be a hex value like #1F4E79.");
  }
  if (contactEmail && !EMAIL_RE.test(contactEmail)) {
    backTo(formData, "Enter a valid contact email.");
  }

  const { error } = await supabase
    .from("firms")
    .update({
      name,
      primary_color: primaryColorRaw || null,
      disclosure_text: disclosure,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    })
    .eq("id", advisor.firm_id);
  if (error) backTo(formData, error.message);

  revalidatePath(SETTINGS);
  backTo(formData, "Firm branding saved.");
}

// --- Subentities -----------------------------------------------------------
export async function createSubentity(formData: FormData) {
  const { supabase, advisor } = await requireFirmAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const primaryColorRaw = String(formData.get("primary_color") ?? "").trim();
  if (!name) back("Subentity name is required.");
  if (primaryColorRaw && !HEX_RE.test(primaryColorRaw)) {
    back("Brand color must be a hex value like #8A5A2F.");
  }

  const { error } = await supabase.from("subentities").insert({
    firm_id: advisor.firm_id,
    name,
    slug: slugify(name) || randomUUID().slice(0, 8),
    primary_color: primaryColorRaw || null,
  });
  if (error) back(error.message);

  revalidatePath(SETTINGS);
  back("Subentity created.");
}

export async function updateSubentity(formData: FormData) {
  const { supabase, advisor } = await requireFirmAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const primaryColorRaw = String(formData.get("primary_color") ?? "").trim();
  const disclosure = String(formData.get("disclosure_text") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const contactPhone = String(formData.get("contact_phone") ?? "").trim() || null;

  if (!id) back("Missing subentity.");
  if (!name) back("Subentity name is required.");
  if (primaryColorRaw && !HEX_RE.test(primaryColorRaw)) {
    back("Brand color must be a hex value.");
  }
  if (contactEmail && !EMAIL_RE.test(contactEmail)) {
    back("Enter a valid contact email.");
  }

  const { error } = await supabase
    .from("subentities")
    .update({
      name,
      primary_color: primaryColorRaw || null,
      disclosure_text: disclosure,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    })
    .eq("id", id)
    .eq("firm_id", advisor.firm_id);
  if (error) back(error.message);

  revalidatePath(SETTINGS);
  back("Subentity saved.");
}

// Assign an advisor to a subentity (or clear it). Drives which brand their
// generated reports carry. Firm-admin only; RLS permits updating advisors
// within the firm.
export async function setAdvisorSubentity(formData: FormData) {
  const { supabase, advisor } = await requireFirmAdmin();

  const advisorId = String(formData.get("advisor_id") ?? "");
  const subentityRaw = String(formData.get("subentity_id") ?? "");
  const subentityId = subentityRaw === "" ? null : subentityRaw;
  if (!advisorId) back("Missing advisor.");

  const { error } = await supabase
    .from("advisors")
    .update({ subentity_id: subentityId })
    .eq("id", advisorId)
    .eq("firm_id", advisor.firm_id);
  if (error) back(error.message);

  revalidatePath(SETTINGS);
  back("Advisor assignment updated.");
}

// --- Tokenized invites -----------------------------------------------------
export async function createAdvisorInvite(formData: FormData) {
  const { supabase, advisor } = await requireFirmAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const subentityRaw = String(formData.get("subentity_id") ?? "");
  const subentityId = subentityRaw === "" ? null : subentityRaw;
  const role = String(formData.get("role") ?? "advisor") === "firm_admin"
    ? "firm_admin"
    : "advisor";

  if (!email || !EMAIL_RE.test(email)) back("Enter a valid email to invite.");

  const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, "");

  const { error } = await supabase.from("advisor_invites").insert({
    firm_id: advisor.firm_id,
    subentity_id: subentityId,
    email,
    role,
    token,
    invited_by: advisor.id,
  });
  if (error) back(error.message);

  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://glyde-alpha.vercel.app";
  const link = `${base}/signup?invite=${token}`;

  // Best-effort email. The invite row exists regardless; the link is also
  // shown in the UI so a firm admin can copy it if email is unconfigured.
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "WMGR <info@meetings.launchpointbrands.com>",
        to: email,
        subject: "You're invited to join your firm on WMGR",
        html: inviteEmailHtml(link),
      });
    } catch (e) {
      console.error("invite email failed", e);
    }
  }

  revalidatePath(SETTINGS);
  back("Invite created.");
}

export async function revokeAdvisorInvite(formData: FormData) {
  const { supabase, advisor } = await requireFirmAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) back("Missing invite.");
  const { error } = await supabase
    .from("advisor_invites")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("firm_id", advisor.firm_id);
  if (error) back(error.message);
  revalidatePath(SETTINGS);
  back("Invite revoked.");
}

function inviteEmailHtml(link: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F6F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
      <tr><td style="background:#395E38;border-radius:12px 12px 0 0;padding:22px 36px;">
        <p style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#fff;">WMGR</p>
      </td></tr>
      <tr><td style="background:#fff;border-radius:0 0 12px 12px;border:1px solid #E8EDE8;border-top:none;padding:32px 36px;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#1A2E1A;">You've been invited to your firm's workspace.</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#4A6A4A;line-height:1.6;">A colleague set up an account for you. Click below to finish creating it — your firm and role are already assigned.</p>
        <a href="${link}" style="display:inline-block;background:#395E38;color:#fff;font-size:15px;font-weight:500;text-decoration:none;padding:13px 32px;border-radius:8px;">Accept invitation →</a>
        <p style="margin:24px 0 0;font-size:12px;color:#7A9A7A;">Or paste this link into your browser:<br>${link}</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}
