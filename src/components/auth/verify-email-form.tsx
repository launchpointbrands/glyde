"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { resendVerifyOtp, verifyEmailOtp } from "@/lib/auth";

const LENGTH = 6;

const EMPTY = Array.from({ length: LENGTH }, () => "");

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [resendOk, setResendOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resendPending, startResend] = useTransition();

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmitted = useRef<string | null>(null);

  const code = digits.join("");
  const ready = code.length === LENGTH && digits.every((d) => d);

  function setDigit(i: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function focusBox(i: number) {
    const target = inputRefs.current[i];
    if (target) {
      target.focus();
      target.select();
    }
  }

  function handleChange(i: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "").slice(0, 1);
    setDigit(i, cleaned);
    if (error) setError(null);
    if (cleaned && i < LENGTH - 1) {
      focusBox(i + 1);
    }
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) {
        setDigit(i, "");
        return;
      }
      if (i > 0) {
        focusBox(i - 1);
        setDigit(i - 1, "");
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusBox(i - 1);
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      focusBox(i + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (text.length === 0) return;
    e.preventDefault();
    const next = [...EMPTY];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    if (error) setError(null);
    const focusIndex = Math.min(text.length, LENGTH - 1);
    focusBox(focusIndex);
  }

  function submit(token: string) {
    if (lastSubmitted.current === token) return;
    lastSubmitted.current = token;
    startTransition(async () => {
      const result = await verifyEmailOtp(email, token);
      if (result.error) {
        setError("That code didn't work. Please try again.");
        return;
      }
      router.push("/onboarding");
    });
  }

  // Auto-submit when all 6 boxes are filled.
  useEffect(() => {
    if (!ready) return;
    submit(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, code]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    submit(code);
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
      <div
        className="flex justify-center gap-2"
        onPaste={handlePaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className={[
              "h-[52px] w-[44px] rounded-md border text-center text-[22px] font-mono tabular-nums text-text-primary transition-colors focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50",
              d
                ? "border-green-400 bg-green-50"
                : "border-border-default bg-bg-input",
            ].join(" ")}
          />
        ))}
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
        disabled={!ready || pending}
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
