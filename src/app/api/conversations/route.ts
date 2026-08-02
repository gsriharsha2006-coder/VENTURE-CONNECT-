import { NextResponse } from "next/server";
import { AuthorizationError, requireProfile } from "@/lib/auth/server";

export async function GET() {
  try {
    const { profile, supabase } = await requireProfile();
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
          updated_at,
          application:applications(
            id,
            idea_workspace_id,
            opportunity:opportunities(title, organizer_name),
            workspace:idea_workspaces(title)
          )
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
