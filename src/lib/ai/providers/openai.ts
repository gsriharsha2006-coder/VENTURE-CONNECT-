import "server-only";

import OpenAI from "openai";
import type { Response as OpenAIResponse } from "openai/resources/responses/responses";
import { buildReportPrompt, REPORT_SYSTEM_INSTRUCTION } from "@/lib/ai/reportPrompts";
import {
  buildReportJsonSchema,
  parseStructuredReportOutput,
  ReportValidationError,
  toVcReportContent
} from "@/lib/ai/reportSchema";
import { AIProviderError, type AIProvider, type ReportGenerationInput } from "./types";

export const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

const OPENAI_TIMEOUT_MS = 30_000;
const OPENAI_MAX_OUTPUT_TOKENS = 8_192;

function schemaName(reportType: string) {
  return `venture_connect_${reportType.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`.slice(0, 64);
}

function hasRefusal(response: OpenAIResponse) {
  return response.output.some((output) =>
    output.type === "message" && output.content.some((item) => item.type === "refusal")
  );
}

export class OpenAIReportProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly model: string;
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new AIProviderError("NOT_CONFIGURED", "OpenAI is not configured on the server.");

    this.model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
    this.client = new OpenAI({
      apiKey,
      maxRetries: 1,
      timeout: OPENAI_TIMEOUT_MS
    });
  }

  async generateReport(input: ReportGenerationInput) {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        store: false,
        instructions: REPORT_SYSTEM_INSTRUCTION,
        input: buildReportPrompt(input),
        max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
        text: {
          format: {
            type: "json_schema",
            name: schemaName(input.reportType),
            description: "A validated Venture Connect VC Readiness Report generated only from the selected Idea Workspace.",
            strict: true,
            schema: buildReportJsonSchema(input.reportType)
          }
        }
      });

      if (response.status === "incomplete") {
        throw new AIProviderError("INVALID_OUTPUT", "OpenAI could not complete the structured report. No report credit was consumed.");
      }
      if (hasRefusal(response)) {
        throw new AIProviderError("REFUSAL", "OpenAI could not generate this report from the supplied document.");
      }
      if (response.status !== "completed") {
        throw new AIProviderError("PROVIDER_ERROR", "OpenAI report generation did not complete.");
      }

      const text = response.output_text?.trim();
      if (!text) throw new AIProviderError("INVALID_OUTPUT", "OpenAI returned no structured report content.");

      const payload = parseStructuredReportOutput(text, input.reportType);
      return toVcReportContent(payload);
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof ReportValidationError) {
        throw new AIProviderError("INVALID_OUTPUT", "OpenAI returned an invalid structured report. No report credit was consumed.");
      }
      if (error instanceof OpenAI.APIConnectionTimeoutError) {
        throw new AIProviderError("TIMEOUT", "OpenAI report generation timed out. No report credit was consumed.");
      }
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401 || error.status === 403) {
          throw new AIProviderError("AUTHENTICATION", "OpenAI authentication failed on the server.");
        }
        if (error.status === 429) {
          if (error.code === "insufficient_quota") {
            throw new AIProviderError("QUOTA", "OpenAI API quota is unavailable. No report credit was consumed.");
          }
          throw new AIProviderError("RATE_LIMIT", "OpenAI report generation is temporarily rate limited.");
        }
      }
      throw new AIProviderError("PROVIDER_ERROR", "OpenAI report generation failed. No report credit was consumed.");
    }
  }
}
