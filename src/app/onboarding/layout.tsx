import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Route guard for /onboarding:
//   unauth → /login
//   auth + already onboarded → /app

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: advisor } = await supabase
    .from("advisors")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (advisor?.onboarding_completed) redirect("/app");

  return <>{children}</>;
}
