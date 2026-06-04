import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { GoogleButton } from "@/components/google-button";
import { signUp } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  const { error, invite } = await searchParams;

  // Validate any invite token (pre-auth) so we can greet the invitee and
  // prefill their email. invite_preview is a SECURITY DEFINER RPC.
  let invitePreview:
    | { firm_name: string; subentity_name: string | null; invite_email: string | null }
    | null = null;
  if (invite) {
    const { data } = await supabase.rpc("invite_preview", { p_token: invite });
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      invitePreview = {
        firm_name: row.firm_name,
        subentity_name: row.subentity_name ?? null,
        invite_email: row.invite_email ?? null,
      };
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-stat font-semibold leading-tight text-text-primary">
            Create your account
          </h1>
          <p className="mt-1.5 text-meta text-text-tertiary">
            {invitePreview
              ? `Join ${invitePreview.subentity_name ?? invitePreview.firm_name} on WMGR`
              : "Start your free advisor account"}
          </p>
        </div>

        {invitePreview ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-meta text-green-800">
            You&apos;ve been invited to{" "}
            <span className="font-semibold">{invitePreview.firm_name}</span>
            {invitePreview.subentity_name
              ? ` · ${invitePreview.subentity_name}`
              : ""}
            . Your firm and role are already set — just finish your account.
          </div>
        ) : null}

        <GoogleButton />

        <Divider label="or" />

        <form action={signUp} className="space-y-4">
          {invite ? (
            <input type="hidden" name="invite_token" value={invite} />
          ) : null}
          <Field id="full_name" label="Full name">
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className={inputClass}
            />
          </Field>

          <Field id="email" label="Email">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={invitePreview?.invite_email ?? undefined}
              className={inputClass}
            />
          </Field>

          <Field id="password" label="Password">
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className={inputClass}
            />
            <p className="text-meta text-text-tertiary">
              At least 6 characters.
            </p>
          </Field>

          {error && (
            <p
              className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-meta text-danger-fg"
              role="alert"
            >
              {error}
            </p>
          )}

          <button type="submit" className={primaryButtonClass}>
            Create account
          </button>
        </form>

        <p className="text-center text-meta text-text-tertiary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-green-600 underline underline-offset-4 transition-colors hover:text-green-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

const inputClass =
  "w-full rounded-md border border-border-default bg-bg-input px-3 py-2 text-meta text-text-primary placeholder:text-text-tertiary transition-shadow focus:border-green-400 focus:outline-none focus:ring-[3px] focus:ring-green-50";

const primaryButtonClass =
  "w-full rounded-md bg-green-400 px-3 py-2.5 text-meta font-medium text-text-inverse transition-colors hover:bg-green-600";

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

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="text-eyebrow uppercase text-text-tertiary">{label}</span>
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}
