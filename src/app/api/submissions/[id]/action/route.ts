import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";
import { createConversationFromInterest } from "@/lib/messaging/service";
import { createConversationForOrganisationAction } from "@/lib/messaging/service";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile, role, supabase } = await requireRole([
      "investor",
      "incubator",
      "hackathon_organizer",
      "event_organizer",
      "admin"
    ]);
    const { id } = await params;
    const { action } = await request.json() as { action: "interested" | "request_information" | "under_review" | "shortlist" | "select" | "waitlist" | "decline" | "save" | "reject" | "ignore" };
    const databaseRole = role;
    if (["shortlist", "select", "waitlist"].includes(action) && !["hackathon_organizer", "event_organizer", "admin"].includes(databaseRole)) {
      throw new AuthorizationError(403, "Only an authorised event organiser can perform this action.");
    }
    if (["interested", "request_information"].includes(action) && ["hackathon_organizer", "event_organizer"].includes(databaseRole)) {
      throw new AuthorizationError(403, "Event applications do not open investor-style conversations.");
    }
    if (action === "interested") {
      const conversation = await createConversationFromInterest(id, profile.id);
      return NextResponse.json({ conversation, status: "interested" }, { status: 201 });
    }
    if (action === "request_information") {
      const conversation = await createConversationForOrganisationAction(id, profile.id, "request_information");
      return NextResponse.json({ conversation, status: "needs_changes" }, { status: 201 });
    }
    const db = supabase as unknown as SupabaseClient;
    if (action === "save") {
      const { data: application } = await db.from("applications").select("id, organisation_id").eq("id", id).maybeSingle();
      if (!application?.organisation_id) throw new Error("Application is not assigned to an organisation.");
      const { error } = await db.from("saved_applications").upsert({ application_id: id, organisation_id: application.organisation_id, saved_by_profile_id: profile.id }, { onConflict: "application_id,saved_by_profile_id" });
      if (error) throw error;
      return NextResponse.json({ status: "saved" });
    }
    const status = action === "under_review" ? "under_review" : action === "shortlist" ? "shortlisted" : action === "select" ? "selected" : action === "waitlist" ? "waitlisted" : action === "decline" || action === "reject" ? "rejected" : null;
    if (!status) return NextResponse.json({ error: "Unsupported application action." }, { status: 400 });
    const { data, error } = await db.from("applications").update({ status, decision_by_profile_id: profile.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
    if (error || !data) throw new Error("Application status could not be updated.");
    return NextResponse.json({ status });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
