import type {
  AiReport,
  Application,
  BlogPost,
  ExternalRegistration,
  FeedPost,
  IdeaWorkspaceItem,
  Investor,
  MessageThread,
  Opportunity,
  PlatformNotification,
  PricingTier,
  ReportSuiteItem,
  ServicePost,
  ServiceProvider,
  ServiceRequest,
  StartupProfile
} from "@/lib/types";
import { completionPercent, emptySectionsForTemplate } from "@/lib/templates";

export const heroMetrics = [
  { label: "Structured applications", value: "12.8k" },
  { label: "VC readiness reports", value: "31k" },
  { label: "Verified opportunities", value: "840+" },
  { label: "Interest-led conversations", value: "3.2k" }
];

export const workflowSteps = [
  "Founder creates structured startup document",
  "Founder generates VC Readiness Report",
  "Founder applies to relevant opportunities",
  "Investor or incubator reviews structured application",
  "Reviewer marks Interested",
  "Messaging unlocks after interest"
];

function buildWorkspace(partial: Omit<IdeaWorkspaceItem, "visibility" | "tags" | "uploads" | "versionHistory" | "archived" | "markdown" | "versions" | "updatedAt" | "category"> & Partial<IdeaWorkspaceItem>): IdeaWorkspaceItem {
  const sections = partial.sections ?? emptySectionsForTemplate(partial.template);
  return {
    ...partial,
    title: partial.title ?? partial.name,
    category: partial.category ?? partial.template,
    visibility: partial.visibility ?? "application_only",
    tags: partial.tags ?? [],
    uploads: partial.uploads ?? [],
    versionHistory: partial.versionHistory ?? [
      {
        id: `version-${partial.id}`,
        versionNumber: 1,
        sections,
        createdAt: new Date().toISOString(),
        summary: "Initial workspace snapshot"
      }
    ],
    archived: partial.archived ?? false,
    markdown: partial.markdown ?? "",
    versions: partial.versions ?? 1,
    updatedAt: partial.updatedAt ?? "Today",
    sections
  };
}

