import { getTemplateDef } from "@/lib/templates";
import type { ReportSection, VcReportContent } from "@/lib/types";
import type { AIProvider, ReportGenerationInput } from "./types";

function textFromSections(sections: Record<string, string>): string {
  return Object.entries(sections)
    .filter(([, value]) => value?.trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function scoreFromInput(input: ReportGenerationInput): number {
  const filled = Object.values(input.sections).filter((value) => value.trim().length > 0).length;
  const base = input.reportType === "Basic SWOT Report" ? 58 : 66;
  return Math.max(42, Math.min(94, base + filled * 3));
}

function recommendation(score: number): VcReportContent["finalRecommendation"] {
  if (score >= 88) return "Strong Candidate";
  if (score >= 78) return "Investor Conversation Ready";
  if (score >= 68) return "Incubator Ready";
  if (score >= 55) return "Needs Validation";
  return "Not Ready";
}

function reportSections(input: ReportGenerationInput, score: number): ReportSection[] {
  const template = getTemplateDef(input.template);
  const evidence = textFromSections(input.sections).slice(0, 420) || "The selected Idea Workspace has limited founder-entered evidence.";

  switch (input.reportType) {
    case "Basic SWOT Report":
      return [
        { title: "Strengths", items: ["Structured founder document exists", "Problem and solution can be reviewed in one workflow", "Application packet is easier for reviewers to compare"] },
        { title: "Weaknesses", items: score < 75 ? ["Several required sections need more evidence"] : ["Market sizing and defensibility can be sharper"] },
        { title: "Opportunities", items: ["Use verified opportunities to test demand", "Turn workspace evidence into investor diligence answers"] },
        { title: "Threats", items: ["Execution timeline risk", "Competitive response", "Insufficient traction evidence"] },
        { title: "Short Recommendation", body: score >= 70 ? "Proceed to relevant applications after checking missing proof points." : "Complete the remaining workspace sections before applying to investor-led opportunities.", score }
      ];
    case "Premium SWOT Analysis":
      return [
        { title: "Detailed Strengths", body: `${input.workspaceName} has a structured ${template.label} foundation. ${evidence}` },
        { title: "Detailed Weaknesses", items: ["Quantify market size with bottom-up assumptions", "Attach validation proof and founder references", "Clarify immediate milestone tied to capital or program support"] },
        { title: "Market Opportunities", items: template.analysisFocus.slice(0, 4) },
        { title: "Execution Threats", items: ["Slow customer discovery", "Unclear ownership for growth", "Underestimated compliance or integration cost"] },
        { title: "Founder Readiness", body: "Founder readiness improves when team responsibilities, traction, and risk mitigation are explicit in the workspace.", score }
      ];
    case "Full Brief Report":
      return [
        { title: "Executive Summary", body: `${input.workspaceName} is reviewed as a ${template.label}. The report evaluates problem clarity, solution strength, target market, business model, and investor readiness.` },
        { title: "Problem Clarity", body: input.sections.problem_statement || input.sections.problem || input.sections.ai_problem || "Problem statement needs clearer customer pain and urgency." },
        { title: "Solution Strength", body: input.sections.solution || input.sections.product_overview || "Solution section needs stronger differentiation and proof." },
        { title: "Target Market", body: input.sections.target_market || input.sections.target_users || "Target market should name buyer, user, and reachable wedge." },
        { title: "Investment Readiness Summary", body: `Current readiness is ${score}/100 with a ${recommendation(score)} recommendation.`, score }
      ];
    case "Bottleneck Report":
      return [
        { title: "Main Blockers", items: ["Evidence depth", "Go-to-market sequence", "Traction proof", "Team gap visibility"] },
        { title: "Product Bottlenecks", body: "Clarify MVP scope, implementation complexity, and what must be true for repeat usage." },
        { title: "Market Bottlenecks", body: "Replace broad market claims with a reachable segment, buyer, trigger, and channel." },
        { title: "Revenue Bottlenecks", body: "Tie pricing, willingness to pay, and use of funds to the next validation milestone." },
        { title: "Priority Fixes", items: ["Complete all required workspace fields", "Add quantified traction", "Attach customer proof", "Generate a fresh report after edits"] }
      ];
    case "Competitor Defensive Report":
      return [
        { title: "Competitor Landscape", body: input.sections.competitive_landscape || input.sections.competitive_advantage || "Map direct, indirect, and incumbent alternatives." },
        { title: "Differentiation", body: "State the wedge in one sentence and prove why it is hard to copy." },
        { title: "Moat Strength", score: Math.max(45, score - 8), body: "Moat improves with proprietary data, distribution advantage, workflow lock-in, or regulatory know-how." },
        { title: "Copy Risk", items: ["Feature copying", "Distribution capture by incumbents", "Pricing pressure"] },
        { title: "Strategic Recommendations", items: ["Name top alternatives", "Show switching cost", "Defend distribution channel"] }
      ];
    case "Roadmap Report":
      return [
        { title: "30-Day Roadmap", items: ["Complete evidence gaps", "Run 5 customer interviews", "Prepare application-ready packet"] },
        { title: "90-Day Roadmap", items: ["Close first pilot or cohort", "Validate pricing", "Publish traction update"] },
        { title: "6-Month Roadmap", items: ["Reach repeatable acquisition signal", "Build investor data room", "Prepare fundraising milestones"] },
        { title: "Product Milestones", body: input.sections.roadmap || "Define product milestones tied to validation, revenue, and fundraising." },
        { title: "Fundraising Milestones", body: "Raise only after the next proof point materially reduces investor risk." }
      ];
    case "Investor Scorecard Report":
      return [
        { title: "Investor Readiness Score", score, body: `${input.workspaceName} currently scores ${score}/100.` },
        { title: "Market Potential Score", score: Math.min(100, score + 2), body: "Market potential depends on reachable segment clarity and willingness to pay." },
        { title: "Product Clarity Score", score: Math.min(100, score + 4), body: "Product clarity is strongest when workflow, buyer, and outcome are visible." },
        { title: "Team Score", score: Math.max(40, score - 5), body: input.sections.team || "Team section should name roles, founder-market fit, and gaps." },
        { title: "Final Recommendation", body: recommendation(score), score }
      ];
  }
}

function buildMockReport(input: ReportGenerationInput): VcReportContent {
  const score = scoreFromInput(input);
  return {
    tier: input.reportType === "Basic SWOT Report" ? "free" : "premium",
    reportType: input.reportType,
    planRequired:
      input.reportType === "Roadmap Report" || input.reportType === "Investor Scorecard Report"
        ? "Founder Pro"
        : input.reportType === "Basic SWOT Report"
          ? "Free"
          : "Student Pro",
    overallScore: score,
    finalRecommendation: recommendation(score),
    sections: reportSections(input, score),
    improvementSuggestions: [
      "Add quantified customer or user proof to the weakest workspace sections.",
      "Clarify who pays, how often they feel the pain, and why the timing matters now.",
      "Turn the next milestone into a measurable application or fundraising proof point."
    ],
    generatedAt: new Date().toISOString()
  };
}

abstract class JsonProvider implements AIProvider {
  abstract readonly name: string;
  protected abstract apiKey(): string | undefined;
  protected abstract endpoint(apiKey: string): string;
  protected abstract payload(input: ReportGenerationInput): unknown;
  protected abstract extractText(json: unknown): string | undefined;

  async generateReport(input: ReportGenerationInput) {
    const key = this.apiKey();
    if (!key) return buildMockReport(input);

    try {
      const res = await fetch(this.endpoint(key), {
        method: "POST",
        headers: this.name === "openai"
          ? { "Content-Type": "application/json", Authorization: `Bearer ${key}` }
          : { "Content-Type": "application/json" },
        body: JSON.stringify(this.payload(input))
      });
      if (!res.ok) throw new Error(`${this.name} API ${res.status}`);
      const json = await res.json();
      const text = this.extractText(json);
      if (!text) throw new Error("Empty AI response");
      const parsed = JSON.parse(text) as VcReportContent;
      return {
        ...parsed,
        reportType: input.reportType,
        generatedAt: parsed.generatedAt ?? new Date().toISOString()
      };
    } catch (error) {
      console.error(`[${this.name}Provider]`, error);
      return buildMockReport(input);
    }
  }

  protected prompt(input: ReportGenerationInput): string {
    return [
      "You are a senior VC analyst for Venture Connect.",
      "Generate JSON only matching this shape: tier, reportType, planRequired, overallScore, finalRecommendation, sections [{title, body, items, score}], improvementSuggestions, generatedAt.",
      `Report type: ${input.reportType}.`,
      `Workspace: ${input.workspaceName}. Template: ${input.template}.`,
      `Sections: ${JSON.stringify(input.sections)}`
    ].join(" ");
  }
}

export class GeminiProvider extends JsonProvider {
  readonly name = "gemini";
  protected apiKey() {
    return process.env.GEMINI_API_KEY;
  }
  protected endpoint(apiKey: string) {
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  }
  protected payload(input: ReportGenerationInput) {
    return {
      contents: [{ parts: [{ text: this.prompt(input) }] }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 4096 }
    };
  }
  protected extractText(json: unknown) {
    const data = json as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }
}

export class SarvamProvider extends JsonProvider {
  readonly name = "sarvam";
  protected apiKey() {
    return process.env.SARVAM_API_KEY;
  }
  protected endpoint() {
    return "https://api.sarvam.ai/v1/chat/completions";
  }
  protected payload(input: ReportGenerationInput) {
    return {
      model: "sarvam-m",
      messages: [
        { role: "system", content: "You are a VC analyst. Return JSON only." },
        { role: "user", content: this.prompt(input) }
      ],
      temperature: 0.35
    };
  }
  protected extractText(json: unknown) {
    const data = json as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content;
  }
}

export class OpenAIProvider extends JsonProvider {
  readonly name = "openai";
  protected apiKey() {
    return process.env.OPENAI_API_KEY;
  }
  protected endpoint() {
    return "https://api.openai.com/v1/chat/completions";
  }
  protected payload(input: ReportGenerationInput) {
    return {
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a senior VC analyst. Return valid JSON only." },
        { role: "user", content: this.prompt(input) }
      ],
      temperature: 0.35
    };
  }
  protected extractText(json: unknown) {
    const data = json as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content;
  }
}
