import type { StartupStage } from "@/lib/types";

export type ApplicationAnswerValue = string | number | boolean | string[] | null;

export type ApplicationDraft = {
  applicationId: string;
  opportunityId: string;
  sector: string;
  startupStage: StartupStage;
  geography: string;
  college?: string;
  isStudent?: boolean;
  fundingRequirement?: number;
  answers: Record<string, ApplicationAnswerValue>;
  requiredFields: string[];
};

export type EligibilityRules = {
  acceptedSectors?: string[];
  acceptedStages?: StartupStage[];
  acceptedGeographies?: string[];
  eligibleColleges?: string[];
  studentOnly?: boolean;
  deadline?: string;
  mandatoryLinks?: string[];
};

export type QualityCheckStatus =
  | "ready_to_submit"
  | "needs_revision"
  | "incomplete"
  | "eligibility_mismatch"
  | "manual_review";

export type ApplicationQualityCorrection = {
  field: string;
  issue: string;
  correction: string;
};

export type EligibilityMismatch = {
  field: string;
  requirement: string;
  expected: string;
  actual: string;
};

export type ApplicationQualityResult = {
  status: QualityCheckStatus;
  score: number;
  summary: string;
  strengths: string[];
  majorIssues: string[];
  corrections: ApplicationQualityCorrection[];
  eligibilityMismatches: EligibilityMismatch[];
  manualReviewReason: string | null;
  semanticReviewRequired: boolean;
  checkedAt: string;
  inputFingerprint?: string;
};

export type SemanticQualityResult = Pick<
  ApplicationQualityResult,
  "status" | "score" | "summary" | "strengths" | "majorIssues" | "corrections" | "manualReviewReason"
>;
