import { getTemplateDef } from "@/lib/templates";
import type { AiReport, IdeaWorkspaceItem, WorkspaceTemplate } from "@/lib/types";

function scoreFromContent(text: string, base: number): number {
  const len = text.trim().length;
  if (len > 400) return Math.min(95, base + 12);
  if (len > 150) return Math.min(88, base + 6);
  if (len > 40) return base;
  return Math.max(42, base - 18);
}

function aggregateSectionText(workspace: IdeaWorkspaceItem): string {
  return Object.values(workspace.sections).join("\n").toLowerCase();
}

function templateModifiers(template: WorkspaceTemplate, workspace: IdeaWorkspaceItem): Partial<AiReport> & { focusNotes: string[] } {
  const text = aggregateSectionText(workspace);
  const focusNotes: string[] = getTemplateDef(template).analysisFocus.map(
    (focus) => `${focus}: analyzed against workspace content for ${workspace.name}.`
  );

  switch (template) {
    case "ai-project":
      const hasModel = text.includes("model") || text.includes("gpt") || text.includes("llm");
      const hasData = text.includes("dataset") || text.includes("data");
      return {
        focusNotes,
        readiness: hasModel && hasData ? 84 : 71,
        overallScore: hasModel ? 82 : 68,
        startupScore: scoreFromContent(workspace.sections.ai_solution ?? "", 74),
        market: "AI feasibility review weights model choice, dataset quality, inference cost, and ethical exposure. Infrastructure readiness is scored against stated stack and scalability notes.",
        validation: hasData
          ? "Dataset and solution sections provide enough signal for a credible AI diligence pass. Expand on evaluation metrics and production monitoring."
          : "AI solution is outlined but dataset and evaluation evidence need depth before investor meetings.",
        recommendation: hasModel && hasData ? "Watchlist" : "Needs Work",
        scorecard: [
          { label: "AI Feasibility", value: scoreFromContent(workspace.sections.ai_solution ?? "", 76), status: "Strong" },
          { label: "Model Selection", value: scoreFromContent(workspace.sections.ai_model_used ?? "", 72), status: "Developing" },
          { label: "Dataset Quality", value: scoreFromContent(workspace.sections.dataset ?? "", 70), status: "Developing" },
          { label: "AI Scalability", value: scoreFromContent(workspace.sections.scalability ?? "", 74), status: "Strong" },
          { label: "Infrastructure", value: scoreFromContent(workspace.sections.technology_stack ?? "", 73), status: "Developing" },
          { label: "Ethical Risk", value: scoreFromContent(workspace.sections.risks ?? "", 68), status: "Developing" }
        ]
      };
    case "saas":
      const hasPricing = (workspace.sections.pricing?.length ?? 0) > 30;
      const hasKpis = (workspace.sections.kpis?.length ?? 0) > 30;
      return {
        focusNotes,
        readiness: hasPricing && hasKpis ? 86 : 72,
        overallScore: hasKpis ? 83 : 70,
        startupScore: scoreFromContent(workspace.sections.product_overview ?? "", 75),
        market: "SaaS analysis emphasizes ARR trajectory, pricing power, CAC/LTV balance, retention mechanics, and churn drivers visible in workspace sections.",
        validation: hasKpis
          ? "KPI and retention sections support a venture-style SaaS diagnostic. Add cohort retention and expansion revenue proof."
          : "Product narrative is clear; unit economics and churn analysis need quantification for premium reports.",
        recommendation: hasPricing ? "Investable" : "Watchlist",
        scorecard: [
          { label: "ARR Potential", value: scoreFromContent(workspace.sections.mrr_growth ?? "", 78), status: "Strong" },
          { label: "Pricing Power", value: scoreFromContent(workspace.sections.pricing_model ?? "", 74), status: "Developing" },
          { label: "GTM Efficiency", value: scoreFromContent(workspace.sections.go_to_market ?? "", 71), status: "Developing" },
          { label: "Product Depth", value: scoreFromContent(workspace.sections.core_features ?? "", 76), status: "Strong" },
          { label: "Retention Signal", value: scoreFromContent(workspace.sections.mrr_growth ?? "", 77), status: "Strong" },
          { label: "PMF Signal", value: scoreFromContent(workspace.sections.target_users ?? "", 73), status: "Developing" }
        ]
      };
    case "hackathon":
      const hasDemo = (workspace.sections.demo?.length ?? 0) > 8;
      const hasInnovation = (workspace.sections.solution?.length ?? 0) > 40;
      return {
        focusNotes,
        readiness: hasDemo ? 79 : 65,
        overallScore: hasInnovation ? 80 : 67,
        startupScore: scoreFromContent(workspace.sections.solution ?? "", 72),
        market: "Hackathon diligence scores innovation, demo readiness, presentation flow, and post-hack commercialization path rather than mature revenue metrics.",
        validation: hasDemo
          ? "Demo and innovation sections support a credible judging narrative. Strengthen future-scope commercialization for investor conversion."
          : "Concept is interesting; demo link and presentation notes need completion before submission.",
        recommendation: hasDemo && hasInnovation ? "Watchlist" : "Needs Work",
        scorecard: [
          { label: "Innovation", value: scoreFromContent(workspace.sections.solution ?? "", 82), status: "Excellent" },
          { label: "Technical Execution", value: scoreFromContent(workspace.sections.tech_used ?? "", 76), status: "Strong" },
          { label: "Demo Quality", value: scoreFromContent(workspace.sections.demo ?? "", 74), status: "Developing" },
          { label: "Impact", value: scoreFromContent(workspace.sections.impact ?? "", 70), status: "Developing" },
          { label: "Team", value: scoreFromContent(workspace.sections.team_members ?? "", 75), status: "Strong" },
          { label: "Startup Potential", value: scoreFromContent(workspace.sections.future_plans ?? "", 73), status: "Developing" }
        ]
      };
    default:
      return {
        focusNotes,
        readiness: 78,
        overallScore: 76,
        startupScore: scoreFromContent(workspace.sections.solution ?? "", 74),
        market: "General startup analysis weights market size logic, business model clarity, founder execution signals, scalability, and competitive positioning from workspace sections.",
        validation: "Workspace sections provide a baseline for venture readiness. Deepen TAM/SAM/SOM and traction evidence for investor-grade output.",
        recommendation: "Watchlist",
        scorecard: [
          { label: "Market Size", value: scoreFromContent(workspace.sections.tam ?? "", 75), status: "Developing" },
          { label: "Business Model", value: scoreFromContent(workspace.sections.business_model ?? "", 74), status: "Developing" },
          { label: "Founder Fit", value: scoreFromContent(workspace.sections.team ?? "", 72), status: "Developing" },
          { label: "Scalability", value: scoreFromContent(workspace.sections.milestones ?? "", 76), status: "Strong" },
          { label: "Investment Ready", value: scoreFromContent(workspace.sections.funding_plan ?? "", 71), status: "Developing" },
          { label: "Competitive Edge", value: scoreFromContent(workspace.sections.uvp ?? "", 77), status: "Strong" }
        ]
      };
  }
}

