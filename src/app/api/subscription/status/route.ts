import { NextResponse } from "next/server";
import { AuthorizationError, requireProfile } from "@/lib/auth/server";
import { toUserRole } from "@/lib/auth/roles";
import { computeEntitlements, normalizeSubscriptionPlan } from "@/lib/subscription/plans";
import type { Profile } from "@/lib/types";

export async function GET() {
  try {
    const { authUserId, profile, supabase } = await requireProfile();
    const entitlementProfile: Profile = {
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name ?? "Member",
      email: profile.email ?? "",
      role: toUserRole(profile.role),
      plan: normalizeSubscriptionPlan(profile.plan),
      free_report_used: Boolean(profile.free_report_used),
      reports_used_this_month: Number(profile.reports_used_this_month ?? 0)
    };

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authUserId)
      .eq("status", "active")
      .maybeSingle();

    return NextResponse.json({
      profile,
      entitlements: computeEntitlements(entitlementProfile),
      subscription
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to load subscription status." }, { status: 500 });
  }
}
