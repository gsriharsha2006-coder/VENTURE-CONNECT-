import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ReportRequest = {
  startupName: string;
  problem: string;
  solution: string;
  market?: string;
  traction?: string;
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = (await req.json()) as ReportRequest;
  const apiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    return Response.json({
      readiness: 84,
      validation: `Mock investor-grade report for ${body.startupName}. Add an AI provider key for live generation.`,
      market: "Strong early demand signal if traction is backed by paid usage and a narrow ICP.",
      nextSteps: [
        "Quantify buyer ROI in the first five deck slides.",
        "Add competitor positioning by workflow and procurement owner.",
        "Convert traction into investor-ready cohort metrics."
      ]
    });
  }

  // Production path:
  // 1. Build a structured prompt from startup data and existing reports.
  // 2. Call OpenAI Responses API or Gemini from this Edge Function.
  // 3. Store JSON output in public.ai_reports with the service role key.
  // 4. Return report id and generated JSON to the client.
  return Response.json({
    readiness: 84,
    validation: `AI provider key detected for ${body.startupName}. Connect provider call in this function.`,
    providerReady: true
  });
});
