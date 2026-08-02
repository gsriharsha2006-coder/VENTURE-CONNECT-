import "server-only";

import OpenAI from "openai";
import { buildApplicationQualityJsonSchema, parseSemanticQualityResult } from "./schema";
import type { ApplicationDraft, EligibilityRules } from "./types";

const SYSTEM_INSTRUCTION = `You review startup applications for presentation quality only.
You do not decide whether a startup is investable and you do not make a final organisation decision.
Use only the supplied application and opportunity criteria. Never perform web research or invent evidence.
Flag unsupported or contradictory claims with neutral language such as: This claim appears inconsistent with the selected startup stage. Add evidence or clarify the information.
Return concise structured output matching the supplied JSON schema.`;

export class ApplicationQualityProviderError extends Error {
  constructor(public readonly code: "NOT_CONFIGURED" | "TIMEOUT" | "RATE_LIMIT" | "INVALID_OUTPUT" | "PROVIDER_ERROR", message: string) {
    super(message);
    this.name = "ApplicationQualityProviderError";
  }
}

export async function generateSemanticQualityReview(draft: ApplicationDraft, rules: EligibilityRules) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new ApplicationQualityProviderError("NOT_CONFIGURED", "Semantic application review is not configured on the server.");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
  const client = new OpenAI({ apiKey, maxRetries: 1, timeout: 30_000 });

  try {
    const response = await client.responses.create({
      model,
      store: false,
      instructions: SYSTEM_INSTRUCTION,
      input: JSON.stringify({
        startupStage: draft.startupStage,
        sector: draft.sector,
        geography: draft.geography,
        fundingRequirement: draft.fundingRequirement ?? null,
        opportunityCriteria: rules,
        answers: draft.answers
      }),
      max_output_tokens: 4_096,
      text: {
        format: {
          type: "json_schema",
          name: "venture_connect_application_quality_check",
          strict: true,
          schema: buildApplicationQualityJsonSchema()
        }
      }
    });
    if (response.status !== "completed" || !response.output_text?.trim()) {
      throw new ApplicationQualityProviderError("INVALID_OUTPUT", "Semantic application review returned no usable result.");
    }
    return {
      result: parseSemanticQualityResult(JSON.parse(response.output_text)),
      model,
      usage: response.usage ? {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.total_tokens
      } : null
    };
  } catch (error) {
    if (error instanceof ApplicationQualityProviderError) throw error;
    if (error instanceof SyntaxError) throw new ApplicationQualityProviderError("INVALID_OUTPUT", "Semantic application review returned invalid JSON.");
    if (error instanceof OpenAI.APIConnectionTimeoutError) throw new ApplicationQualityProviderError("TIMEOUT", "Semantic application review timed out.");
    if (error instanceof OpenAI.APIError && error.status === 429) throw new ApplicationQualityProviderError("RATE_LIMIT", "Semantic application review is temporarily rate limited.");
    throw new ApplicationQualityProviderError("PROVIDER_ERROR", "Semantic application review could not be completed.");
  }
}
