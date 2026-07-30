import { ideaWorkspaces } from "@/lib/data";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { completionPercent, getTemplateDef } from "@/lib/templates";
import { validationServices } from "@/lib/validation/config";
import type {
  ValidationActivity,
  ValidationBadge,
  ValidationBooking,
  ValidationDomain,
  ValidationReport,
  ValidationScore,
  ValidationServiceType,
  ValidationWorkspaceReference,
  ValidatorProfile,
  ValidatorReview
} from "@/lib/validation/types";

function workspaceRef(index: number, version = 1, majorChangesSinceBadge = false): ValidationWorkspaceReference {
  const workspace = ideaWorkspaces[index] ?? ideaWorkspaces[0];
  return {
    id: workspace.id,
    startupName: workspace.name,
    template: workspace.template,
    completionPercentage: completionPercent(workspace.sections, workspace.template),
    lastUpdated: workspace.updatedAt,
    version: workspace.versionHistory.at(-1)?.versionNumber ?? version,
    status: workspace.status,
    majorChangesSinceBadge
  };
}

export const demoValidators: ValidatorProfile[] = [
  {
    id: "validator-priya-menon",
    name: "Demo Reviewer - AI and HealthTech",
    photoUrl: "/images/validators/priya-menon.webp",
    role: "Synthetic startup document reviewer",
    affiliationVerified: false,
    location: "India",
    languages: ["English", "Hindi"],
    expertise: ["AI and Machine Learning", "HealthTech", "Product Development", "Business Strategy"],
    rating: 0,
    reviewCount: 0,
    completedValidations: 0,
    responseTime: "Sample availability",
    nextAvailable: "Sample slot",
    verified: false,
    isVerified: false,
    isDemo: true,
    level: "New Validator",
    shortBio: "Synthetic profile used to demonstrate the validation workflow.",
    bio: "This profile is demonstration data. It does not represent a real person, endorsement, qualification, organisation, or validation history.",
    qualifications: [],
    industryExperience: [],
    incubationActivities: [],
    mentoringExperience: "Sample validation workflow only.",
    serviceTypes: ["Written Idea Review", "Live Validation Session", "Expert Validation"]
  },
  {
    id: "validator-arjun-balan",
    name: "Demo Reviewer - SaaS",
    role: "Synthetic startup document reviewer",
    affiliationVerified: false,
    location: "India",
    languages: ["English", "Tamil", "Hindi"],
    expertise: ["SaaS", "Business Strategy", "Marketing", "Finance", "Consumer Products"],
    rating: 0,
    reviewCount: 0,
    completedValidations: 0,
    responseTime: "Sample availability",
    nextAvailable: "Sample slot",
    verified: false,
    isVerified: false,
    isDemo: true,
    level: "New Validator",
    shortBio: "Synthetic profile used to demonstrate the validation workflow.",
    bio: "This profile is demonstration data and does not represent a real person or professional history.",
    qualifications: [],
    industryExperience: [],
    incubationActivities: [],
    mentoringExperience: "Sample validation workflow only.",
    serviceTypes: ["Written Idea Review", "Live Validation Session"]
  },
  {
    id: "validator-farah-khan",
    name: "Demo Reviewer - Product Strategy",
    role: "Synthetic startup document reviewer",
    affiliationVerified: false,
    location: "India",
    languages: ["English", "Hindi", "Kannada"],
    expertise: ["Product Development", "SaaS", "Marketing", "Business Strategy"],
    rating: 0,
    reviewCount: 0,
    completedValidations: 0,
    responseTime: "Sample availability",
    nextAvailable: "Sample slot",
    verified: false,
    isVerified: false,
    isDemo: true,
    level: "New Validator",
    shortBio: "Synthetic profile used to demonstrate the validation workflow.",
    bio: "This profile is demonstration data and does not represent a real person or professional history.",
    qualifications: [],
    industryExperience: [],
    incubationActivities: [],
    mentoringExperience: "Sample validation workflow only.",
    serviceTypes: ["Written Idea Review", "Live Validation Session", "Expert Validation"]
  },
  {
    id: "validator-meera-iyer",
    name: "Demo Reviewer - Rural Innovation",
    role: "Synthetic startup document reviewer",
    affiliationVerified: false,
    location: "India",
    languages: ["English", "Hindi", "Marathi"],
    expertise: ["Agriculture", "Sustainability", "Electronics and Hardware", "Finance"],
    rating: 0,
    reviewCount: 0,
    completedValidations: 0,
    responseTime: "Sample availability",
    nextAvailable: "Sample slot",
    verified: false,
    isVerified: false,
    isDemo: true,
    level: "New Validator",
    shortBio: "Synthetic profile used to demonstrate the validation workflow.",
    bio: "This profile is demonstration data and does not represent a real person or professional history.",
    qualifications: [],
    industryExperience: [],
    incubationActivities: [],
    mentoringExperience: "Sample validation workflow only.",
    serviceTypes: ["Written Idea Review", "Expert Validation"]
  }
];