export const ideaWorkspaces: IdeaWorkspaceItem[] = [
  buildWorkspace({
    id: "workspace-1",
    founder_id: "founder-1",
    name: "MedLens AI triage workflow",
    template: "startup",
    status: "Complete",
    stage: "MVP",
    summary: "AI clinical documentation assistant for small hospitals.",
    uniqueness: 84,
    demand: 91,
    scalability: 80,
    competition: "Medium",
    video_link: "https://youtu.be/medlens-demo",
    tags: ["HealthTech", "AI", "Hospitals"],
    uploads: ["pilot-results.pdf", "founder-deck.pdf"],
    sections: {
      ...emptySectionsForTemplate("startup"),
      startup_name: "MedLens AI",
      problem_statement: "Small hospitals lose 2+ hours per shift to triage documentation, creating delayed care and compliance gaps.",
      solution: "A secure AI workflow assistant drafts, routes, and audits triage notes while keeping clinicians in control.",
      target_market: "50-200 bed hospitals in India and SEA, starting with emergency departments and nurse managers.",
      business_model: "Per-bed SaaS with implementation fee and compliance add-ons for multi-site hospital groups.",
      competitive_advantage: "Small-hospital wedge, lightweight EHR integrations, localized clinical templates, and low inference cost.",
      team: "Clinical operations founder, ML engineer, and hospital IT advisor with three pilot references.",
      traction: "3 paid pilots, 1.8k active clinical users, 31% month-over-month usage growth.",
      funding_ask: "Rs 35L pre-seed for 18 months to build EHR connectors and expand pilots.",
      one_minute_video_link: "https://youtu.be/medlens-demo"
    }
  }),
  buildWorkspace({
    id: "workspace-2",
    founder_id: "founder-2",
    name: "VoltRoute campus fleet optimizer",
    template: "startup",
    status: "In Progress",
    stage: "Prototype",
    summary: "Charging and routing intelligence for campus EV fleets.",
    uniqueness: 72,
    demand: 77,
    scalability: 70,
    competition: "Low",
    tags: ["Climate", "Mobility"],
    sections: {
      ...emptySectionsForTemplate("startup"),
      startup_name: "VoltRoute",
      problem_statement: "Campus EV fleets waste charging cycles because dispatch teams do not know battery health or route demand.",
      solution: "A live route planner predicts charge windows and assigns vehicles to trips based on battery health.",
      target_market: "University mobility teams and corporate campuses.",
      traction: "42 vehicles optimized across two campus pilots."
    }
  }),
  buildWorkspace({
    id: "workspace-3",
    founder_id: "founder-3",
    name: "SkillBridge verified micro-internships",
    template: "saas",
    status: "Complete",
    stage: "Revenue",
    summary: "Evaluated micro-internships for first-year students and MSMEs.",
    uniqueness: 76,
    demand: 85,
    scalability: 83,
    competition: "High",
    tags: ["EdTech", "SaaS"],
    sections: {
      ...emptySectionsForTemplate("saas"),
      product_overview: "A SaaS marketplace that matches students to verified two-week MSME projects and converts work into proof portfolios.",
      core_features: "Project verification, student matching, milestone review, proof-of-work profiles, MSME dashboards.",
      target_users: "First and second-year students, placement cells, and MSMEs needing affordable project help.",
      pricing_model: "Free for students, Rs 999 per month for MSME teams, and institution bundles.",
      go_to_market: "Campus ambassadors, placement cell partnerships, and MSME association pilots.",
      tech_stack: "Next.js, Supabase, background review jobs, document exports, analytics dashboards.",
      mrr_growth: "Rs 48k MRR, 310 waitlist signups, 18 MSME requests, 42% beta activation.",
      roadmap: "Add verified mentors, automate completion certificates, launch institution analytics."
    }
  }),
  buildWorkspace({
    id: "workspace-4",
    founder_id: "founder-4",
    name: "CropLens pest detection project",
    template: "ai-project",
    status: "Draft",
    stage: "Idea",
    summary: "Computer vision pest detection for small farms.",
    uniqueness: 68,
    demand: 74,
    scalability: 69,
    competition: "Medium",
    tags: ["AI", "AgriTech"],
    sections: {
      ...emptySectionsForTemplate("ai-project"),
      ai_problem: "Farmers identify pests too late because expert agronomists are not locally available.",
      applications: "Mobile diagnosis and extension worker support."
    }
  })
];

