"use client";

import { Building2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import {
  completeOnboardingWithClient,
  completeOnboardingWithDemo,
} from "@/lib/onboarding";

type Choice = "demo" | "manual";

export function OnboardingStep2({ error }: { error?: string }) {
  const [choice, setChoice] = useState<Choice>("demo");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      if (choice === "demo") {
        completeOnboardingWithDemo().catch((e) =>
          console.error("completeOnboardingWithDemo failed", e),
        );
      } else {
        completeOnboardingWithClient(formData).catch((e) =>
          console.error("completeOnboardingWithClient failed", e),
        );
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChoiceCardA
          selected={choice === "demo"}
          onSelect={() => setChoice("demo")}
        />
        <ChoiceCardB
          selected={choice === "manual"}
          onSelect={() => setChoice("manual")}
        />
      </div>

      {choice === "manual" && (
        <div className="space-y-4 rounded-[10px] border border-border-subtle bg-bg-card px-6 py-5 shadow-card">
          <Field id="business_name" label="Business name">
            <input
              id="business_name"
              name="business_name"
              type="text"
              required
              autoComplete="off"
              placeholder="Precision Auto Services"
              className={inputClass}
            />
          </Field>
          <Field id="domain" label="Business domain">
            <input
              id="domain"
              name="domain"
              type="text"
              required
              autoComplete="off"
              placeholder="precisionauto.com"
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {error && (
        <p
          className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-meta text-danger-fg"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-green-400 px-3 py-2.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Setting up…" : "Get started →"}
      </button>
    </form>
  );
}

function ChoiceCardA({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card selected={selected} onSelect={onSelect}>
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-green-50 text-green-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="rounded-full border border-success-border bg-success-bg px-2.5 py-[2px] text-eyebrow font-medium uppercase text-success-fg">
          Recommended
        </span>
      </div>
      <p className="mt-4 text-body font-semibold text-text-primary">
        Load a sample case
      </p>
      <p className="mt-1.5 text-meta text-text-secondary">
        Explore Glyde with Peter Smith and Precision Auto Services — a
        pre-built demo case that shows every module.
      </p>
    </Card>
  );
}

function ChoiceCardB({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card selected={selected} onSelect={onSelect}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-green-50 text-green-600">
        <Building2 className="h-4 w-4" />
      </span>
      <p className="mt-4 text-body font-semibold text-text-primary">
        Add your first client
      </p>
      <p className="mt-1.5 text-meta text-text-secondary">
        Enter your client&apos;s business name and domain to create your
        first case.
      </p>
    </Card>
  );
}

function Card({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "rounded-[10px] border bg-bg-card px-6 py-6 text-left shadow-card transition-all",
        selected
          ? "border-green-400 ring-[3px] ring-green-50"
          : "border-border-subtle hover:border-border-default",
      ].join(" ")}
    >
      {children}
    </button>
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
