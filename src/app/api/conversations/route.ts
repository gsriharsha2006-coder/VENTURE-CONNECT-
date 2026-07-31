import { NextResponse } from "next/server";
import { AuthorizationError, requireProfile } from "@/lib/auth/server";
import { toUserRole } from "@/lib/auth/roles";
import { canAccessMessaging } from "@/lib/subscription/plans";
import { normalizeSubscriptionPlan } from "@/lib/subscription/plans";

export async function GET() {
  try {
    const { profile, supabase } = await requireProfile();
    if (!canAccessMessaging({
      id: profile.id,
      user_id: profile.user_id,
      full_name: profile.full_name ?? "Member",
      email: profile.email ?? "",
      role: toUserRole(profile.role),
      plan: normalizeSubscriptionPlan(profile.plan),
      free_report_used: false,
      reports_used_this_month: 0
    })) {
      return NextResponse.json(
        { error: "Messaging requires Student Pro or Founder Pro after reviewer interest", conversations: [] },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("conversation_members")
      .select(`
        conversation_id,
        member_role,
        last_read_at,
        conversation:conversations(
          id,
          application_id,
          validation_booking_id,
          programme_context_id,
          organisation_id,
          context_type,
          authorization_reason,
          status,
          created_at,
          updated_at
        )
      `)
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .order("updated_at", { referencedTable: "conversations", ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ conversations: data ?? [] });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to load conversations." }, { status: 500 });
  }
}