export const opportunities: Opportunity[] = [
  {
    id: "opp-1",
    creator_role: "Investor",
    title: "BluePeak Ventures Pre-Seed Office Hours",
    organizer_name: "BluePeak Ventures",
    organizer_type: "Verified VC fund",
    opportunity_type: "Investor opportunity",
    category: "Fundraising",
    prize_or_funding: "Rs 25L - Rs 1.5Cr investment conversations",
    deadline: "2026-07-24",
    eligibility: "AI, SaaS, and HealthTech founders with a complete Idea Workspace document.",
    guidelines: "Submit a complete Startup Template or SaaS Template, recent traction, funding ask, and VC Readiness Report summary.",
    benefits: "Partner review, office hours, and follow-on diligence for selected startups.",
    requirements: ["Complete Idea Workspace document", "VC Readiness Report summary", "Founder profile"],
    tags: ["AI", "SaaS", "Pre-seed"],
    location: "Bengaluru",
    mode: "Hybrid",
    verified: true,
    trending: true,
    beginnerLevel: "Intermediate",
    startupStage: "MVP",
    domain: "AI",
    trust_score: 94,
    saved: true,
    application_method: "idea_workspace_application",
    external_link: "https://bluepeak.example/apply",
    contact_email: "officehours@bluepeak.example",
    organization: "BluePeak Ventures",
    type: "Investor opportunity",
    funding: "Rs 25L - Rs 1.5Cr",
    applicants: 184,
    bookmarked: true,
    description: "Thesis-led review track for AI, SaaS, and HealthTech founders with early usage evidence.",
    premium: true
  },
  {
    id: "opp-2",
    creator_role: "Incubator",
    title: "AICTE Student Innovation Incubation Cohort",
    organizer_name: "AICTE Innovation Cell",
    organizer_type: "Incubator",
    opportunity_type: "Incubator program",
    category: "Incubation",
    prize_or_funding: "Grant support plus lab credits",
    deadline: "2026-07-31",
    eligibility: "Student founders with a complete Startup, AI Project, SaaS, or Student Project template.",
    guidelines: "Submit a complete Idea Workspace document and explain why the team needs incubation.",
    benefits: "Mentor matching, lab credits, customer discovery support, and grant review.",
    requirements: ["Complete Idea Workspace document", "Team details", "Milestone plan"],
    tags: ["Student", "DeepTech", "Grant"],
    location: "Delhi",
    mode: "Hybrid",
    verified: true,
    trending: false,
    beginnerLevel: "Beginner",
    startupStage: "Prototype",
    domain: "DeepTech",
    trust_score: 88,
    saved: false,
    application_method: "idea_workspace_application",
    organization: "AICTE Innovation Cell",
    type: "Incubator program",
    funding: "Grant + lab credits",
    applicants: 384,
    bookmarked: false,
    description: "A structured cohort for student teams moving from project evidence to startup validation."
  },
  {
    id: "opp-3",
    creator_role: "Hackathon Organizer",
    title: "Campus Climate Hack 2026",
    organizer_name: "GreenStack Labs",
    organizer_type: "Hackathon organizer",
    opportunity_type: "Hackathon",
    category: "Hackathon",
    prize_or_funding: "Rs 8L prize pool",
    deadline: "2026-08-05",
    eligibility: "Student and founder teams building mobility, energy, or circular economy solutions.",
    guidelines: "Register through the official GreenStack Labs form. Team details, track selection, and submission rules are managed by the organiser.",
    benefits: "Prize pool, demo stage, technical mentors, and sponsor review.",
    requirements: ["Official organiser registration", "Eligible student team", "Agreement to official rules"],
    tags: ["Climate", "Mobility", "Hackathon"],
    location: "Bengaluru",
    mode: "Offline",
    verified: true,
    trending: true,
    beginnerLevel: "Beginner",
    startupStage: "Idea",
    domain: "Social Impact",
    trust_score: 86,
    saved: false,
    application_method: "external_registration",
    external_link: "https://greenstack.example/hackathons/campus-climate-hack-2026/register",
    organizer_logo: "GS",
    official_website: "https://greenstack.example",
    event_start_date: "2026-08-22",
    event_end_date: "2026-08-24",
    venue: "GreenStack Innovation Campus, Bengaluru",
    team_size: "2-5 students",
    tracks: ["Clean mobility", "Energy intelligence", "Circular economy"],
    registration_fee: "Free",
    required_skills: ["Product design", "Software or hardware prototyping", "Pitch presentation"],
    official_rules_url: "https://greenstack.example/hackathons/campus-climate-hack-2026/rules",
    source_verification: "Official organiser page reviewed by Venture Connect",
    application_instructions: "Create or join a team, select one track, and complete the organiser form before the registration deadline.",
    direct_application_partner: false,
    contact_email: "hackathons@greenstack.example",
    organization: "GreenStack Labs",
    type: "Hackathon",
    funding: "Rs 8L prize pool",
    applicants: 246,
    bookmarked: false,
    description: "A weekend build sprint for climate mobility and energy teams."
  },
  {
    id: "opp-4",
    creator_role: "Event Organizer",
    title: "Frontier Founder Demo Day",
    organizer_name: "Venture Connect Events",
    organizer_type: "Startup event organizer",
    opportunity_type: "Startup event",
    category: "Event",
    prize_or_funding: "Investor showcase",
    deadline: "2026-08-21",
    eligibility: "Founders and students who read event guidelines before applying.",
    guidelines: "Read the demo day guidelines. Idea Workspace is recommended but not required for event registration.",
    benefits: "Founder showcase, audience voting, and investor networking.",
    requirements: ["Read event guidelines", "Basic founder profile"],
    tags: ["Demo Day", "Networking", "Founder Event"],
    location: "Mumbai",
    mode: "Hybrid",
    verified: true,
    trending: true,
    beginnerLevel: "Beginner",
    startupStage: "Any",
    domain: "Consumer",
    trust_score: 90,
    saved: false,
    application_method: "external_registration",
    external_link: "https://events.ventureconnect.example/frontier-demo-day/register",
    source_verification: "Official event page reviewed by Venture Connect",
    organization: "Venture Connect Events",
    type: "Startup event",
    funding: "Investor showcase",
    applicants: 420,
    bookmarked: false,
    description: "Event applications are allowed after reading guidelines, even without a completed document."
  },
  {
    id: "opp-5",
    creator_role: "Investor",
    title: "Operator Guild SaaS Scouting Call",
    organizer_name: "Operator Guild",
    organizer_type: "Verified operator angel network",
    opportunity_type: "Accelerator program",
    category: "Accelerator",
    prize_or_funding: "Operator mentorship and seed investor intros",
    deadline: "2026-08-12",
    eligibility: "SaaS founders with early revenue, pilots, or strong usage evidence.",
    guidelines: "Submit completed SaaS Template and attach VC Readiness score if available.",
    benefits: "Six-week operating sprint, metrics review, and partner intro day.",
    requirements: ["Complete Idea Workspace document", "MRR or pilot evidence", "GTM plan"],
    tags: ["SaaS", "Revenue", "Accelerator"],
    location: "Remote",
    mode: "Remote",
    verified: false,
    trending: false,
    beginnerLevel: "Advanced",
    startupStage: "Revenue",
    domain: "SaaS",
    trust_score: 72,
    saved: true,
    application_method: "idea_workspace_application",
    organization: "Operator Guild",
    type: "Accelerator program",
    funding: "Mentorship + intros",
    applicants: 128,
    bookmarked: true,
    description: "Hands-on operator support for SaaS teams preparing for seed fundraising."
  }
];

