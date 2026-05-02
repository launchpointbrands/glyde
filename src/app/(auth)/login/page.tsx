import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { GoogleButton } from "@/components/google-button";
import { signIn } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  const { error, message } = await searchParams;

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-stat font-semibold leading-tight text-text-primary">
            Welcome back
          </h1>
          <p className="mt-1.5 text-meta text-text-tertiary">
            Sign in to your advisor account
          </p>
        </div>

        <GoogleButton />

        <Divider label="or" />

        <form action={signIn} className="space-y-4">
          <Field id="email" label="Email">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="password"
                className="text-meta font-medium text-text-primary"
              >
                Password
              </label>
              <button
                type="button"
                title="Coming soon"
                className="text-meta text-text-tertiary transition-colors hover:text-text-primary"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
              className={inputClass}
            />
          </div>

          {message && (
            <p className="text-meta text-text-secondary" role="status">
              {message}
            </p>
          )}
          {error && (
            <p
              className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-meta text-danger-fg"
              role="alert"
            >
              {error}
            </p>
          )}

          <button type="submit" className={primaryButtonClass}>
            Sign in
          </button>
        </form>

        <p className="text-center text-meta text-text-tertiary">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-green-600 underline underline-offset-4 transition-colors hover:text-green-800"
          >
            Get started
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
