import { applications as mockApplications } from "@/lib/data";
import { getBrowserSupabase, getCurrentUserId, supabaseDataError } from "@/lib/data/shared";
import type { Application, ApplicationMethod } from "@/lib/types";

export async function getApplications(): Promise<Application[]> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("list applications");
  if (!supabase || !userId) return mockApplications;

  const { data, error } = await supabase
    .from("applications")
    .select("id, opportunity_id, idea_workspace_id, status, submitted_at, reviewed_at")
    .eq("founder_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) throw supabaseDataError("list applications", error);

  return (data ?? []).map((row) => ({
    id: row.id,
    founder_id: userId,
    opportunity_id: row.opportunity_id ?? undefined,
    idea_workspace_id: row.idea_workspace_id,
    startup: "Supabase startup",
    founder: "Current founder",
    reviewer: "Opportunity owner",
    opportunity: row.opportunity_id ?? "Opportunity",
    opportunityType: "Investor opportunity",
    status: row.status === "interested" ? "Interested" : "Submitted",
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    packet: [],
    timeline: [
      { label: "Submitted", date: row.submitted_at, complete: true },
      { label: "Under Review", date: row.reviewed_at ?? "", complete: Boolean(row.reviewed_at) }
    ]
  }));
}

export async function applyToOpportunity(input: {
  opportunityId: string;
  ideaWorkspaceId: string;
  applicationMethod: ApplicationMethod;
}) {
  if (input.applicationMethod !== "idea_workspace_application") {
    throw new Error("This opportunity is managed on the organiser website and cannot create an internal application.");
  }

  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("create application");
  if (!supabase || !userId) {
    return {
      id: `application-${Date.now()}`,
      mode: "mock-fallback" as const,
      status: "submitted"
    };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      founder_id: userId,
      opportunity_id: input.opportunityId,
      idea_workspace_id: input.ideaWorkspaceId,
      status: "submitted"
    })
    .select()
    .single();

  if (error || !data) throw supabaseDataError("create application", error ?? "No row returned.");

  return data;
}