export const trendingStartups: StartupProfile[] = [
  {
    id: "startup-1",
    name: "MedLens AI",
    logo: "ML",
    founder: "Nisha Rao",
    role: "Founder & CEO",
    university: "IIT Madras",
    stage: "MVP",
    industry: "HealthTech AI",
    location: "Chennai, IN",
    fundingStatus: "Pre-seed open",
    ask: "Rs 35L",
    traction: "3 paid hospital pilots",
    deckStatus: "Investor-ready",
    demoVideo: "One-minute video attached",
    readiness: 88,
    monthlyGrowth: "31%",
    activeUsers: "1.8k",
    retention: "67%",
    website: "https://medlens.example",
    linkedIn: "linkedin.com/company/medlens-ai",
    category: "AI clinical workflow",
    shortDescription: "AI triage documentation assistant for small hospitals.",
    views: 1240
  },
  {
    id: "startup-2",
    name: "VoltRoute",
    logo: "VR",
    founder: "Aarav Mehta",
    role: "Co-founder",
    university: "BITS Pilani",
    stage: "Prototype",
    industry: "Climate mobility",
    location: "Pilani, IN",
    fundingStatus: "Grant seeking",
    ask: "Rs 18L",
    traction: "42 vehicles optimized",
    deckStatus: "Needs market sizing",
    demoVideo: "Fleet demo link",
    readiness: 62,
    monthlyGrowth: "22%",
    activeUsers: "420",
    retention: "58%",
    website: "https://voltroute.example",
    linkedIn: "linkedin.com/company/voltroute",
    category: "Climate Mobility",
    shortDescription: "Charging and dispatch intelligence for campus EV fleets.",
    views: 730
  },
  {
    id: "startup-3",
    name: "SkillBridge",
    logo: "SB",
    founder: "Rehan Kapoor",
    role: "Student founder",
    university: "VIT",
    stage: "Revenue",
    industry: "EdTech SaaS",
    location: "Vellore, IN",
    fundingStatus: "Bootstrapped",
    ask: "Operator mentorship",
    traction: "Rs 48k MRR",
    deckStatus: "Ready",
    demoVideo: "Product walkthrough",
    readiness: 81,
    monthlyGrowth: "44%",
    activeUsers: "310",
    retention: "71%",
    website: "https://skillbridge.example",
    linkedIn: "linkedin.com/company/skillbridge",
    category: "SaaS",
    shortDescription: "Verified micro-internships that convert student work into proof portfolios.",
    views: 980
  }
];

