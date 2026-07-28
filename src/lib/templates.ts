import type { WorkspaceTemplate } from "@/lib/types";

export type TemplateSection = {
  key: string;
  label: string;
  hint: string;
  required?: boolean;
};

export type WorkspaceTemplateDef = {
  id: WorkspaceTemplate;
  label: string;
  description: string;
  icon: string;
  analysisFocus: string[];
  sections: TemplateSection[];
};

const required = (key: string, label: string, hint: string): TemplateSection => ({
  key,
  label,
  hint,
  required: true
});

export const WORKSPACE_TEMPLATES: WorkspaceTemplateDef[] = [
  {
    id: "startup",
    label: "Startup Template",
    description: "Investor-ready company narrative with funding, traction, team, and one-minute video link.",
    icon: "VC",
    analysisFocus: ["Problem clarity", "Market pull", "Business model", "Team", "Traction", "Funding ask"],
    sections: [
      required("startup_name", "Startup Name", "Name of the startup or project."),
      required("problem_statement", "Problem Statement", "The urgent customer problem and why it matters now."),
      required("solution", "Solution", "How your product solves the problem and why it is meaningfully better."),
      required("target_market", "Target Market", "Who buys, who uses it, and the market wedge."),
      required("business_model", "Business Model", "Revenue model, pricing, and monetization assumptions."),
      required("competitive_advantage", "Competitive Advantage", "Your moat, differentiation, and unfair insight."),
      required("team", "Team", "Founder roles, relevant experience, and gaps."),
      required("traction", "Traction", "Pilots, users, revenue, partnerships, waitlist, or validation evidence."),
      required("funding_ask", "Funding Ask", "Amount, runway, milestones, and use of funds."),
      required("one_minute_video_link", "One-Minute Video Link", "Paste a YouTube, Google Drive, or public video link.")
    ]
  },
  {
    id: "ai-project",
    label: "AI Project Template",
    description: "Technical and commercial readiness for AI products, applied AI projects, and model-led startups.",
    icon: "AI",
    analysisFocus: ["Dataset quality", "Model architecture", "Performance evidence", "Ethics", "Commercialization"],
    sections: [
      required("ai_problem", "AI Problem", "The problem that specifically benefits from AI, not simple automation."),
      required("dataset_training", "Dataset & Training", "Data sources, training flow, labeling, evaluation, and privacy controls."),
      required("model_architecture", "Model Architecture", "Model family, architecture, inference path, and technical choices."),
      required("performance_metrics", "Performance Metrics", "Accuracy, latency, cost, benchmarks, and validation results."),
      required("applications", "Applications", "Use cases, users, workflow placement, and adoption context."),
      required("competitive_landscape", "Competitive Landscape", "Direct AI competitors, substitutes, and incumbent workflows."),
      required("ethical_considerations", "Ethical Considerations", "Bias, safety, explainability, compliance, and misuse risk."),
      required("commercialization", "Commercialization", "Pricing, buyer, sales motion, partnerships, and path to revenue.")
    ]
  },
  {
    id: "hackathon",
    label: "Hackathon Project",
    description: "Optional planning workspace for the solution, demo, team, and pitch after official organiser registration.",
    icon: "HX",
    analysisFocus: ["Demo quality", "Technical execution", "Impact", "Team", "Future startup potential"],
    sections: [
      required("project_name", "Project Name", "Name of the hackathon project."),
      required("problem", "Problem Statement", "The problem within the selected challenge track."),
      required("solution", "Proposed Solution", "What the team plans to build and how it solves the problem."),
      required("technical_architecture", "Technical Architecture", "Components, data flow, APIs, models, devices, and infrastructure."),
      required("feature_list", "Feature List", "Core experience, supporting features, and scope for the event."),
      required("team_members", "Team Roles", "Team names, responsibilities, and ownership."),
      required("tech_used", "Technology Stack", "Languages, frameworks, APIs, models, and infrastructure."),
      required("impact", "Innovation and Feasibility", "What is novel, why it can work, and the constraints to address."),
      required("demo", "Demo Plan", "Prototype flow, demo link, repository, screenshots, or walkthrough notes."),
      required("presentation_preparation", "Presentation Preparation", "Pitch narrative, evidence, judging criteria, and speaker plan."),
      required("final_submission_checklist", "Final Submission Checklist", "Official form, repository, video, deck, team details, and deadline checks."),
      required("future_plans", "Post-Hackathon Plan", "How the project can continue after the event.")
    ]
  },
  {
    id: "saas",
    label: "SaaS Template",
    description: "Subscription software workspace for product, pricing, GTM, MRR, and roadmap evidence.",
    icon: "SA",
    analysisFocus: ["Core workflow", "Pricing", "GTM", "MRR growth", "Roadmap", "Retention"],
    sections: [
      required("product_overview", "Product Overview", "What the SaaS product does and for whom."),
      required("core_features", "Core Features", "The workflow, modules, and highest-value features."),
      required("target_users", "Target Users", "Users, buyers, ICP, and buying triggers."),
      required("pricing_model", "Pricing Model", "Plans, seats, usage pricing, or hybrid monetization."),
      required("go_to_market", "Go-to-Market", "Channels, sales motion, partnerships, and growth loops."),
      required("tech_stack", "Tech Stack", "Frontend, backend, database, integrations, and infrastructure."),
      required("mrr_growth", "MRR & Growth", "MRR, users, churn, retention, expansion, or validation metrics."),
      required("roadmap", "Roadmap", "Product milestones and operating priorities.")
    ]
  },
  {
    id: "marketing",
    label: "Marketing Template",
    description: "Campaign planning workspace for positioning, channels, budget, KPIs, and timeline.",
    icon: "MK",
    analysisFocus: ["Audience", "Positioning", "Channel fit", "Budget", "KPIs", "Timeline"],
    sections: [
      required("brand_product_name", "Brand/Product Name", "Name of the brand, startup, or product."),
      required("target_audience", "Target Audience", "Segments, personas, needs, and decision triggers."),
      required("campaign_goal", "Campaign Goal", "Awareness, leads, sales, retention, or launch objective."),
      required("customer_pain_point", "Customer Pain Point", "The pain your messaging must make visible."),
      required("positioning_statement", "Positioning Statement", "Category, value, differentiation, and proof."),
      required("marketing_channels", "Marketing Channels", "Primary channels and why they fit the audience."),
      required("content_strategy", "Content Strategy", "Themes, formats, cadence, and distribution."),
      required("budget", "Budget", "Spend, channel allocation, and constraints."),
      required("kpis", "KPIs", "Metrics and success thresholds."),
      required("timeline", "Timeline", "Launch calendar, milestones, and review dates.")
    ]
  },
  {
    id: "student-project",
    label: "Student Project Template",
    description: "Academic or portfolio project structure that can become a startup application packet.",
    icon: "SP",
    analysisFocus: ["Learning outcome", "Use case", "Technology", "Demo", "Future scope"],
    sections: [
      required("project_name", "Project Name", "Name of the student project."),
      required("problem", "Problem", "The issue or need the project addresses."),
      required("solution", "Solution", "The approach and how it works."),
      required("technology_used", "Technology Used", "Tools, stack, libraries, hardware, or models."),
      required("learning_outcome", "Learning Outcome", "What the team learned and demonstrated."),
      required("use_case", "Use Case", "Where and by whom it can be used."),
      required("demo_link", "Demo Link", "Public link to demo, video, repository, or document."),
      required("team_members", "Team Members", "Names, roles, and contributions."),
      required("future_scope", "Future Scope", "Next features, research, validation, or commercialization.")
    ]
  },
  {
    id: "custom",
    label: "Custom Template",
    description: "Flexible workspace where founders can add their own manually named sections.",
    icon: "CU",
    analysisFocus: ["Founder-defined sections", "Evidence quality", "Application completeness"],
    sections: [
      required("section_1", "Custom Section 1", "Add a custom section title and content."),
      required("section_2", "Custom Section 2", "Add a custom section title and content."),
      required("section_3", "Custom Section 3", "Add a custom section title and content.")
    ]
  }
];

export function getTemplateDef(template: WorkspaceTemplate): WorkspaceTemplateDef {
  return WORKSPACE_TEMPLATES.find((t) => t.id === template) ?? WORKSPACE_TEMPLATES[0];
}

export function emptySectionsForTemplate(template: WorkspaceTemplate): Record<string, string> {
  const def = getTemplateDef(template);
  return Object.fromEntries(def.sections.map((section) => [section.key, ""]));
}

export function completionPercent(sections: Record<string, string>, template: WorkspaceTemplate): number {
  const requiredSections = getTemplateDef(template).sections.filter((section) => section.required !== false);
  if (requiredSections.length === 0) return 100;
  const filled = requiredSections.filter((section) => (sections[section.key]?.trim().length ?? 0) > 0).length;
  return Math.round((filled / requiredSections.length) * 100);
}

export function missingRequiredSections(sections: Record<string, string>, template: WorkspaceTemplate): TemplateSection[] {
  return getTemplateDef(template).sections.filter(
    (section) => section.required !== false && (sections[section.key]?.trim().length ?? 0) === 0
  );
}
