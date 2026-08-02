import type { StartupStage } from "@/lib/types";

export type ApplicationAnswerValue = string | number | boolean | string[] | null;

export type ApplicationDraft = {
  applicationId: string;
  opportunityId: string;
  sector: string;
  startupStage: StartupStage;
  geography: string;
  college?: string;
  fundingRequirement?: number;
  answers: Record<string, ApplicationAnswerValue>;
  requiredFields: string[];
};

export type EligibilityRules = {
  acceptedSectors?: string[];
  acceptedStages?: StartupStage[];
  acceptedGeographies?: string[];
  eligibleColleges?: string[];
  minimumFunding?: number;
  maximumFunding?: number;
  deadline?: string;
  mandatoryLinks?: string[];
};

export type QualityIssueSeverity = "low" | "medium" | "high";

export type QualityIssue = {
  field: string;
  severity: QualityIssueSeverity;
  message: string;
  suggestedAction: string;
  code: string;
};

export type EligibilityResult = {
  sectorMatch: boolean;
  stageMatch: boolean;
  geographyMatch: boolean;
  fundingRangeMatch: boolean;
  collegeMatch: boolean;
  deadlineOpen: boolean;
};

export type QualityCheckStatus =
  | "ready_to_submit"
  | "needs_revision"
  | "incomplete"
  | "eligibility_mismatch"
  | "manual_review";

export type ApplicationQualityResult = {
  qualityScore: number;
  completenessScore: number;
  meaningfulContentScore: number;
  problemSolutionScore: number;
  customerMarketScore: number;
  businessModelScore: number;
  validationTractionScore: number;
  consistencyScore: number;
  fundingClarityScore: number;
  organisationFitScore: number;
  status: QualityCheckStatus;
  summary: string;
  strengths: string[];
  issues: QualityIssue[];
  fieldFeedback: QualityIssue[];
  eligibility: EligibilityResult;
  eligibilityMismatches: string[];
  unsupportedClaims: string[];
  contradictoryClaims: string[];
  manualReviewReason: string | null;
  semanticReviewRequired: boolean;
  checkedAt: string;
  inputFingerprint?: string;
};

export type SemanticQualityResult = Omit<
  ApplicationQualityResult,
  "eligibilityMismatches" | "semanticReviewRequired" | "checkedAt" | "inputFingerprint"
>;
