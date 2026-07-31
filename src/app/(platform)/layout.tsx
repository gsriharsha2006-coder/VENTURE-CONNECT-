import { AppShell } from "@/components/layout/AppShell";
import { redirect } from "next/navigation";
import { resolveAuthenticatedProfile } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

export default async function PlatformLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) redirect("/auth?reason=configuration");

  let context: Awaited<ReturnType<typeof resolveAuthenticatedProfile>> = null;
  try {
    context = await resolveAuthenticatedProfile();
  } catch {
    redirect("/auth?reason=account-unavailable");
  }

  if (!context) redirect("/auth?reason=session-required");
  return <AppShell role={context.profile.role}>{children}</AppShell>;
}