export const investors: Investor[] = [
  {
    id: "inv-1",
    name: "Maya Srinivasan",
    firm: "BluePeak Ventures",
    designation: "Partner",
    thesis: "Campus-born AI infrastructure, HealthTech, and vertical SaaS with early pull.",
    sectors: ["AI", "SaaS", "HealthTech"],
    stage: "Pre-seed to Seed",
    geography: "India + SEA",
    ticketSize: "Rs 25L - Rs 1.5Cr",
    badge: "Verified VC",
    portfolio: ["ClearOps", "FinPilot", "DocuGrid"],
    matchScore: 94,
    verified: true
  },
  {
    id: "inv-2",
    name: "Daniel Iyer",
    firm: "Northstar Angels",
    designation: "Syndicate Lead",
    thesis: "Student founders solving high-frequency operational problems.",
    sectors: ["FinTech", "B2B", "Climate"],
    stage: "Idea to MVP",
    geography: "India",
    ticketSize: "Rs 10L - Rs 60L",
    badge: "Angel Syndicate",
    portfolio: ["LedgerLoop", "GridFleet"],
    matchScore: 86,
    verified: true
  }
];

export const applications: Application[] = [
  {
    id: "app-1",
    founder_id: "founder-1",
    opportunity_id: "opp-1",
    idea_workspace_id: "workspace-1",
    startup: "MedLens AI",
    founder: "Nisha Rao",
    reviewer: "BluePeak Ventures",
    investor: "BluePeak Ventures",
    opportunity: "BluePeak Ventures Pre-Seed Office Hours",
    opportunityType: "Investor opportunity",
    status: "Interested",
    submittedAt: "2026-07-04",
    reviewedAt: "2026-07-06",
    packet: ["Complete Idea Workspace", "VC Readiness Report", "One-minute video"],
    timeline: [
      { label: "Submitted", date: "Jul 4", complete: true },
      { label: "Under Review", date: "Jul 5", complete: true },
      { label: "Interested", date: "Jul 6", complete: true }
    ]
  },
  {
    id: "app-2",
    founder_id: "founder-3",
    opportunity_id: "opp-5",
    idea_workspace_id: "workspace-3",
    startup: "SkillBridge",
    founder: "Rehan Kapoor",
    reviewer: "Operator Guild",
    investor: "Operator Guild",
    opportunity: "Operator Guild SaaS Scouting Call",
    opportunityType: "Accelerator program",
    status: "Under Review",
    submittedAt: "2026-07-03",
    packet: ["Complete SaaS Workspace", "Premium SWOT Analysis"],
    timeline: [
      { label: "Submitted", date: "Jul 3", complete: true },
      { label: "Under Review", date: "Jul 6", complete: true }
    ]
  }
];

export const externalRegistrations: ExternalRegistration[] = [
  {
    id: "external-registration-1",
    founder_id: "founder-2",
    opportunity_id: "opp-3",
    opportunity_title: "Campus Climate Hack 2026",
    organizer_name: "GreenStack Labs",
    status: "Registration Opened",
    tracked_by_user: true,
    team_name: "VoltRoute Labs",
    organizer_verified: false,
    updated_at: "2026-07-27T12:30:00.000Z"
  },
  {
    id: "external-registration-2",
    founder_id: "founder-2",
    opportunity_id: "opp-4",
    opportunity_title: "Frontier Founder Demo Day",
    organizer_name: "Venture Connect Events",
    status: "Applied Externally",
    tracked_by_user: true,
    submission_date: "2026-07-07",
    notes: "Registration confirmation saved in the organiser portal.",
    organizer_verified: false,
    updated_at: "2026-07-07T09:15:00.000Z"
  }
];

