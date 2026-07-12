import type { ReportType, VcReportContent, WorkspaceTemplate } from "@/lib/types";

export type ReportGenerationInput = {
  workspaceName: string;
  template: WorkspaceTemplate;
  sections: Record<string, string>;
  reportType: ReportType;
};

export interface AIProvider {
  readonly name: string;
  generateReport(input: ReportGenerationInput): Promise<VcReportContent>;
}
