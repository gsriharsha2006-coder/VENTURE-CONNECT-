import "server-only";

import OpenAI from "openai";
import { buildApplicationQualityJsonSchema, buildManualReviewFallback, parseSemanticQualityResult } from "./schema";
import type { ApplicationDraft, EligibilityRules } from "./types";

const SYSTEM_INSTRUCTION = `You perform a limited Application Quality Check for a student-founder application.
Evaluate only: problem clarity, problem-solution alignment, target-customer specificity, business-model clarity, internal consistency, validation explanation, and funding-use clarity when funding is requested.
Assess application completeness, clarity, consistency, and readiness for organisation review. Do not judge startup potential, investment attractiveness, valuation, market attractiveness, TAM/SAM/SOM, competitor strength, moat, defensibility, scalability, ROI, funding probability, founder or team quality, product-market-fit probability, ranking, or success probability.
Idea-stage applicants do not need revenue or traction. "Not yet" is acceptable for validation when the current evidence or planned validation is explained.
Use only the supplied application. Never browse, invent facts, rewrite the founder's idea, reveal hidden reasoning, or make an investment decision.
Return at most three genuine strengths, at most three major submission-readiness issues, and field-specific guidance that says what information to clarify without supplying business facts.
Use Manual Review only for genuine ambiguity, conflicting information, or low confidence. Return only the strict JSON schema.`;

export class ApplicationQualityProviderError extends Error {
  constructor(public readonly code: "NOT_CONFIGURED" | "TIMEOUT" | "RATE_LIMIT" | "PROVIDER_ERROR", message: string) {
    super(message);
    this.name = "ApplicationQualityProviderError";
  }
}

export async function generateSemanticQualityReview(draft: ApplicationDraft, rules: EligibilityRules) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new ApplicationQualityProviderError("NOT_CONFIGURED", "Semantic application review is not configured on the server.");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
  const client = new OpenAI({ apiKey, maxRetries: 1, timeout: 30_000 });
  const validFields = Object.keys(draft.answers);

  try {
    const response = await client.responses.create({
      model,
      store: false,
      instructions: SYSTEM_INSTRUCTION,
      input: JSON.stringify({
        startupStage: draft.startupStage,
        sector: draft.sector,
        geography: draft.geography,
        fundingRequested: typeof draft.fundingRequirement === "number" && draft.fundingRequirement > 0,
        opportunityCriteria: rules,
        answers: draft.answers
      }),
      max_output_tokens: 2_048,
      text: {
        format: {
          type: "json_schema",
          name: "venture_connect_application_quality_check",
          strict: true,
          schema: buildApplicationQualityJsonSchema(validFields)
        }
      }
    });
    const usage = response.usage ? {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.total_tokens
    } : null;
    if (response.status !== "completed" || !response.output_text?.trim()) {
      return { result: buildManualReviewFallback(), model, usage };
    }
    try {
      return { result: parseSemanticQualityResult(JSON.parse(response.output_text), validFields), model, usage };
    } catch {
      return { result: buildManualReviewFallback(), model, usage };
    }
  } catch (error) {
    if (error instanceof ApplicationQualityProviderError) throw error;
    if (error instanceof OpenAI.APIConnectionTimeoutError) throw new ApplicationQualityProviderError("TIMEOUT", "Semantic application review timed out.");
    if (error instanceof OpenAI.APIError && error.status === 429) throw new ApplicationQualityProviderError("RATE_LIMIT", "Semantic application review is temporarily rate limited.");
    throw new ApplicationQualityProviderError("PROVIDER_ERROR", "Semantic application review could not be completed.");
  }
}