export const aiReport: AiReport = {
  readiness: 88,
  overallScore: 86,
  startupScore: 88,
  recommendation: "Watchlist",
  market: "Strong wedge in small hospital operations with a credible path from triage documentation to broader clinical workflow automation.",
  validation: "Paid pilots, narrow buyer persona, and measurable documentation time savings create an investor-grade proof base.",
  swot: {
    strengths: ["Clear buyer pain", "Paid pilots", "Small-hospital wedge"],
    weaknesses: ["Long hospital procurement", "Compliance evidence must deepen"],
    opportunities: ["Regional hospital groups", "Insurance workflow partnerships"],
    threats: ["EHR incumbents", "Regulatory delays"]
  },
  tamSamSom: {
    tam: "Rs 8,400Cr",
    sam: "Rs 1,150Cr",
    som: "Rs 62Cr in 36 months"
  },
  competitors: ["Nuance DAX", "Abridge", "Hospital EHR modules", "Manual BPO workflows"],
  nextSteps: [
    "Attach before/after pilot metrics to the first five deck slides.",
    "Convert clinical time savings into a procurement ROI model.",
    "Prepare diligence answers on compliance and model monitoring."
  ],
  scorecard: [
    { label: "Investor readiness", value: 88, status: "Strong" },
    { label: "Market potential", value: 84, status: "Strong" },
    { label: "Product clarity", value: 91, status: "Excellent" },
    { label: "Business model", value: 78, status: "Developing" },
    { label: "Risk", value: 64, status: "Risk" }
  ]
};

export const reportSuite: ReportSuiteItem[] = [
  {
    id: "basic-swot",
    title: "Basic SWOT Report",
    subtitle: "Free one-time validation with SWOT, basic score, and short recommendation.",
    plan: "Free",
    pages: "2 pages",
    score: 78,
    sections: ["Strengths", "Weaknesses", "Opportunities", "Threats", "Basic validation score"]
  },
  {
    id: "premium-swot",
    title: "Premium SWOT Analysis",
    subtitle: "Detailed SWOT, founder readiness, risk rating, and improvement path.",
    plan: "Student Pro",
    pages: "6-8 pages",
    score: 84,
    sections: ["Detailed strengths", "Detailed weaknesses", "Market opportunities", "Execution threats", "Founder readiness"]
  },
  {
    id: "full-brief",
    title: "Full Brief Report",
    subtitle: "Executive summary, market, business model, and investment readiness summary.",
    plan: "Student Pro",
    pages: "8-12 pages",
    score: 86,
    sections: ["Executive summary", "Problem clarity", "Solution strength", "Market size", "Competitive edge"]
  },
  {
    id: "bottleneck",
    title: "Bottleneck Report",
    subtitle: "Main blockers across product, market, execution, team, and revenue.",
    plan: "Student Pro",
    pages: "6-8 pages",
    score: 79,
    sections: ["Main blockers", "Product bottlenecks", "Market bottlenecks", "Team bottlenecks", "Priority fixes"]
  },
  {
    id: "defensive",
    title: "Competitor Defensive Report",
    subtitle: "Competitor landscape, differentiation, moat strength, and copy risk.",
    plan: "Student Pro",
    pages: "7-9 pages",
    score: 82,
    sections: ["Competitor landscape", "Differentiation", "Moat strength", "Copy risk", "Strategic recommendations"]
  },
  {
    id: "roadmap",
    title: "Roadmap Report",
    subtitle: "30-day, 90-day, and six-month product, validation, revenue, and fundraising roadmap.",
    plan: "Founder Pro",
    pages: "7-10 pages",
    score: 85,
    sections: ["30-day roadmap", "90-day roadmap", "6-month roadmap", "Revenue milestones", "Fundraising milestones"]
  },
  {
    id: "investor-scorecard",
    title: "Investor Scorecard Report",
    subtitle: "Investor readiness, market potential, product clarity, team, traction, and risk scores.",
    plan: "Founder Pro",
    pages: "5-7 pages",
    score: 88,
    sections: ["Investor readiness score", "Market score", "Product score", "Team score", "Final recommendation"]
  }
];

