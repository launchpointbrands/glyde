import Image from "next/image";
import { OnboardingStep2 } from "@/components/onboarding-step-2";
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
  searchParams: Promise<{ step?: string; error?: string }>;
}) {
  const { step: stepParam, error } = await searchParams;
  const step = stepParam === "2" ? 2 : 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: advisor } = await supabase
    .from("advisors")
    .select("full_name, title")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex items-center justify-between px-10 py-7">
        <Image
          src="/brand/glyde-wordmark.svg"
          alt="Glyde"
          width={140}
          height={28}
          unoptimized
          priority
          className="h-7 w-auto"
        />
        <p className="text-eyebrow uppercase text-text-tertiary">
          Step {step} of 2
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
          ) : (
            <Step2 error={error} />
          )}
        </div>
      </div>
    </main>
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
