import type { Application, IdeaWorkspaceItem, MessageThread, Opportunity, VcReportContent } from "@/lib/types";
import { emptySectionsForTemplate } from "@/lib/templates";

export const pilotDemoAccounts = [
  { label: "Demo Founder", role: "founder" },
  { label: "Demo Incubator", role: "incubator" },
  { label: "Demo Hackathon Organiser", role: "hackathon_organizer" }
] as const;

const completeSections = {
  basic_information: "CampusFlow is a student-led workflow tool at PACE Institute, currently at prototype stage in Ongole.",
  problem: "Student project teams lose deadlines because tasks, mentor feedback, and evidence are spread across chat and documents.",
  solution: "CampusFlow gives each team a shared milestone board with mentor feedback and evidence attached to every deliverable.",
  target_customer: "The first users are college project teams; departments and incubation cells are the initial paying customers in Andhra Pradesh.",
  existing_alternatives: "Teams use WhatsApp, spreadsheets, and generic task tools. CampusFlow focuses on academic milestones and review evidence.",
  product_description: "A responsive web prototype supports milestones, review comments, evidence links, and progress summaries.",
  business_model: "Institutions would pay an annual licence based on active departments after a no-cost pilot validates adoption.",
  customer_validation: "Twelve student interviews and three faculty interviews were completed. Two project teams tested the prototype for four weeks.",
  progress_traction: "Prototype completed. Two unpaid pilot teams are active; there are no paying users or revenue yet.",
  team: "A three-student team covers product, frontend engineering, and campus outreach with a faculty mentor advising on academic workflow.",
  funding_requirement: "The team is seeking Rs 2 lakh to complete accessibility work and run a measured semester pilot.",
  use_of_funds: "Rs 80,000 product development, Rs 45,000 testing, Rs 35,000 campus onboarding, Rs 25,000 operations, and Rs 15,000 contingency.",
  risks_assumptions: "The main assumption is regular faculty usage. Risks include low adoption, semester seasonality, and limited integration capacity."
};

function workspace(input: Pick<IdeaWorkspaceItem, "id" | "name" | "status" | "stage" | "sections" | "summary">): IdeaWorkspaceItem {
  return {
    ...input,
    founder_id: "demo-founder",
    template: "startup",
    title: input.name,
    visibility: "application_only",
    tags: ["PACE pilot"],
    category: "Startup Template",
    updatedAt: "Today",
    uploads: [],
    versionHistory: [{ id: `version-${input.id}`, versionNumber: 1, sections: input.sections, createdAt: "2026-08-01T09:00:00.000Z", summary: "Demo snapshot" }],
    archived: false,
    markdown: "",
    uniqueness: input.status === "Complete" ? 100 : 31,
    demand: input.status === "Complete" ? 100 : 31,
    scalability: input.status === "Complete" ? 100 : 31,
    competition: "Unknown",
    versions: 1
  };
}

export const pilotDemoWorkspaces: IdeaWorkspaceItem[] = [
  workspace({
    id: "demo-workspace-campusflow",
    name: "CampusFlow project coordination",
    status: "Complete",
    stage: "Prototype",
    summary: "A structured academic-project workflow for student teams and faculty mentors.",
    sections: completeSections
  }),
  workspace({
    id: "demo-workspace-canteenloop",
    name: "CanteenLoop pre-ordering",
    status: "In Progress",
    stage: "Idea",
    summary: "A pre-ordering concept intended to reduce queues in college canteens.",
    sections: {
      ...emptySectionsForTemplate("startup"),
      basic_information: "CanteenLoop is a student idea for campus food pre-orders.",
      problem: "Students can miss short lunch breaks while waiting in crowded canteen queues.",
      solution: "A mobile-friendly ordering page would let students choose a collection time."
    }
  })
];

function opportunity(input: Partial<Opportunity> & Pick<Opportunity, "id" | "title" | "organizer_name" | "opportunity_type" | "deadline" | "application_method">): Opportunity {
  return {
    creator_role: input.opportunity_type === "Hackathon" ? "Hackathon Organizer" : "Incubator",
    organizer_type: "Pilot organisation",
    category: input.opportunity_type === "Hackathon" ? "Student innovation" : "Incubation",
    prize_or_funding: "Mentoring and pilot support",
    eligibility: "Open to eligible student teams. Review the full programme details before applying.",
    guidelines: "Provide accurate information and follow the organiser registration instructions.",
    benefits: "Structured review and practical next-step guidance.",
    requirements: input.opportunity_type === "Hackathon" ? ["Complete organiser registration"] : ["Startup Template", "Application Quality Check"],
    tags: ["Student", "PACE pilot"],
    location: "Ongole",
    mode: "Hybrid",
    verified: true,
    trending: false,
    beginnerLevel: "Beginner",
    startupStage: "Any",
    domain: "Social Impact",
    trust_score: 90,
    saved: false,
    type: input.opportunity_type,
    applicants: 0,
    bookmarked: false,
    premium: false,
    is_sponsored: false,
    ...input
  };
}

