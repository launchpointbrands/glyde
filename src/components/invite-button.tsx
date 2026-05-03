"use client";

import { Mail, X } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { sendInvitation } from "@/lib/invite";

type View =
  | { kind: "form"; error: string | null }
  | { kind: "success"; email: string };

export function InviteButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [view, setView] = useState<View>({ kind: "form", error: null });
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setEmail("");
      setView({ kind: "form", error: null });
      // Defer focus until after the panel is mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const trimmed = email.trim();
    startTransition(async () => {
      const result = await sendInvitation(trimmed);
      if ("error" in result) {
        setView({ kind: "form", error: result.error });
      } else {
        setView({ kind: "success", email: trimmed });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[8px] border border-transparent px-3 py-2 text-left text-text-secondary transition-colors duration-100 hover:bg-bg-hover hover:text-text-primary group-hover/sidebar:border-green-200 group-hover/sidebar:bg-green-50 group-hover/sidebar:text-green-800 group-hover/sidebar:hover:bg-green-100"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-green-600">
          <Mail className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="truncate text-[13px] font-medium opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">
          Invite a colleague
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-[400px] rounded-[12px] bg-bg-card p-7 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>

            <h2
              id="invite-title"
              className="text-[18px] font-semibold text-text-primary"
            >
              Invite a colleague
            </h2>

            {view.kind === "form" ? (
              <>
                <p className="mt-1.5 text-[13px] text-text-secondary">
                  Send them a branded invitation to create their Glyde account.
                </p>

                <form onSubmit={onSubmit} className="mt-5">
                  <label
                    htmlFor="invite-email"
                    className="block text-[11px] font-medium tracking-[0.05em] text-text-tertiary uppercase"
                  >
                    Email address
                  </label>
                  <input
                    ref={inputRef}
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@theirfirm.com"
                    autoComplete="email"
                    disabled={pending}
                    className="mt-1.5 block w-full rounded-[8px] border border-border-default bg-bg-input px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-tertiary focus:border-green-400 focus:ring-2 focus:ring-green-50 focus:outline-none disabled:opacity-60"
                  />

                  {view.error ? (
                    <p className="mt-2 text-[12px] text-danger-text">
                      {view.error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending || email.trim().length === 0}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-green-400 px-4 py-2.5 text-[14px] font-medium text-text-inverse transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? (
                      <>
                        <span
                          aria-hidden
                          className="h-3.5 w-3.5 animate-spin rounded-full border-[2px] border-white/40 border-t-white"
                        />
                        <span>Sending…</span>
                      </>
                    ) : (
                      <span>Send invitation →</span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-[14px] text-success-text">
                  ✓ Invitation sent to {view.email}
                </p>
                <button
                  type="button"
                  onClick={() => setView({ kind: "form", error: null })}
                  className="mt-3 text-[13px] font-medium text-green-600 transition-colors hover:text-green-800"
                >
                  Send another
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
