/**
 * Public AI provider abstraction for VC Readiness Reports.
 *
 * Providers fall back to deterministic local report generation when their API
 * key is absent or a remote request fails.
 */
export { getAIProvider } from "@/lib/ai/provider";
export type { AIProviderName } from "@/lib/ai/provider";
export type { AIProvider, ReportGenerationInput } from "@/lib/ai/providers/types";
