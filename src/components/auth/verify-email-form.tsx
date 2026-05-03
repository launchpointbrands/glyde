"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { resendVerifyOtp, verifyEmailOtp } from "@/lib/auth";

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendOk, setResendOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resendPending, startResend] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await verifyEmailOtp(email, trimmed);
      if (result.error) {
        setError("That code didn't work. Please try again.");
        return;
      }
      router.push("/onboarding");
    });
  }

  function handleResend() {
    setError(null);
    setResendOk(false);
    startResend(async () => {
      const result = await resendVerifyOtp(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setResendOk(true);
      setTimeout(() => setResendOk(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="verify-token"
          className="text-meta font-medium text-text-primary"
        >
          Verification code
        </label>
        <input
          id="verify-token"
          type="text"
          autoFocus
          autoComplete="one-time-code"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            if (error) setError(null);
          }}
          className="w-full rounded-md border border-border-default bg-bg-input p-3 text-center text-[18px] font-mono tracking-[0.08em] text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50"
        />
      </div>

      {error && (
        <p
          className="text-meta text-danger-fg"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!token.trim() || pending}
        className="w-full rounded-md bg-green-400 px-3 py-2.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify email →"}
      </button>

      <p className="text-center text-meta text-text-tertiary">
        Didn&apos;t receive it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendPending}
          className="font-medium text-green-600 underline-offset-4 transition-colors hover:text-green-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resendPending ? "Sending…" : "Resend code"}
        </button>
        {resendOk && (
          <span className="ml-2 text-success-fg" aria-live="polite">
            Code sent
          </span>
        )}
      </p>
    </form>
  );
}
