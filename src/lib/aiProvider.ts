/**
 * Public AI provider abstraction for VC Readiness Reports.
 *
 * Development uses a deterministic mock only when OPENAI_API_KEY is absent.
 * A configured OpenAI failure never silently falls back to mock output.
 */
export { getAIProvider, isOpenAIConfigured, isGeminiConfigured } from "@/lib/ai/provider";
export type { AIProviderName } from "@/lib/ai/provider";
export { AIProviderError } from "@/lib/ai/providers/types";
export type { AIProvider, AIProviderErrorCode, ReportGenerationInput } from "@/lib/ai/providers/types";
