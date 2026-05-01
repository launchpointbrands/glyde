import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Glyde
          </p>
          <h1 className="text-2xl font-medium">Create an advisor account</h1>
          <p className="text-sm text-muted-foreground">
            You&apos;ll be attached to Demo Firm.
          </p>
        </div>

        <form action={signUp} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">At least 6 characters.</p>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
