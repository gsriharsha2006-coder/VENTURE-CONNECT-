import type { WorkspaceTemplate } from "@/lib/types";

export type ValidationDomain =
  | "AI and Machine Learning"
  | "SaaS"
  | "FinTech"
  | "HealthTech"
  | "EdTech"
  | "Agriculture"
  | "Electronics and Hardware"
  | "Sustainability"
  | "Consumer Products"
  | "Business Strategy"
  | "Marketing"
  | "Finance"
  | "Product Development";

export type ValidationServiceType = "Written Idea Review" | "Live Validation Session" | "Expert Validation";

export type ValidatorLevel =
  | "New Validator"
  | "Verified Validator"
  | "Partner Validator"
  | "Institutional Expert";

export type ValidationReadinessStage =
  | "Needs Research"
  | "Early Validation"
  | "Evidence Developing"
  | "Validation Ready"
  | "Pilot Ready"
  | "Investor Application Ready";

export type ValidationBookingStatus =
  | "Payment Confirmed"
  | "Awaiting Validator Acceptance"
  | "Document Under Review"
  | "Session Scheduled"
  | "Report In Progress"
  | "Improvements Required"
  | "Revised Document Submitted"
  | "Validation Completed"
  | "Disputed"
  | "Cancelled";

export type ValidationBadgeName =
  | "Human Reviewed"
  | "Problem Review Completed"
  | "Customer Evidence Reviewed"
  | "Technical Feasibility Reviewed"
  | "Business Model Reviewed"
  | "Incubation Cell Reviewed"
  | "Investor Application Ready";

export type ValidationService = {
  type: ValidationServiceType;
  founderPrice: number;
  validatorPayout: number;
  platformShare: number;
  expectedDelivery: string;
  requiresLiveSession: boolean;
  includesRevisionReview: boolean;
  deliverables: string[];
};

export type ValidatorProfile = {
  id: string;
  name: string;
  photoUrl?: string;
  role: string;
  /** @deprecated Use organisationAffiliation with affiliationVerified. */
  institution?: string;
  organisationAffiliation?: string;
  affiliationVerified: boolean;
  location: string;
  languages: string[];
  expertise: ValidationDomain[];
  /** @deprecated Use averageRating when verified evidence exists. */
  rating: number;
  averageRating?: number;
  reviewCount: number;
  completedValidations: number;
  responseTime: string;
  nextAvailable: string;
  /** @deprecated Use isVerified. */
  verified: boolean;
  isVerified: boolean;
  isDemo: boolean;
  level: ValidatorLevel;
  shortBio: string;
  bio: string;
  qualifications: string[];
  industryExperience: string[];
  incubationActivities: string[];
  mentoringExperience: string;
  serviceTypes: ValidationServiceType[];
};

export type ValidationWorkspaceReference = {
  id: string;
  startupName: string;
  template: WorkspaceTemplate;
  completionPercentage: number;
  lastUpdated: string;
  version: number;
  status: "Complete" | "In Progress" | "Draft";
  majorChangesSinceBadge?: boolean;
};

export type ValidationBooking = {
  id: string;
  founderId: string;
  founderName: string;
  validatorId: string;
  serviceType: ValidationServiceType;
  workspace: ValidationWorkspaceReference;
  domain: ValidationDomain;
  status: ValidationBookingStatus;
  requestNote: string;
  scheduledFor?: string;
  meetingLanguage: string;
  meetingLink?: string;
  deliveryDeadline: string;
  paymentStatus: "Pending" | "Held in Escrow" | "Released" | "Refunded";
  payoutStatus: "Not Eligible" | "Pending Report" | "Pending Dispute Window" | "Ready to Release" | "Released";
  totalAmount: number;
  createdAt: string;
  nextAction: string;
  accepted: boolean;
  conflictDeclared?: boolean;
};

export type ValidationScore = {
  dimension:
    | "Problem Clarity"
    | "Customer Evidence"
    | "Solution Relevance"
    | "Market Understanding"
    | "Competition Awareness"
    | "Technical Feasibility"
    | "Business Model"
    | "Founder Readiness"
    | "Evidence Strength"
    | "Investor Application Readiness";
  score: number;
  justification: string;
};

export type ValidationReport = {
  id: string;
  bookingId: string;
  validatorId: string;
  validationDate: string;
  serviceType: ValidationServiceType;
  ideaWorkspaceVersion: number;
  areasReviewed: string[];
  evidenceReviewed: string[];
  strengths: string[];
  weaknesses: string[];
  majorAssumptions: string[];
  majorRisks: string[];
  recommendedExperiments: string[];
  requiredImprovements: string[];
  validatorConclusion: string;
  readinessStage: ValidationReadinessStage;
  scores: ValidationScore[];
  approvedForBadge: boolean;
  badgeRecommendation?: ValidationBadgeName[];
};

export type ValidationBadge = {
  id: string;
  name: ValidationBadgeName;
  validatorId: string;
  validationType: ValidationServiceType;
  validationDate: string;
  workspaceId: string;
  workspaceVersion: number;
  areasReviewed: string[];
  readinessStage: ValidationReadinessStage;
  verificationId: string;
  summaryVisibleToInvestors: string;
};

export type ValidatorReview = {
  id: string;
  validatorId: string;
  bookingId: string;
  overallRating: number;
  domainKnowledge: number;
  usefulness: number;
  clarity: number;
  reportQuality: number;
  punctuality: number;
  writtenReview: string;
  verifiedBooking: boolean;
  isDemo?: boolean;
};

export type ValidationActivity = {
  id: string;
  bookingId: string;
  label: string;
  timestamp: string;
  complete: boolean;
};
