import { NextResponse } from "next/server";
import { computeEntitlements } from "@/lib/subscription/plans";
import { createServiceClient, getAuthUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  if (!supabase) {
    const profile: Profile = {
      id: "prototype-founder",
      full_name: "Prototype Founder",
      email: "prototype@venture-connect.local",
      role: "Founder",
      plan: "Free",
      free_report_used: false,
      reports_used_this_month: 0
    };
    return NextResponse.json({ profile, entitlements: computeEntitlements(profile), subscription: null, mode: "mock-fallback" });
  }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const entitlements = computeEntitlements(profile);

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return NextResponse.json({ profile, entitlements, subscription });
}