export const messageThreads: MessageThread[] = [
  {
    id: "thread-1",
    investor: "Maya Srinivasan",
    firm: "BluePeak Ventures",
    startup: "MedLens AI",
    status: "Meeting proposed",
    lastMessage: "Your pilot retention data is strong. Can you discuss ROI assumptions on Friday?",
    badge: "Verified VC",
    unread: true,
    founderPlan: "Founder Pro",
    meetingLink: "https://meet.google.com/venture-medlens",
    meetingTime: "2026-07-10T15:30:00+05:30"
  },
  {
    id: "thread-2",
    investor: "Daniel Iyer",
    firm: "Northstar Angels",
    startup: "VoltRoute",
    status: "Feedback only",
    lastMessage: "The fleet economics are promising, but the workspace needs business model and funding ask sections.",
    badge: "Angel Syndicate",
    unread: false,
    founderPlan: "Free",
    meetingLink: "https://zoom.us/j/venture-voltroute",
    meetingTime: "2026-07-12T11:00:00+05:30"
  }
];

export const serviceProviders: ServiceProvider[] = [
  {
    id: "provider-1",
    user_id: "provider-user-1",
    name: "Ritika Menon",
    firm_name: "IPBridge Legal",
    email: "ritika@ipbridge.example",
    phone: "+91 90000 10001",
    service_category: "Patent filing",
    pan_or_gst: "29AABCI1234Z1Z5",
    website_or_linkedin: "https://ipbridge.example",
    experience_details: "12 years supporting patent drafting for software, medical device, and AI startups.",
    certificate_url: "/certificates/ipbridge.pdf",
    cgpdtm_registration_number: "IN/PA-2847",
    verification_status: "Verified",
    venture_connect_verified: true,
    cgpdtm_checked: true,
    verification_date: "2026-06-22",
    created_at: "2026-06-10"
  },
  {
    id: "provider-2",
    user_id: "provider-user-2",
    name: "Karan Shah",
    firm_name: "DeckForge Studio",
    email: "karan@deckforge.example",
    phone: "+91 90000 10002",
    service_category: "Pitch deck design",
    pan_or_gst: "27AACCD5678K1Z4",
    website_or_linkedin: "https://deckforge.example",
    experience_details: "Designed 180+ seed and accelerator pitch decks for SaaS, climate, and consumer founders.",
    verification_status: "Verified",
    venture_connect_verified: true,
    cgpdtm_checked: false,
    verification_date: "2026-06-28",
    created_at: "2026-06-18"
  },
  {
    id: "provider-3",
    user_id: "provider-user-3",
    name: "Pranav S",
    firm_name: "Startup Ledger Co",
    email: "pranav@ledger.example",
    phone: "+91 90000 10003",
    service_category: "GST/tax filing",
    pan_or_gst: "Pending GST review",
    website_or_linkedin: "https://linkedin.com/in/pranav-ledger",
    experience_details: "Startup accounting and tax filing practice under admin verification.",
    verification_status: "Pending",
    venture_connect_verified: false,
    cgpdtm_checked: false,
    created_at: "2026-07-01"
  }
];

export const servicePosts: ServicePost[] = [
  {
    id: "service-1",
    provider_id: "provider-1",
    title: "Provisional patent filing package",
    category: "Patent filing",
    description: "Patentability intake, provisional draft, claims outline, filing support, and founder briefing.",
    guide_info: "Best for AI, SaaS, medical device, and hardware teams preparing defensibility evidence.",
    original_price: 18000,
    listed_price: 18000,
    contact_info: "ritika@ipbridge.example",
    external_link: "https://ipbridge.example/venture-connect",
    created_at: "2026-06-23"
  },
  {
    id: "service-2",
    provider_id: "provider-2",
    title: "Investor pitch deck redesign",
    category: "Pitch deck design",
    description: "Narrative restructure, visual redesign, financial slide cleanup, and VC Q&A appendix.",
    guide_info: "Use after completing Idea Workspace and at least one VC Readiness Report.",
    original_price: 12000,
    listed_price: 12000,
    contact_info: "karan@deckforge.example",
    external_link: "https://deckforge.example/apply",
    created_at: "2026-06-29"
  }
];

export const serviceRequests: ServiceRequest[] = [
  {
    id: "request-1",
    founder_id: "founder-1",
    provider_id: "provider-1",
    service_post_id: "service-1",
    status: "Quotation Sent",
    quotation: "Rs 18,000 fixed fee plus official filing charges.",
    created_at: "2026-07-05"
  }
];

