import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";

const workspaceMethods = new Set(["idea_workspace_application"]);

export async function POST(request: Request) {
  try {
    const { authUserId, profile, supabase } = await requireRole(["founder"]);
    const body = await request.json() as {
      opportunityId?: string;
      ideaWorkspaceId?: string;
      answers?: Record<string, unknown>;
      applicationCopy?: Record<string, unknown>;
    };
    if (!body.opportunityId || !body.ideaWorkspaceId) {
      return NextResponse.json({ error: "An opportunity and Idea Workspace document are required." }, { status: 400 });
    }

    const db = supabase as unknown as SupabaseClient;
    const [{ data: opportunity }, { data: workspace }] = await Promise.all([
      db.from("opportunities").select("id, organisation_id, application_method").eq("id", body.opportunityId).maybeSingle(),
      db.from("idea_workspaces").select("id, founder_id, title, sections_json, stage").eq("id", body.ideaWorkspaceId).eq("founder_id", authUserId).maybeSingle()
    ]);
    if (!opportunity || !workspace) throw new AuthorizationError(404, "The opportunity or Idea Workspace document was not found.");
    if (!workspaceMethods.has(String(opportunity.application_method))) {
      throw new AuthorizationError(409, "This opportunity does not use the Idea Workspace application flow.");
    }
    if (!opportunity.organisation_id) throw new AuthorizationError(409, "This opportunity is not linked to a receiving organisation.");

    const applicationCopy = {
      workspaceId: workspace.id,
      workspaceTitle: workspace.title,
      workspaceStage: workspace.stage,
      masterSectionsAtCreation: workspace.sections_json,
      ...(body.applicationCopy ?? {})
    };
    const { data, error } = await db.from("applications").insert({
      founder_id: authUserId,
      founder_profile_id: profile.id,
      opportunity_id: opportunity.id,
      organisation_id: opportunity.organisation_id,
      idea_workspace_id: workspace.id,
      application_copy_json: applicationCopy,
      answers_json: body.answers ?? {},
      quality_status: "quality_check_required",
      status: "draft"
    }).select("id, status, quality_status, last_saved_at").single();
    if (error || !data) throw new Error("The application draft could not be created.");
    await db.from("pilot_events").insert({ profile_id: profile.id, event_name: "incubation_application_started", metadata: { applicationId: data.id, opportunityId: opportunity.id } });
    return NextResponse.json({ application: data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Application draft creation failed." }, { status: 500 });
  }
}
