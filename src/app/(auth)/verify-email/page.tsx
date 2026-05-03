import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  if (!email) redirect("/signup");

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-stat font-semibold leading-tight text-text-primary">
            Check your email
          </h1>
          <p className="mt-1.5 text-meta text-text-tertiary">
            We sent a verification code to{" "}
            <span className="text-text-primary">{email}</span>. Copy it
            from your email and paste it below.
          </p>
        </div>

        <VerifyEmailForm email={email} />
      </div>
    </AuthLayout>
  );
}