export const pilotDemoOpportunities: Opportunity[] = [
  opportunity({ id: "demo-pace-incubation", title: "PACE Student Venture Pilot Cohort", organizer_name: "Demo Campus Incubation Cell", opportunity_type: "Incubator program", deadline: "2026-09-10", application_method: "idea_workspace_application", mode: "Offline", guidelines: "A four-week pilot cohort for student teams to clarify their problem, validate assumptions, and prepare for faculty review." }),
  opportunity({ id: "demo-campus-build", title: "Campus Build Weekend", organizer_name: "Demo Student Innovation Club", opportunity_type: "Hackathon", deadline: "2026-09-05", application_method: "internal_registration", team_size: "2-4 members", event_start_date: "2026-09-12", event_end_date: "2026-09-13", guidelines: "Build a practical prototype addressing a documented campus problem." }),
  opportunity({ id: "demo-open-tech-sprint", title: "Open Technology Sprint", organizer_name: "Demo Hackathon Organiser", opportunity_type: "Hackathon", deadline: "2026-09-18", application_method: "external_registration", external_link: "https://example.org/pace-demo-registration", guidelines: "Complete registration on the organiser site and mark the opportunity as applied when you return." })
];

export const pilotDemoApplications: Application[] = [
  { id: "demo-application-incomplete", founder_id: "demo-founder", opportunity_id: "demo-pace-incubation", idea_workspace_id: "demo-workspace-canteenloop", startup: "CanteenLoop", founder: "Demo Founder", reviewer: "Demo Incubator", opportunity: "PACE Student Venture Pilot Cohort", opportunityType: "Incubator program", status: "Under Review", submittedAt: "2026-08-01", packet: ["Incomplete application copy"], timeline: [{ label: "Under Review", date: "2026-08-01", complete: true }] },
  { id: "demo-application-passing", founder_id: "demo-founder", opportunity_id: "demo-pace-incubation", idea_workspace_id: "demo-workspace-campusflow", startup: "CampusFlow", founder: "Demo Founder", reviewer: "Demo Incubator", opportunity: "PACE Student Venture Pilot Cohort", opportunityType: "Incubator program", status: "Submitted", submittedAt: "2026-08-02", packet: ["Immutable application snapshot", "Passing quality result"], timeline: [{ label: "Submitted", date: "2026-08-02", complete: true }] },
  { id: "demo-application-interested", founder_id: "demo-founder", opportunity_id: "demo-pace-incubation", idea_workspace_id: "demo-workspace-campusflow", startup: "CampusFlow", founder: "Demo Founder", reviewer: "Demo Incubator", opportunity: "PACE Student Venture Pilot Cohort", opportunityType: "Incubator program", status: "Interested", submittedAt: "2026-07-30", reviewedAt: "2026-08-02", packet: ["Immutable application snapshot"], timeline: [{ label: "Submitted", date: "2026-07-30", complete: true }, { label: "Interested", date: "2026-08-02", complete: true }] },
  { id: "demo-hackathon-registration", founder_id: "demo-founder", opportunity_id: "demo-campus-build", startup: "CampusFlow", founder: "Demo Founder", reviewer: "Demo Hackathon Organiser", opportunity: "Campus Build Weekend", opportunityType: "Hackathon", status: "Shortlisted", submittedAt: "2026-08-02", packet: ["Organiser registration form"], timeline: [{ label: "Submitted", date: "2026-08-02", complete: true }, { label: "Shortlisted", date: "2026-08-03", complete: true }] }
];

export const pilotDemoMessages: MessageThread[] = [{
  id: "thread-demo-interested",
  investor: "Demo Incubator reviewer",
  firm: "Demo Campus Incubation Cell",
  startup: "CampusFlow",
  status: "Interested",
  lastMessage: "Your application is clear. Please share which two departments can join the first measured pilot.",
  badge: "Incubator",
  unread: true,
  founderPlan: "Free"
}];

export const pilotDemoReadinessReport: VcReportContent = {
  tier: "free",
  reportType: "Basic SWOT Report",
  planRequired: "Free",
  startupName: "CampusFlow",
  summary: "The problem and initial customer are clear; the next priority is stronger evidence from a measured semester pilot.",
  overallScore: 72,
  finalRecommendation: "Incubator Ready",
  sections: [
    { title: "Problem clarity", score: 82 }, { title: "Solution clarity", score: 78 },
    { title: "Customer clarity", score: 74 }, { title: "Validation level", score: 58 },
    { title: "Business-model clarity", score: 66 }, { title: "Team readiness", score: 76 },
    { title: "Strengths", items: ["Specific campus workflow problem", "Honest early-stage evidence"] },
    { title: "Weaknesses", items: ["No paid validation", "Institution buyer assumptions need testing"] }
  ],
  improvementSuggestions: ["Define pilot success metrics", "Interview two department heads", "Document weekly active usage", "Test the annual licence assumption", "Record faculty onboarding effort"],
  generatedAt: "2026-08-02T10:00:00.000Z"
};
