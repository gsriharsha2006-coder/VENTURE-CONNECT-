import type { WorkspaceTemplate } from "@/lib/types";

export type TemplateSection = {
  key: string;
  label: string;
  hint: string;
  prompts: string[];
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

const required = (key: string, label: string, hint: string, prompts: string[]): TemplateSection => ({
  key,
  label,
  hint,
  prompts,
  required: true
});

export const WORKSPACE_TEMPLATES: WorkspaceTemplateDef[] = [
  {
    id: "startup",
    label: "Startup Template",
    description: "A structured, evidence-led startup document for incubation applications and readiness review.",
    icon: "VC",
    analysisFocus: ["Problem clarity", "Solution clarity", "Customer clarity", "Validation", "Business model", "Team readiness"],
    sections: [
      required("basic_information", "Basic Information", "Introduce the startup and founder in clear, factual language.", ["Startup name", "Startup category", "Current stage", "Founder name", "College", "Location", "Short startup summary"]),
      required("problem", "Problem", "Describe the problem without exaggeration or unsupported market claims.", ["What problem exists?", "Who experiences the problem?", "How are they currently handling it?", "Why is the problem important?"]),
      required("solution", "Solution", "Explain the proposed solution and how it addresses the stated problem.", ["What is the proposed solution?", "How does it solve the stated problem?", "What is different about it?"]),
      required("target_customer", "Target Customer", "Identify the first realistic user and buyer segment.", ["Primary user", "Paying customer", "Initial target segment", "Target geography"]),
      required("existing_alternatives", "Existing Alternatives", "Describe current workarounds and competitors honestly.", ["Current alternatives", "Main competitors", "Why users may switch"]),
      required("product_description", "Product Description", "State what exists today and how it is built.", ["Product type", "Current product status", "Core features", "Technology used", "Demo or website link"]),
      required("business_model", "Business Model", "Describe the proposed exchange of value without inventing revenue.", ["Who pays?", "What do they pay for?", "Proposed pricing", "Expected revenue model"]),
      required("customer_validation", "Customer Validation", "Record real validation activity. Honest zero values are acceptable.", ["Number of interviews", "Surveys conducted", "Pilot users", "Letters of interest", "Feedback received", "Validation evidence"]),
      required("progress_traction", "Current Progress or Traction", "State the current position accurately. You may write Not yet validated, No paying users, or Prototype not completed.", ["Product stage", "Users", "Paying users", "Revenue", "Partnerships", "Pilot status", "Supporting explanation"]),
      required("team", "Team", "List each team member and the experience relevant to the work.", ["Team member name", "Role", "Skills", "Relevant experience"]),
      required("funding_requirement", "Funding Requirement", "State the amount required and the milestone it should enable.", ["Funding required", "Reason for the request", "Milestone enabled"]),
      required("use_of_funds", "Use of Funds", "Explain how the requested amount would be allocated.", ["Product development allocation", "Hiring allocation", "Marketing allocation", "Operations allocation", "Other allocation"]),
      required("risks_assumptions", "Risks and Assumptions", "Identify material uncertainty and how it may be tested or reduced.", ["Main assumptions", "Product risks", "Market risks", "Execution risks"])
    ]
  }
];

export function getTemplateDef(template: WorkspaceTemplate): WorkspaceTemplateDef {
  void template;
  return WORKSPACE_TEMPLATES[0];
}

export function emptySectionsForTemplate(template: WorkspaceTemplate): Record<string, string> {
  const def = getTemplateDef(template);
  return Object.fromEntries(def.sections.map((section) => [section.key, ""]));
}

export function completionPercent(sections: Record<string, string>, template: WorkspaceTemplate): number {
  const requiredSections = getTemplateDef(template).sections.filter((section) => section.required !== false);
  if (!requiredSections.length) return 100;
  const filled = requiredSections.filter((section) => (sections[section.key]?.trim().length ?? 0) > 0).length;
  return Math.round((filled / requiredSections.length) * 100);
}

export function missingRequiredSections(sections: Record<string, string>, template: WorkspaceTemplate): TemplateSection[] {
  return getTemplateDef(template).sections.filter(
    (section) => section.required !== false && (sections[section.key]?.trim().length ?? 0) === 0
  );
}
