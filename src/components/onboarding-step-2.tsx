"use client";

import { useTransition } from "react";
import {
  completeOnboardingWithClient,
  skipOnboarding,
} from "@/lib/onboarding";

export function OnboardingStep2({ error }: { error?: string }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      completeOnboardingWithClient(formData).catch((e) =>
        console.error("completeOnboardingWithClient failed", e),
      );
    });
  }

  function handleSkip() {
    startTransition(() => {
      skipOnboarding().catch((e) =>
        console.error("skipOnboarding failed", e),
      );
    });
  }

  return (
    <div className="space-y-5">
      <form
        action={handleSubmit}
        className="rounded-[12px] border border-border-subtle bg-bg-card p-7 shadow-card"
      >
        <div className="flex flex-col gap-3">
          <Field
            id="contact_name"
            label="Contact name"
            placeholder="Peter Smith"
            autoComplete="name"
          />
          <Field
            id="business_name"
            label="Business name"
            placeholder="Precision Auto Services"
            autoComplete="organization"
          />
          <Field
            id="domain"
            label="Business domain"
            required
            placeholder="precisionauto.com"
            autoComplete="off"
          />
          <Field
            id="contact_email"
            label="Contact email"
            type="email"
            placeholder="peter@theirbusiness.com"
            autoComplete="email"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[13px] text-danger-text"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-[8px] bg-green-400 px-4 py-2.5 text-[14px] font-medium text-text-inverse transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Setting up…" : "Create client →"}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={handleSkip}
          disabled={pending}
          className="text-[13px] text-text-tertiary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-text-primary"
      >
        {label}
        {required ? null : (
          <span className="ml-1 text-text-tertiary">(optional)</span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 block w-full rounded-[8px] border border-border-default bg-bg-input px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:ring-[3px] focus:ring-green-50 focus:outline-none"
      />
    </div>
  );
}
