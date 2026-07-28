import type { ReportType, VcReportContent, WorkspaceTemplate } from "@/lib/types";

export type ReportGenerationInput = {
  workspaceName: string;
  template: WorkspaceTemplate;
  sections: Record<string, string>;
  reportType: ReportType;
  completionPercentage: number;
};

export interface AIProvider {
  readonly name: "openai" | "gemini" | "mock";
  readonly model: string;
  generateReport(input: ReportGenerationInput): Promise<VcReportContent>;
}

export type AIProviderErrorCode =
  | "NOT_CONFIGURED"
  | "AUTHENTICATION"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "QUOTA"
  | "REFUSAL"
  | "INVALID_OUTPUT"
  | "PROVIDER_ERROR";

export class AIProviderError extends Error {
  constructor(public readonly code: AIProviderErrorCode, message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}
