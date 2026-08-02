import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ApplicationWizard } from "@/components/applications/ApplicationWizard";
import { requireRole } from "@/lib/auth/server";

export default async function OpportunityApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { authUserId, profile, supabase } = await requireRole(["founder"]);
  const db = supabase as unknown as SupabaseClient;
  const [{ data: opportunity }, { data: workspaces }] = await Promise.all([
    db.from("opportunities").select("id, title, organizer_name, eligibility, deadline, application_method").eq("id", id).maybeSingle(),
    db.from("idea_workspaces").select("id, title, stage, sections_json").eq("founder_id", authUserId).eq("archived", false).order("updated_at", { ascending: false })
  ]);
  if (!opportunity || opportunity.application_method !== "idea_workspace_application") notFound();
  return <ApplicationWizard opportunity={{ id: opportunity.id, title: opportunity.title, organisationName: opportunity.organizer_name ?? "Receiving organisation", eligibility: opportunity.eligibility ?? "See opportunity details", deadline: opportunity.deadline ?? "Not specified" }} founderName={profile.full_name ?? ""} workspaces={(workspaces ?? []).map((item) => ({ id: item.id, title: item.title, stage: item.stage, sections: (item.sections_json ?? {}) as Record<string, unknown> }))} />;
}
