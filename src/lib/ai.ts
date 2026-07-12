import { aiReport } from "@/lib/data";
import type { AiReport } from "@/lib/types";

export type AiReportRequest = {
  startupName: string;
  problem: string;
  solution: string;
  market?: string;
  traction?: string;
};

export async function generateAiReport(input: AiReportRequest): Promise<AiReport> {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openAiKey && !geminiKey) {
    return {
      ...aiReport,
      validation: `${aiReport.validation} Mock report generated for ${input.startupName || "your startup"}.`
    };
  }

  // Production hook: call OpenAI or Gemini from a server-only route/edge function.
  // The prototype returns a shaped response so the UI remains useful without keys.
  return {
    ...aiReport,
    market: `${aiReport.market} This server route is ready to be connected to ${
      openAiKey ? "OpenAI" : "Gemini"
    }.`
  };
}