export function getValidatorDirectory(demoEnabled = isDemoDataEnabled()): ValidatorProfile[] {
  return demoEnabled ? demoValidators : [];
}

export const validators = getValidatorDirectory();

export const validationBookings: ValidationBooking[] = isDemoDataEnabled() ? [
  {
    id: "validation-booking-1",
    founderId: "founder-1",
    founderName: "Nisha Rao",
    validatorId: "validator-priya-menon",
    serviceType: "Expert Validation",
    workspace: workspaceRef(0),
    domain: "HealthTech",
    status: "Validation Completed",
    requestNote: "Please focus on clinical workflow feasibility, buyer urgency, and incubation readiness.",
    scheduledFor: "2026-07-31T17:30:00+05:30",
    meetingLanguage: "English",
    meetingLink: "https://meet.google.com/venture-validation-medlens",
    deliveryDeadline: "2026-08-03",
    paymentStatus: "Released",
    payoutStatus: "Released",
    totalAmount: validationServices["Expert Validation"].founderPrice,
    createdAt: "2026-07-18",
    nextAction: "Use the Human Reviewed summary in opportunity applications.",
    accepted: true
  },
  {
    id: "validation-booking-2",
    founderId: "founder-2",
    founderName: "Aarav Mehta",
    validatorId: "validator-meera-iyer",
    serviceType: "Live Validation Session",
    workspace: workspaceRef(1, 2, true),
    domain: "Sustainability",
    status: "Session Scheduled",
    requestNote: "Need feedback on whether campus EV routing is grant-ready.",
    scheduledFor: "2026-08-01T18:00:00+05:30",
    meetingLanguage: "Hindi",
    meetingLink: "https://meet.google.com/venture-validation-voltroute",
    deliveryDeadline: "2026-08-02",
    paymentStatus: "Held in Escrow",
    payoutStatus: "Pending Report",
    totalAmount: validationServices["Live Validation Session"].founderPrice,
    createdAt: "2026-07-26",
    nextAction: "Attend the live validation session.",
    accepted: true
  },
  {
    id: "validation-booking-3",
    founderId: "founder-3",
    founderName: "Rehan Kapoor",
    validatorId: "validator-arjun-balan",
    serviceType: "Written Idea Review",
    workspace: workspaceRef(2),
    domain: "SaaS",
    status: "Document Under Review",
    requestNote: "Please review the SaaS business model and incubator application readiness.",
    meetingLanguage: "English",
    deliveryDeadline: "2026-07-30",
    paymentStatus: "Held in Escrow",
    payoutStatus: "Pending Report",
    totalAmount: validationServices["Written Idea Review"].founderPrice,
    createdAt: "2026-07-27",
    nextAction: "Wait for the written report.",
    accepted: true
  },
  {
    id: "validation-booking-4",
    founderId: "founder-4",
    founderName: "Kavya S",
    validatorId: "validator-farah-khan",
    serviceType: "Written Idea Review",
    workspace: workspaceRef(3),
    domain: "Agriculture",
    status: "Awaiting Validator Acceptance",
    requestNote: "I need a beginner-friendly review before applying to a grant.",
    meetingLanguage: "English",
    deliveryDeadline: "2026-08-04",
    paymentStatus: "Pending",
    payoutStatus: "Not Eligible",
    totalAmount: validationServices["Written Idea Review"].founderPrice,
    createdAt: "2026-07-28",
    nextAction: "Validator must accept before confidential document access opens.",
    accepted: false
  }
] : [];

