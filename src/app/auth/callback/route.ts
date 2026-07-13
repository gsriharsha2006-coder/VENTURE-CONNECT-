import { NextResponse, type NextRequest } from "next/server";
import { dashboardForRole } from "@/lib/auth/roles";
import { createServerSupabase, getProfile } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const supabase = await createServerSupabase();

  if (!supabase || !code) {
    return NextResponse.redirect(new URL("/auth?error=invalid_callback", url.origin));
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/auth?error=auth_callback_failed", url.origin));
  }

  if (next) return NextResponse.redirect(new URL(next, url.origin));

  const profile = await getProfile(data.user.id);
  return NextResponse.redirect(new URL(dashboardForRole(profile?.role ?? "founder"), url.origin));
}
