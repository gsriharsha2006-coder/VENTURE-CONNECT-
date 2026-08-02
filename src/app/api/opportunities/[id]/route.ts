import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { profile, role, supabase } = await requireRole(["incubator", "hackathon_organizer"]);
    const body = await request.json() as Record<string, unknown>;
    const status = String(body.status ?? "draft");
    if (!["draft", "published", "closed", "archived"].includes(status)) return NextResponse.json({ error: "Invalid opportunity status." }, { status: 400 });
    const db = supabase as unknown as SupabaseClient;
    const { data: membership } = await db.from("organisation_members").select("organisation_id").eq("profile_id", profile.id).eq("status", "active").in("membership_role", ["owner", "admin"]).limit(1).maybeSingle();
    if (!membership) throw new AuthorizationError(403, "Organisation owner or administrator access is required.");
    const expectedType = role === "hackathon_organizer" ? "Hackathon" : "Incubator program";
    const { data: current } = await db.from("opportunities").select("id, status, application_method").eq("id", id).eq("organisation_id", membership.organisation_id).eq("opportunity_type", expectedType).maybeSingle();
    if (!current) throw new AuthorizationError(404, "Editable opportunity not found.");
    const terminalTransition = current.status === "published" && ["closed", "archived"].includes(status);
    if (current.status === "published" && !terminalTransition) {
      throw new AuthorizationError(409, "Published opportunities are immutable. Close or archive the opportunity instead.");
    }
    const update: Record<string, unknown> = terminalTransition ? { status, updated_at: new Date().toISOString() } : {
      title: String(body.title ?? "").trim(), organizer_name: String(body.organizer_name ?? "").trim(),
      guidelines: String(body.guidelines ?? "").trim(), eligibility: String(body.eligibility ?? "").trim(),
      deadline: String(body.deadline ?? ""), mode: String(body.mode ?? "Remote"), location: String(body.location ?? ""),
      venue: String(body.venue ?? "") || null, event_start_date: String(body.event_start_date ?? "") || null,
      event_end_date: String(body.event_end_date ?? "") || null, team_size: String(body.team_size ?? "") || null,
      prize_or_funding: String(body.prize_or_funding ?? ""), external_link: String(body.external_link ?? "") || null,
      official_website: String(body.official_website ?? "") || null, contact_email: String(body.contact_email ?? "") || null,
      eligibility_rules: body.eligibility_rules ?? {}, required_application_fields: Array.isArray(body.required_application_fields) ? body.required_application_fields : [],
      application_instructions: String(body.application_instructions ?? "") || null, status, updated_at: new Date().toISOString()
    };
    const { data, error } = await db.from("opportunities").update(update).eq("id", id).eq("organisation_id", membership.organisation_id).eq("opportunity_type", expectedType).in("status", ["draft", "published", "closed"]).select("id, title, status, application_method").maybeSingle();
    if (error || !data) throw new AuthorizationError(404, "Editable opportunity not found.");
    if (data.application_method === "internal_registration") {
      const formStatus = status === "published" ? "published" : status === "closed" ? "closed" : status === "archived" ? "archived" : "draft";
      await db.from("opportunity_forms").update({ status: formStatus, is_active: status === "published", ...(status === "published" ? { published_at: new Date().toISOString() } : {}), updated_at: new Date().toISOString() }).eq("opportunity_id", id).eq("organisation_id", membership.organisation_id);
    }
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Opportunity update failed." }, { status: 500 });
  }
}
