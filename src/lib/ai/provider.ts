import { GeminiProvider, OpenAIProvider, SarvamProvider } from "./providers";
import type { AIProvider } from "./providers/types";

export type AIProviderName = "gemini" | "sarvam" | "openai";

export function getAIProvider(name?: AIProviderName): AIProvider {
  const provider = name ?? (process.env.AI_PROVIDER as AIProviderName) ?? "gemini";
  if (provider === "sarvam") return new SarvamProvider();
  if (provider === "openai") return new OpenAIProvider();
  return new GeminiProvider();
}