const reportScores: ValidationScore[] = [
  { dimension: "Problem Clarity", score: 88, justification: "The hospital documentation pain is specific, repeated, and tied to measurable shift-level delays." },
  { dimension: "Customer Evidence", score: 82, justification: "Three paid pilots create a strong base, but buyer references should be organized by hospital size." },
  { dimension: "Solution Relevance", score: 86, justification: "The workflow assistant maps well to nurse-manager and triage documentation needs." },
  { dimension: "Market Understanding", score: 78, justification: "The segment is clear, but the bottom-up market model should show reachable hospitals by region." },
  { dimension: "Competition Awareness", score: 74, justification: "Known EHR and AI documentation competitors are named, but procurement differentiation needs sharper proof." },
  { dimension: "Technical Feasibility", score: 84, justification: "The technical architecture is believable for the current pilots and early integrations." },
  { dimension: "Business Model", score: 76, justification: "Per-bed SaaS is reasonable, but pricing experiments need stronger evidence." },
  { dimension: "Founder Readiness", score: 86, justification: "The team has relevant clinical operations and ML coverage." },
  { dimension: "Evidence Strength", score: 80, justification: "Usage and pilot data are credible but should include cohort-level retention." },
  { dimension: "Investor Application Readiness", score: 83, justification: "Ready for selective incubator and pre-seed office-hour applications after the listed improvements." }
];

export const validationReports: ValidationReport[] = isDemoDataEnabled() ? [
  {
    id: "validation-report-1",
    bookingId: "validation-booking-1",
    validatorId: "validator-priya-menon",
    validationDate: "2026-07-24",
    serviceType: "Expert Validation",
    ideaWorkspaceVersion: 1,
    areasReviewed: ["Problem clarity", "Customer evidence", "Technical feasibility", "Business model", "Investor application readiness"],
    evidenceReviewed: ["Idea Workspace v1", "Pilot-results PDF", "One-minute demo video", "Founder note"],
    strengths: ["Specific hospital workflow problem", "Paid pilot evidence", "Clear starting customer persona"],
    weaknesses: ["Procurement assumptions need more proof", "Compliance evidence should be summarized earlier", "Pricing model lacks enough willingness-to-pay tests"],
    majorAssumptions: ["Small hospitals will adopt lightweight AI tooling outside core EHR", "Nurse managers can influence procurement", "Documentation time savings translate into clear ROI"],
    majorRisks: ["Long hospital sales cycles", "Privacy and compliance review delays", "EHR incumbents bundling similar workflow features"],
    recommendedExperiments: ["Interview five hospital procurement stakeholders", "Run an ROI model with two pilot hospitals", "Create a compliance evidence appendix"],
    requiredImprovements: ["Add cohort-level usage data", "Add procurement decision map", "Add compliance and data-handling summary"],
    validatorConclusion: "The document is credible and suitable for incubation and selective investor applications after the required improvements are reflected in the next version.",
    readinessStage: "Investor Application Ready",
    scores: reportScores,
    approvedForBadge: true,
    badgeRecommendation: ["Human Reviewed", "Technical Feasibility Reviewed", "Investor Application Ready"]
  }
] : [];

export const validationBadges: ValidationBadge[] = isDemoDataEnabled() ? [
  {
    id: "validation-badge-1",
    name: "Human Reviewed",
    validatorId: "validator-priya-menon",
    validationType: "Expert Validation",
    validationDate: "2026-07-24",
    workspaceId: "workspace-1",
    workspaceVersion: 1,
    areasReviewed: ["Problem clarity", "Customer evidence", "Technical feasibility", "Business model"],
    readinessStage: "Investor Application Ready",
    verificationId: "VC-HR-2026-00091",
    summaryVisibleToInvestors: "Expert validator reviewed Idea Workspace v1 and approved a limited summary for investor and incubator applications."
  },
  {
    id: "validation-badge-2",
    name: "Technical Feasibility Reviewed",
    validatorId: "validator-priya-menon",
    validationType: "Expert Validation",
    validationDate: "2026-07-24",
    workspaceId: "workspace-1",
    workspaceVersion: 1,
    areasReviewed: ["Technical feasibility", "Evidence strength"],
    readinessStage: "Investor Application Ready",
    verificationId: "VC-TF-2026-00091",
    summaryVisibleToInvestors: "Technical feasibility was reviewed against current pilot evidence and implementation scope."
  }
] : [];

