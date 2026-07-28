import "server-only";

import { MockProvider, OpenAIReportProvider } from "./providers";
import { AIProviderError, type AIProvider } from "./providers/types";

export type AIProviderName = "openai" | "mock";

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

// Retained temporarily so the previous Gemini implementation can be audited or
// removed after real OpenAI verification. Gemini is no longer an active fallback.
export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getAIProvider(): AIProvider {
  if (isOpenAIConfigured()) return new OpenAIReportProvider();
  if (process.env.NODE_ENV === "development") return new MockProvider();
  throw new AIProviderError("NOT_CONFIGURED", "OpenAI is not configured on the server.");
}
