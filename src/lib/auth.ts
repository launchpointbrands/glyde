"use server";

// Email verification flow uses Supabase's OTP code (not the magic-link
// ConfirmationURL). Required Supabase dashboard config:
//   Authentication → Providers → Email → enable "Confirm email"
//   Authentication → Email Templates → "Confirm signup" template uses
//     {{ .Token }} for the 6-digit code (instead of {{ .ConfirmationURL }})

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      // No redirect URL → Supabase sends the 6-digit OTP code instead of
      // a magic-link confirmation URL.
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");

  // Dev mode (email confirmation off): session is created immediately,
  // skip the OTP screen.
  if (data.session) {
    redirect("/onboarding");
  }

  // Production: session arrives after the user enters the OTP. Carry
  // the email through so the verify page knows who's verifying.
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// OTP verification — called from the verify-email client form. Returns
// `{ error }` instead of redirecting on failure so the form can render
// the error inline without losing the user's typed digits. Success
// navigation is handled client-side via router.push.
export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null };
}

export async function resendVerifyOtp(
  email: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  return { error: error?.message ?? null };
}
