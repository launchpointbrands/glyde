import { redirect } from "next/navigation";
import Image from "next/image";
import {
  createAdvisorInvite,
  createSubentity,
  revokeAdvisorInvite,
  setAdvisorSubentity,
  updateFirmBranding,
  updateSubentity,
  uploadBrandLogo,
} from "@/lib/branding-actions";
import { createClient } from "@/lib/supabase/server";

type Subentity = {
  id: string;
  name: string;
  primary_color: string | null;
  logo_url: string | null;
  disclosure_text: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

export default async function BrandingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("advisors")
    .select("id, firm_id, role")
    .eq("id", user.id)
    .single();
  if (!me || me.role !== "firm_admin") redirect("/app/settings");

  const [{ data: firm }, { data: subentities }, { data: advisors }, { data: invites }] =
    await Promise.all([
      supabase
        .from("firms")
        .select(
          "id, name, logo_url, primary_color, disclosure_text, contact_email, contact_phone",
        )
        .eq("id", me.firm_id)
        .single(),
      supabase
        .from("subentities")
        .select(
          "id, name, primary_color, logo_url, disclosure_text, contact_email, contact_phone",
        )
        .eq("firm_id", me.firm_id)
        .is("deleted_at", null)
        .order("created_at"),
      supabase
        .from("advisors")
        .select("id, full_name, email, subentity_id")
        .eq("firm_id", me.firm_id)
        .order("full_name"),
      supabase
        .from("advisor_invites")
        .select("id, email, role, status, subentity_id, created_at")
        .eq("firm_id", me.firm_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  const subs = (subentities ?? []) as Subentity[];
  const subName = (id: string | null) =>
    id ? subs.find((s) => s.id === id)?.name ?? "—" : "Firm (entity)";

  return (
    <main className="flex flex-1 flex-col items-center px-5 py-10 md:px-10">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <h1 className="text-page font-semibold text-text-primary">
            Branding &amp; team
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            Reports are white-labeled with your brand. WMGR appears only as a
            “Powered by” credit in the footer.
          </p>
        </div>

        {status ? (
          <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-meta text-green-800">
            {status}
          </p>
        ) : null}

        {/* Entity branding */}
        <Section title="Firm brand (entity)" subtitle="Used on reports for advisors not assigned to a subentity.">
          <BrandLogo logoUrl={firm?.logo_url ?? null} scope="firm" />
          <form action={updateFirmBranding} className="mt-5 space-y-4">
            <TextField name="name" label="Firm name" defaultValue={firm?.name ?? ""} required />
            <ColorField name="primary_color" defaultValue={firm?.primary_color ?? ""} />
            <TextField name="contact_email" label="Contact email" type="email" defaultValue={firm?.contact_email ?? ""} />
            <TextField name="contact_phone" label="Contact phone" defaultValue={firm?.contact_phone ?? ""} />
            <TextArea name="disclosure_text" label="Report disclosure" defaultValue={firm?.disclosure_text ?? ""} />
            <SaveButton>Save firm brand</SaveButton>
          </form>
        </Section>

        {/* Subentities */}
        <Section title="Subentities" subtitle="Sub-brands (1099s) under your firm. Each can carry its own logo, color, and disclosure.">
          {subs.length === 0 ? (
            <p className="text-meta text-text-tertiary">No subentities yet.</p>
          ) : (
            <div className="space-y-6">
              {subs.map((s) => (
                <div key={s.id} className="rounded-[10px] border border-border-subtle p-4">
                  <BrandLogo logoUrl={s.logo_url} scope={s.id} />
                  <form action={updateSubentity} className="mt-4 space-y-3">
                    <input type="hidden" name="id" value={s.id} />
                    <TextField name="name" label="Name" defaultValue={s.name} required />
                    <ColorField name="primary_color" defaultValue={s.primary_color ?? ""} />
                    <TextField name="contact_email" label="Contact email" type="email" defaultValue={s.contact_email ?? ""} />
                    <TextField name="contact_phone" label="Contact phone" defaultValue={s.contact_phone ?? ""} />
                    <TextArea name="disclosure_text" label="Report disclosure" defaultValue={s.disclosure_text ?? ""} />
                    <SaveButton>Save subentity</SaveButton>
                  </form>
                </div>
              ))}
            </div>
          )}

          <form action={createSubentity} className="mt-6 flex items-end gap-3 border-t border-border-subtle pt-5">
            <div className="flex-1">
              <TextField name="name" label="New subentity name" placeholder="Benson Wealth Group" />
            </div>
            <SaveButton>Add subentity</SaveButton>
          </form>
        </Section>

        {/* Advisor assignment */}
        <Section title="Advisor brand assignment" subtitle="Which brand each advisor's reports carry.">
          <div className="space-y-2">
            {(advisors ?? []).map((a) => (
              <form
                key={a.id}
                action={setAdvisorSubentity}
                className="flex items-center gap-3 rounded-md border border-border-subtle px-3 py-2"
              >
                <input type="hidden" name="advisor_id" value={a.id} />
                <span className="flex-1 truncate text-meta text-text-primary">
                  {a.full_name ?? a.email}
                  <span className="ml-2 text-text-tertiary">
                    · now: {subName(a.subentity_id as string | null)}
                  </span>
                </span>
                <select name="subentity_id" defaultValue={a.subentity_id ?? ""} className={selectClass}>
                  <option value="">Firm (entity)</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <SaveButton>Set</SaveButton>
              </form>
            ))}
          </div>
        </Section>

        {/* Invites */}
        <Section title="Invite advisors" subtitle="Invites pre-assign firm, subentity, and role. The new advisor lands in the right place automatically.">
          <form action={createAdvisorInvite} className="space-y-3">
            <TextField name="email" label="Email" type="email" placeholder="colleague@theirfirm.com" required />
            <div className="flex gap-3">
              <label className="flex-1 text-meta">
                <span className="mb-1 block font-medium text-text-primary">Subentity</span>
                <select name="subentity_id" className={selectClass} defaultValue="">
                  <option value="">Firm (entity)</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex-1 text-meta">
                <span className="mb-1 block font-medium text-text-primary">Role</span>
                <select name="role" className={selectClass} defaultValue="advisor">
                  <option value="advisor">Advisor</option>
                  <option value="firm_admin">Firm admin</option>
                </select>
              </label>
            </div>
            <SaveButton>Create invite &amp; email link</SaveButton>
          </form>

          {(invites ?? []).length > 0 ? (
            <div className="mt-5 space-y-2 border-t border-border-subtle pt-4">
              <p className="text-eyebrow uppercase text-text-tertiary">Pending invites</p>
              {(invites ?? []).map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 text-meta">
                  <span className="flex-1 truncate text-text-primary">
                    {inv.email}
                    <span className="ml-2 text-text-tertiary">
                      · {inv.role} · {subName(inv.subentity_id as string | null)}
                    </span>
                  </span>
                  <form action={revokeAdvisorInvite}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button type="submit" className="text-text-tertiary underline-offset-2 transition-colors hover:text-danger-fg hover:underline">
                      Revoke
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      </div>
    </main>
  );
}

const selectClass =
  "w-full rounded-md border border-border-default bg-bg-input px-3 py-2 text-meta text-text-primary focus:border-green-400 focus:outline-none";
const inputClass =
  "mt-1 block w-full rounded-md border border-border-default bg-bg-input px-3 py-2 text-meta text-text-primary placeholder:text-text-tertiary focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50";

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-border-subtle bg-bg-card px-6 py-5 shadow-card">
      <h2 className="text-section font-semibold text-text-primary">{title}</h2>
      {subtitle ? <p className="mt-1 text-meta text-text-secondary">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BrandLogo({ logoUrl, scope }: { logoUrl: string | null; scope: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-32 items-center justify-center rounded-md border border-border-subtle bg-bg-input">
        {logoUrl ? (
          <Image src={logoUrl} alt="Logo" width={120} height={48} className="max-h-12 w-auto object-contain" unoptimized />
        ) : (
          <span className="text-eyebrow uppercase text-text-tertiary">No logo</span>
        )}
      </div>
      <form action={uploadBrandLogo} className="flex items-center gap-2">
        <input type="hidden" name="scope" value={scope} />
        <input type="file" name="logo" accept="image/png,image/jpeg,image/svg+xml" className="text-meta text-text-secondary file:mr-2 file:rounded file:border file:border-border-default file:bg-bg-card file:px-2 file:py-1 file:text-text-primary" />
        <SaveButton>Upload</SaveButton>
      </form>
    </div>
  );
}

function TextField({ name, label, defaultValue, type = "text", required, placeholder }: { name: string; label: string; defaultValue?: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block text-meta">
      <span className="font-medium text-text-primary">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} className={inputClass} />
    </label>
  );
}

function ColorField({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <label className="block text-meta">
      <span className="font-medium text-text-primary">Brand color (hex)</span>
      <input name={name} type="text" defaultValue={defaultValue} placeholder="#1F4E79" className={`${inputClass} font-mono`} />
    </label>
  );
}

function TextArea({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="block text-meta">
      <span className="font-medium text-text-primary">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={3} className={inputClass} />
    </label>
  );
}

function SaveButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit" className="shrink-0 rounded-md bg-green-400 px-3.5 py-2 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600">
      {children}
    </button>
  );
}
