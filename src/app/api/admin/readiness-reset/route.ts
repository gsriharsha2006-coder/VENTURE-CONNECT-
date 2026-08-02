import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";
import { createServiceClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  try {
    await requireRole(["admin"]);
    const { email } = await request.json() as { email?: string };
    const normalized = email?.trim().toLowerCase() ?? "";
    if (!normalized) return NextResponse.json({ error: "Founder email is required." }, { status: 400 });
    const service = createServiceClient();
    if (!service) throw new AuthorizationError(503, "Server-only Supabase administration is not configured.");
    const { data: profile } = await service.from("profiles").select("id, user_id, role").eq("email", normalized).eq("role", "founder").maybeSingle();
    if (!profile) throw new AuthorizationError(404, "Founder test account not found.");
    const { error: requestError } = await service.from("vc_report_generation_requests").delete().eq("founder_id", profile.user_id);
    if (requestError) throw requestError;
    const { error: reportError } = await service.from("vc_reports").delete().eq("founder_id", profile.user_id).eq("report_type", "Basic SWOT Report");
    if (reportError) throw reportError;
    const { error: subscriptionError } = await service.from("subscriptions").update({ free_swot_used: false, report_count_used: 0, updated_at: new Date().toISOString() }).eq("user_id", profile.user_id);
    if (subscriptionError) throw subscriptionError;
    return NextResponse.json({ reset: true });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Pilot readiness reset failed." }, { status: 500 });
  }
}
