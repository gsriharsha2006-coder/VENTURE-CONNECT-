import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { profile, supabase } = await requireRole(["founder"]);
    const body = await request.json() as { answers?: Record<string, unknown>; applicationCopy?: Record<string, unknown> };
    if (!body.answers || typeof body.answers !== "object") {
      return NextResponse.json({ error: "Application answers are required." }, { status: 400 });
    }
    const db = supabase as unknown as SupabaseClient;
    const update: Record<string, unknown> = { answers_json: body.answers, updated_at: new Date().toISOString() };
    if (body.applicationCopy) update.application_copy_json = body.applicationCopy;
    const { data, error } = await db
      .from("applications")
      .update(update)
      .eq("id", id)
      .eq("founder_profile_id", profile.id)
      .eq("status", "draft")
      .select("id, quality_status, last_saved_at")
      .maybeSingle();
    if (error || !data) throw new AuthorizationError(404, "Editable application draft not found.");
    return NextResponse.json({ application: data });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "The application draft could not be saved." }, { status: 500 });
  }
}