export const notifications: PlatformNotification[] = [
  {
    id: "note-1",
    type: "Investor Interested",
    title: "BluePeak Ventures marked MedLens AI Interested",
    body: "A message thread was created. Paid founders can access the full chat and meeting details.",
    createdAt: "Today",
    read: false
  },
  {
    id: "note-2",
    type: "Report Ready",
    title: "Investor Scorecard Report saved",
    body: "The report is available in VC Readiness Report history and can be exported as PDF.",
    createdAt: "Yesterday",
    read: true
  },
  {
    id: "note-3",
    type: "Provider Verification",
    title: "IPBridge Legal verified",
    body: "Admin approved Venture Connect Verified status and marked CGPDTM registration checked.",
    createdAt: "Jul 6",
    read: true
  }
];

export const dashboardStats = [
  { label: "Idea Workspace docs", value: String(ideaWorkspaces.length), delta: "2 complete" },
  { label: "Latest completion", value: `${completionPercent(ideaWorkspaces[0].sections, ideaWorkspaces[0].template)}%`, delta: "Startup Template complete" },
  { label: "Available submissions", value: "1", delta: "Free plan monthly limit" },
  { label: "Report credits", value: "1", delta: "Basic SWOT available" }
];

export const investorDashboardStats = [
  { label: "New applications", value: "24", delta: "8 require review today" },
  { label: "Saved startups", value: "18", delta: "6 high readiness" },
  { label: "Interested", value: "11", delta: "4 message threads active" },
  { label: "Posted opportunities", value: "6", delta: "3 verified by admin" }
];

export const adminStats = [
  { label: "Users", value: "18,420", delta: "+12.4%" },
  { label: "Reports", value: "31,008", delta: "82% mock fallback ready" },
  { label: "Applications", value: "9,612", delta: "1,804 interested" },
  { label: "Verified providers", value: "212", delta: "18 pending review" }
];

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "Rs 0/month",
    priceAmount: 0,
    description: "One workspace, Startup Template, one monthly submission, and one lifetime Basic SWOT Report.",
    features: ["1 Idea Workspace", "Startup Template only", "1 opportunity submission/month", "1 Basic SWOT Report once", "PDF export", "No full messaging access"],
    highlighted: false
  },
  {
    name: "Student Pro",
    price: "Rs 149/month",
    priceAmount: 14900,
    description: "Unlimited workspaces, all templates, premium reports, report history, and interest-gated messaging.",
    features: ["Unlimited Idea Workspaces", "All templates", "10 submissions/month", "3 premium reports/month", "PDF and DOCX export", "Messaging after investor interest"],
    highlighted: false,
    razorpayPlanId: process.env.RAZORPAY_PLAN_STUDENT_PRO
  },
  {
    name: "Founder Pro",
    price: "Rs 199/month",
    priceAmount: 19900,
    description: "Higher limits, priority generation, premium badge, and advanced Roadmap and Investor Scorecard reports.",
    features: ["30 submissions/month", "5 premium reports/month", "Priority report generation", "Roadmap Report", "Investor Scorecard Report", "Priority support"],
    highlighted: true,
    razorpayPlanId: process.env.RAZORPAY_PLAN_FOUNDER_PRO
  }
];

export const feedPosts: FeedPost[] = [];
export const blogPosts: BlogPost[] = [
  {
    id: "blog-1",
    title: "How to answer the first five VC diligence questions",
    excerpt: "A practical template for founders preparing their first investor conversation.",
    author: "Venture Connect Research",
    role: "Admin",
    category: "Fundraising",
    likes: 0,
    bookmarks: 0,
    comments: [],
    publishedAt: "Jul 1, 2026"
  }
];
export const startupNews = [
  "Structured applications with complete Idea Workspace documents move faster through review.",
  "Interest-gated messaging keeps investor communication focused and founder-safe."
];

/** @deprecated Use ideaWorkspaces. */
export const ideaWorkspaceDocuments = ideaWorkspaces;
