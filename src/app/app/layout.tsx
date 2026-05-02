import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Gate /app on onboarding completion. New advisors are bounced to the
  // onboarding flow; existing advisors are backfilled to true so they
  // pass through.
  const { data: advisor } = await supabase
    .from("advisors")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!advisor?.onboarding_completed) {
    redirect("/onboarding");
  }

  // Sidebar is fixed-position and hovers-to-expand; content keeps a
  // constant left padding equal to the collapsed rail width.
  return (
    <div className="min-h-full pl-0 md:pl-14">
      <Sidebar />
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
    </div>
  );
}
