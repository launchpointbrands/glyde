import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Walkthrough lives outside /app/ so it inherits neither the sidebar nor
// the case chrome — same focused-flow pattern as /onboarding.
// Auth + onboarding-completed gates are duplicated here since /app/'s
// layout is bypassed.

export default async function WalkthroughLayout({
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

  if (!advisor?.onboarding_completed) redirect("/onboarding");

  return <>{children}</>;
}
