import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { profile, supabase } = await requireRole(["founder"]);
    const db = supabase as unknown as SupabaseClient;
    const { data, error } = await db.rpc("submit_ready_application", {
      p_application_id: id,
      p_founder_profile_id: profile.id
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    await db.from("pilot_events").insert({ profile_id: profile.id, event_name: "incubation_application_submitted", metadata: { applicationId: id } });
    return NextResponse.json({ submission: data });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Application submission failed." }, { status: 500 });
  }
}
