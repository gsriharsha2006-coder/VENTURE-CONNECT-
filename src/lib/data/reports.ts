import { isStoredVcReportContent } from "@/lib/ai/reportSchema";
import { getBrowserSupabase, getCurrentUserId, supabaseDataError } from "@/lib/data/shared";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { pilotDemoReadinessReport } from "@/lib/pilot/demo-data";
import type { ReportType, VcReportContent } from "@/lib/types";

export type ReportHistoryItem = {
  id: string;
  workspaceId?: string;
  workspaceName: string;
  report: VcReportContent;
};

export function generateMockReport(reportType: ReportType = "Basic SWOT Report"): VcReportContent {
  return {
    tier: reportType === "Basic SWOT Report" ? "free" : "premium",
    reportType,
    planRequired: reportType === "Basic SWOT Report" ? "Free" : "Founder Pro",
    startupName: "Development workspace",
    summary: "Development-only VC Readiness Report fallback.",
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

export async function getGeneratedReports(): Promise<ReportHistoryItem[]> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("load VC Readiness Report history");
  if (!supabase || !userId) return isDemoDataEnabled() ? [{ id: "demo-readiness-report", workspaceId: "demo-workspace-campusflow", workspaceName: "CampusFlow", report: pilotDemoReadinessReport }] : [];

  const { data, error } = await supabase
    .from("vc_reports")
    .select("id, idea_workspace_id, report_content, created_at")
    .eq("founder_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw supabaseDataError("load VC Readiness Report history", error);
  return (data ?? []).map((row) => {
    if (!isStoredVcReportContent(row.report_content)) {
      throw supabaseDataError("load VC Readiness Report history", `Report ${row.id} contains invalid structured data.`);
    }
    return {
      id: row.id,
      workspaceId: row.idea_workspace_id ?? undefined,
      workspaceName: row.report_content.startupName ?? "Idea Workspace",
      report: row.report_content
    };
  });
}
