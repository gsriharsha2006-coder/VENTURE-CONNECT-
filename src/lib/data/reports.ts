import { getBrowserSupabase, getCurrentUserId } from "@/lib/data/shared";
import type { ReportType, SubscriptionPlan, VcReportContent } from "@/lib/types";

export function generateMockReport(reportType: ReportType = "Basic SWOT Report"): VcReportContent {
  return {
    tier: reportType === "Basic SWOT Report" ? "free" : "premium",
    reportType,
    planRequired: reportType === "Basic SWOT Report" ? "Free" : "Founder Pro",
    overallScore: 82,
    finalRecommendation: "Investor Conversation Ready",
    sections: [
      {
        title: "Readiness summary",
        body: "Mock VC Readiness Report generated from the current Idea Workspace context.",
        score: 82
      }
    ],
    improvementSuggestions: ["Clarify traction evidence", "Tighten funding ask", "Add customer proof"],
    generatedAt: new Date().toISOString()
  };
}

export async function saveGeneratedReport(input: {
  ideaWorkspaceId?: string | null;
  report: VcReportContent;
  planRequired?: SubscriptionPlan;
}) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return { mode: "mock-fallback" as const, report: input.report };

  const { data, error } = await supabase
    .from("vc_reports")
    .insert({
      founder_id: userId,
      idea_workspace_id: input.ideaWorkspaceId ?? null,
      report_type: input.report.reportType,
      plan_required: input.planRequired ?? input.report.planRequired,
      report_content: input.report,
      score: input.report.overallScore
    })
    .select()
    .single();

  if (error || !data) return { mode: "mock-fallback" as const, report: input.report };
  return data;
}

