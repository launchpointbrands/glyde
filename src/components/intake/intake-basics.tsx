"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createCase } from "@/lib/cases";
import { Wordmark } from "@/components/wordmark";

// Full-screen, TurboTax-style intake for the "add a client" basics. One
// focused screen at a time. All fields live in a single <form> (non-active
// screens are kept mounted but hidden) so the final submit posts the whole
// set to the createCase Server Action. Client-side gating keeps the advisor
// from advancing without the required field; createCase re-validates on the
// server as a backstop.

const STEPS = [
  { key: "client", label: "Client" },
  { key: "business", label: "Business" },
] as const;

export function IntakeBasics({ error }: { error?: string }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  const canContinue = name.trim().length > 0;
  const canSubmit = domain.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg-page">
      {/* Top bar — brand, progress, exit */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Wordmark className="text-[20px] text-text-primary" />
        <IntakeProgress current={step} total={STEPS.length} />
        <a
          href="/app"
          className="text-meta text-text-tertiary transition-colors hover:text-text-primary"
        >
          Exit
        </a>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        {/* Single form across both screens — non-active screen stays mounted
            (just hidden) so its field values survive into the final submit. */}
        <form action={createCase} className="w-full max-w-[560px]">
          {/* Screen 1 — about the client */}
          <fieldset hidden={step !== 0} className="animate-[wmgr-fadein_300ms_ease-out]">
            <Eyebrow>Step 1 of 2 · About the client</Eyebrow>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight text-text-primary md:text-[34px]">
              Who are you adding?
            </h1>
            <p className="mt-2 text-body text-text-secondary">
              Just the essentials to get started — you can fill in the rest as
              you go.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <Field
                id="contact_name"
                label="Full name"
                placeholder="Peter Smith"
                autoComplete="name"
                value={name}
                onValueChange={setName}
                autoFocus
              />
              <Field
                id="contact_title"
                label="Title"
                optional
                placeholder="Owner, CEO, Managing Partner…"
                autoComplete="organization-title"
              />
            </div>
          </fieldset>

          {/* Screen 2 — about the business */}
          <fieldset hidden={step !== 1} className="animate-[wmgr-fadein_300ms_ease-out]">
            <Eyebrow>Step 2 of 2 · About the business</Eyebrow>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight text-text-primary md:text-[34px]">
              Tell us about their business
            </h1>
            <p className="mt-2 text-body text-text-secondary">
              We use the domain to pull in the company logo and draft an AI
              business description.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <Field
                id="business_name"
                label="Business name"
                optional
                placeholder="Precision Auto Services"
                autoComplete="organization"
              />
              <Field
                id="domain"
                label="Business domain"
                placeholder="precisionauto.com"
                autoComplete="off"
                value={domain}
                onValueChange={setDomain}
                help="Used to find the company logo and generate an AI business description."
              />
              <Field
                id="contact_email"
                label="Email address"
                optional
                type="email"
                placeholder="peter@theirbusiness.com"
                autoComplete="email"
              />
            </div>
          </fieldset>

          {error ? (
            <p
              role="alert"
              className="mt-6 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[13px] text-danger-text"
            >
              {error}
            </p>
          ) : null}

          {/* Footer controls */}
          <div className="mt-10 flex items-center justify-between border-t border-border-subtle pt-6">
            {step === 0 ? (
              <span />
            ) : (
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-meta text-text-tertiary transition-colors hover:text-text-primary"
              >
                ← Back
              </button>
            )}

            {step === 0 ? (
              <button
                type="button"
                onClick={() => canContinue && setStep(1)}
                disabled={!canContinue}
                className="rounded-[8px] bg-green-400 px-5 py-2.5 text-[14px] font-medium text-text-inverse transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue →
              </button>
            ) : (
              <CreateButton disabled={!canSubmit} />
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-[8px] bg-green-400 px-5 py-2.5 text-[14px] font-medium text-text-inverse transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? "Creating…" : "Create client →"}
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-eyebrow uppercase tracking-[0.06em] text-text-tertiary">
      {children}
    </p>
  );
}

function IntakeProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 w-8 rounded-[2px] ${
            i <= current ? "bg-green-400" : "bg-border-default"
          }`}
        />
      ))}
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  optional,
  placeholder,
  autoComplete,
  help,
  value,
  onValueChange,
  autoFocus,
}: {
  id: string;
  label: string;
  type?: string;
  optional?: boolean;
  placeholder?: string;
  autoComplete?: string;
  help?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-text-primary"
      >
        {label}
        {optional ? (
          <span className="ml-1 text-text-tertiary">(optional)</span>
        ) : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        {...(onValueChange
          ? { value, onChange: (e) => onValueChange(e.target.value) }
          : {})}
        className="mt-1.5 block w-full rounded-[8px] border border-border-default bg-bg-input px-3.5 py-3 text-[15px] text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:ring-[3px] focus:ring-green-50 focus:outline-none"
      />
      {help ? (
        <p className="mt-1.5 text-[12px] text-text-tertiary">{help}</p>
      ) : null}
    </div>
  );
}
