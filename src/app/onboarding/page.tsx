import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingStep2 } from "@/components/onboarding-step-2";
import { Wordmark } from "@/components/wordmark";
import { updateFirmBranding, uploadBrandLogo } from "@/lib/branding-actions";
import { saveAdvisorProfile } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

const TITLES = [
  "Financial Advisor",
  "Wealth Manager",
  "Certified Financial Planner",
  "Registered Investment Advisor",
  "Other",
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; error?: string; status?: string }>;
}) {
  const { step: stepParam, error, status } = await searchParams;
  const step: 1 | 2 | "brand" =
    stepParam === "2" ? 2 : stepParam === "brand" ? "brand" : 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: advisor } = await supabase
    .from("advisors")
    .select("full_name, title, role, firm_id")
    .eq("id", user.id)
    .single();

  // Guard: only firm admins see the branding step.
  if (step === "brand" && advisor?.role !== "firm_admin") {
    redirect("/onboarding?step=2");
  }

  const { data: firm } =
    step === "brand" && advisor?.firm_id
      ? await supabase
          .from("firms")
          .select("name, logo_url, primary_color")
          .eq("id", advisor.firm_id)
          .single()
      : { data: null };

  return (
    <main className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex items-center justify-between px-10 py-7">
        <Wordmark className="text-[22px] text-text-primary" />
        <p className="text-eyebrow uppercase text-text-tertiary">
          {step === "brand" ? "Brand your firm" : `Step ${step} of 2`}
        </p>
      </header>

      <div className="flex flex-1 items-start justify-center px-6 pt-8 pb-16">
        <div className="w-full max-w-[640px]">
          {step === 1 ? (
            <Step1
              defaultName={advisor?.full_name ?? ""}
              defaultTitle={advisor?.title ?? ""}
              error={error}
            />
          ) : step === "brand" ? (
            <BrandStep
              firmName={firm?.name ?? ""}
              logoUrl={firm?.logo_url ?? null}
              primaryColor={firm?.primary_color ?? ""}
              status={status}
            />
          ) : (
            <Step2 error={error} />
          )}
        </div>
      </div>
    </main>
  );
}

function BrandStep({
  firmName,
  logoUrl,
  primaryColor,
  status,
}: {
  firmName: string;
  logoUrl: string | null;
  primaryColor: string;
  status?: string;
}) {
  const NEXT = "/onboarding?step=brand";
  return (
    <>
      <div>
        <h1 className="text-display font-light leading-[1.1] text-text-primary">
          Brand your reports
        </h1>
        <p className="mt-3 text-body text-text-secondary">
          Reports go out under your firm&apos;s brand. Add a logo and color now,
          or set them later in Settings → Branding.
        </p>
      </div>

      {status ? (
        <p className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-meta text-green-800">
          {status}
        </p>
      ) : null}

      <div className="mt-8 space-y-5 rounded-[10px] border border-border-subtle bg-bg-card px-7 py-7 shadow-card">
        <div>
          <p className="text-meta font-medium text-text-primary">Firm logo</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-14 w-32 items-center justify-center rounded-md border border-border-subtle bg-bg-input">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Firm logo"
                  className="max-h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-eyebrow uppercase text-text-tertiary">
                  No logo
                </span>
              )}
            </div>
            <form action={uploadBrandLogo} className="flex items-center gap-2">
              <input type="hidden" name="scope" value="firm" />
              <input type="hidden" name="next" value={NEXT} />
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/svg+xml"
                className="text-meta text-text-secondary file:mr-2 file:rounded file:border file:border-border-default file:bg-bg-card file:px-2 file:py-1 file:text-text-primary"
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-green-400 px-3.5 py-2 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
              >
                Upload
              </button>
            </form>
          </div>
        </div>

        <form action={updateFirmBranding} className="space-y-4 border-t border-border-subtle pt-5">
          <input type="hidden" name="next" value={NEXT} />
          <Field id="name" label="Firm name">
            <input id="name" name="name" type="text" required defaultValue={firmName} className={inputClass} />
          </Field>
          <Field id="primary_color" label="Brand color (hex)">
            <input id="primary_color" name="primary_color" type="text" placeholder="#1F4E79" defaultValue={primaryColor} className={`${inputClass} font-mono`} />
          </Field>
          <button
            type="submit"
            className="rounded-md bg-green-400 px-5 py-2.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
          >
            Save brand
          </button>
        </form>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <Link
          href="/onboarding?step=2"
          className="rounded-md bg-green-400 px-5 py-2.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
        >
          Continue →
        </Link>
        <Link
          href="/onboarding?step=2"
          className="text-meta text-text-tertiary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
        >
          Skip for now
        </Link>
      </div>
    </>
  );
}

function Step1({
  defaultName,
  defaultTitle,
  error,
}: {
  defaultName: string;
  defaultTitle: string;
  error?: string;
}) {
  return (
    <>
      <div>
        <h1 className="text-display font-light leading-[1.1] text-text-primary">
          Let&apos;s set up your account
        </h1>
        <p className="mt-3 text-body text-text-secondary">
          Tell us a bit about yourself.
        </p>
      </div>

      <form
        action={saveAdvisorProfile}
        className="mt-10 space-y-5 rounded-[10px] border border-border-subtle bg-bg-card px-7 py-7 shadow-card"
      >
        <Field id="full_name" label="Full name">
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            defaultValue={defaultName}
            className={inputClass}
          />
        </Field>

        <Field id="title" label="Title">
          <select
            id="title"
            name="title"
            defaultValue={defaultTitle || TITLES[0]}
            className={inputClass}
          >
            {TITLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        {error && (
          <p
            className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-meta text-danger-fg"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="pt-1">
          <button
            type="submit"
            className="rounded-md bg-green-400 px-5 py-2.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600"
          >
            Continue →
          </button>
        </div>
      </form>
    </>
  );
}

function Step2({ error }: { error?: string }) {
  return (
    <>
      <div>
        <h1 className="text-display font-light leading-[1.1] text-text-primary">
          Add your first client
        </h1>
        <p className="mt-3 text-body text-text-secondary">
          Enter a business owner client you work with. A sample client has
          already been added to your account.
        </p>
      </div>

      <div className="mt-10">
        <OnboardingStep2 error={error} />
      </div>
    </>
  );
}

const inputClass =
  "w-full rounded-md border border-border-default bg-bg-input px-3 py-2 text-meta text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-meta font-medium text-text-primary"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