export function generateTemplateAwareReport(workspace: IdeaWorkspaceItem, baseReport: AiReport): AiReport {
  const mods = templateModifiers(workspace.template, workspace);
  const scorecard = (mods.scorecard ?? baseReport.scorecard).map((item) => ({
    ...item,
    status: item.status as AiReport["scorecard"][number]["status"]
  }));

  return {
    ...baseReport,
    readiness: mods.readiness ?? baseReport.readiness,
    overallScore: mods.overallScore ?? baseReport.overallScore,
    startupScore: mods.startupScore ?? baseReport.startupScore,
    market: mods.market ?? baseReport.market,
    validation: mods.validation ?? baseReport.validation,
    recommendation: (mods.recommendation as AiReport["recommendation"]) ?? baseReport.recommendation,
    scorecard,
    nextSteps: [
      ...mods.focusNotes.slice(0, 3),
      ...baseReport.nextSteps.slice(0, 2)
    ]
  };
}

export function workspaceToMarkdown(workspace: IdeaWorkspaceItem): string {
  const def = getTemplateDef(workspace.template);
  const parts = def.sections.map((s) => `## ${s.label}\n\n${workspace.sections[s.key] ?? ""}`);
  return `# ${workspace.name}\n\n${parts.join("\n\n")}`;
}