export const validatorReviews: ValidatorReview[] = isDemoDataEnabled() ? [
  {
    id: "validator-review-1",
    validatorId: "validator-priya-menon",
    bookingId: "validation-booking-1",
    overallRating: 5,
    domainKnowledge: 5,
    usefulness: 5,
    clarity: 5,
    reportQuality: 5,
    punctuality: 4,
    writtenReview: "The report was specific and helped us fix investor-facing gaps without exposing confidential idea details.",
    verifiedBooking: false,
    isDemo: true
  },
  {
    id: "validator-review-2",
    validatorId: "validator-arjun-balan",
    bookingId: "validation-booking-3",
    overallRating: 4.7,
    domainKnowledge: 5,
    usefulness: 4,
    clarity: 5,
    reportQuality: 4,
    punctuality: 5,
    writtenReview: "Clear feedback on what an incubator reviewer would expect. No private business details are shared here.",
    verifiedBooking: false,
    isDemo: true
  }
] : [];

export const validationActivity: ValidationActivity[] = isDemoDataEnabled() ? [
  { id: "activity-1", bookingId: "validation-booking-1", label: "Booking created", timestamp: "Jul 18, 2026", complete: true },
  { id: "activity-2", bookingId: "validation-booking-1", label: "Payment completed", timestamp: "Jul 18, 2026", complete: true },
  { id: "activity-3", bookingId: "validation-booking-1", label: "Validator accepted", timestamp: "Jul 19, 2026", complete: true },
  { id: "activity-4", bookingId: "validation-booking-1", label: "Document viewed", timestamp: "Jul 20, 2026", complete: true },
  { id: "activity-5", bookingId: "validation-booking-1", label: "Meeting completed", timestamp: "Jul 22, 2026", complete: true },
  { id: "activity-6", bookingId: "validation-booking-1", label: "Report submitted", timestamp: "Jul 24, 2026", complete: true },
  { id: "activity-7", bookingId: "validation-booking-1", label: "Founder submitted revision", timestamp: "Jul 25, 2026", complete: true },
  { id: "activity-8", bookingId: "validation-booking-1", label: "Validator approved revision", timestamp: "Jul 26, 2026", complete: true },
  { id: "activity-9", bookingId: "validation-booking-1", label: "Badge awarded", timestamp: "Jul 26, 2026", complete: true },
  { id: "activity-10", bookingId: "validation-booking-2", label: "Booking created", timestamp: "Jul 26, 2026", complete: true },
  { id: "activity-11", bookingId: "validation-booking-2", label: "Payment completed", timestamp: "Jul 26, 2026", complete: true },
  { id: "activity-12", bookingId: "validation-booking-2", label: "Validator accepted", timestamp: "Jul 27, 2026", complete: true },
  { id: "activity-13", bookingId: "validation-booking-2", label: "Session scheduled", timestamp: "Aug 1, 2026", complete: false }
] : [];

export function getValidatorById(id: string) {
  return validators.find((validator) => validator.id === id);
}

export function getBookingById(id: string) {
  return validationBookings.find((booking) => booking.id === id);
}

export function getReportByBookingId(bookingId: string) {
  return validationReports.find((report) => report.bookingId === bookingId);
}

export function getReviewsForValidator(validatorId: string) {
  return validatorReviews.filter((review) => review.validatorId === validatorId);
}

export function getActivityForBooking(bookingId: string) {
  return validationActivity.filter((activity) => activity.bookingId === bookingId);
}

export function getBadgesForWorkspace(workspaceId: string) {
  return validationBadges.filter((badge) => badge.workspaceId === workspaceId);
}

export function getServicesForValidator(validator: ValidatorProfile) {
  return validator.serviceTypes.map((serviceType) => validationServices[serviceType]);
}

export function validatorMatchesFilters(validator: ValidatorProfile, filters: {
  query: string;
  domain: "All" | ValidationDomain;
  serviceType: "All" | ValidationServiceType;
  language: string;
  minRating: number;
  availability: string;
}) {
  const query = filters.query.trim().toLowerCase();
  const haystack = `${validator.name} ${validator.role} ${validator.organisationAffiliation ?? ""} ${validator.expertise.join(" ")}`.toLowerCase();
  return (
    (!query || haystack.includes(query)) &&
    (filters.domain === "All" || validator.expertise.includes(filters.domain)) &&
    (filters.serviceType === "All" || validator.serviceTypes.includes(filters.serviceType)) &&
    (!filters.language || filters.language === "All" || validator.languages.includes(filters.language)) &&
    validator.rating >= filters.minRating &&
    (!filters.availability || filters.availability === "All" || validator.nextAvailable.toLowerCase().includes(filters.availability.toLowerCase()))
  );
}

export function workspaceTemplateLabel(template: ValidationWorkspaceReference["template"]) {
  return getTemplateDef(template).label;
}
