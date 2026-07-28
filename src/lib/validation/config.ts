import type { ValidationDomain, ValidationService, ValidatorLevel } from "@/lib/validation/types";

export const validationDomains: ValidationDomain[] = [
  "AI and Machine Learning",
  "SaaS",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Agriculture",
  "Electronics and Hardware",
  "Sustainability",
  "Consumer Products",
  "Business Strategy",
  "Marketing",
  "Finance",
  "Product Development"
];

export const validationServices: Record<ValidationService["type"], ValidationService> = {
  "Written Idea Review": {
    type: "Written Idea Review",
    founderPrice: 149,
    validatorPayout: 100,
    platformShare: 49,
    expectedDelivery: "48 hours",
    requiresLiveSession: false,
    includesRevisionReview: false,
    deliverables: [
      "Review of the selected Idea Workspace document",
      "Structured dimension-based score",
      "Strengths and weaknesses",
      "Recommended improvements",
      "Written report",
      "No live meeting"
    ]
  },
  "Live Validation Session": {
    type: "Live Validation Session",
    founderPrice: 299,
    validatorPayout: 220,
    platformShare: 79,
    expectedDelivery: "24 hours after session",
    requiresLiveSession: true,
    includesRevisionReview: false,
    deliverables: [
      "Document review",
      "30-minute video meeting",
      "Questions and discussion",
      "Short written report",
      "Improvement checklist"
    ]
  },
  "Expert Validation": {
    type: "Expert Validation",
    founderPrice: 599,
    validatorPayout: 450,
    platformShare: 149,
    expectedDelivery: "72 hours",
    requiresLiveSession: true,
    includesRevisionReview: true,
    deliverables: [
      "Detailed document review",
      "45-minute video session",
      "Full structured scorecard",
      "Detailed report",
      "One revised-document review",
      "Eligibility for a Human-Reviewed badge after approval"
    ]
  }
};

export const validatorLevelRules: Record<ValidatorLevel, {
  requirement: string;
  weeklyLimit: number | "Custom";
  pricingRange: string;
}> = {
  "New Validator": {
    requirement: "Credentials approved",
    weeklyLimit: 1,
    pricingRange: "Entry pricing range"
  },
  "Verified Validator": {
    requirement: "At least 5 completed validations with strong ratings",
    weeklyLimit: 3,
    pricingRange: "Higher pricing range"
  },
  "Partner Validator": {
    requirement: "At least 15 completed validations, strong report quality, low dispute rate",
    weeklyLimit: 5,
    pricingRange: "Can set prices up to Rs 599 or admin-approved amount"
  },
  "Institutional Expert": {
    requirement: "Verified R&D department, incubation cell, or industry partner",
    weeklyLimit: "Custom",
    pricingRange: "Institution-approved pricing"
  }
};

export const validationTrustMetrics = [
  { label: "Verified validators", value: "128", note: "Demo data" },
  { label: "Completed validations", value: "2,840", note: "Demo data" },
  { label: "Average response time", value: "18h", note: "Demo data" },
  { label: "Founder satisfaction", value: "4.8/5", note: "Demo data" }
];

export const validationStatusOrder = [
  "Payment Confirmed",
  "Awaiting Validator Acceptance",
  "Document Under Review",
  "Session Scheduled",
  "Report In Progress",
  "Improvements Required",
  "Revised Document Submitted",
  "Validation Completed"
];
