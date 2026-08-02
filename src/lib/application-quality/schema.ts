import type { EligibilityResult, QualityIssue, SemanticQualityResult } from "./types";

const statuses = new Set(["ready_to_submit", "needs_revision", "incomplete", "eligibility_mismatch", "manual_review"]);
const severities = new Set(["low", "medium", "high"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function score(value: unknown, max = 100) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length <= 600);
}

function qualityIssues(value: unknown): value is QualityIssue[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) &&
    typeof item.field === "string" &&
    typeof item.code === "string" &&
    typeof item.message === "string" &&
    typeof item.suggestedAction === "string" &&
    severities.has(String(item.severity))
  );
}

function eligibility(value: unknown): value is EligibilityResult {
  return isRecord(value) && ["sectorMatch", "stageMatch", "geographyMatch", "fundingRangeMatch", "collegeMatch", "deadlineOpen"]
    .every((key) => typeof value[key] === "boolean");
}

export function isSemanticQualityResult(value: unknown): value is SemanticQualityResult {
  if (!isRecord(value)) return false;
  return score(value.qualityScore) &&
    score(value.completenessScore, 20) &&
    score(value.meaningfulContentScore, 15) &&
    score(value.problemSolutionScore, 20) &&
    score(value.customerMarketScore, 15) &&
    score(value.businessModelScore, 10) &&
    score(value.validationTractionScore, 10) &&
    score(value.consistencyScore, 5) &&
    score(value.fundingClarityScore, 5) &&
    score(value.organisationFitScore) &&
    statuses.has(String(value.status)) &&
    typeof value.summary === "string" &&
    strings(value.strengths) &&
    qualityIssues(value.issues) &&
    qualityIssues(value.fieldFeedback) &&
    eligibility(value.eligibility) &&
    strings(value.unsupportedClaims) &&
    strings(value.contradictoryClaims) &&
    (value.manualReviewReason === null || typeof value.manualReviewReason === "string");
}

export function parseSemanticQualityResult(value: unknown) {
  if (!isSemanticQualityResult(value)) throw new Error("Semantic quality response did not match the required schema.");
  return value;
}

export function buildApplicationQualityJsonSchema() {
  const issueSchema = {
    type: "object",
    additionalProperties: false,
    required: ["field", "severity", "message", "suggestedAction", "code"],
    properties: {
      field: { type: "string" },
      severity: { type: "string", enum: ["low", "medium", "high"] },
      message: { type: "string" },
      suggestedAction: { type: "string" },
      code: { type: "string" }
    }
  };
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "qualityScore", "completenessScore", "meaningfulContentScore", "problemSolutionScore", "customerMarketScore",
      "businessModelScore", "validationTractionScore", "consistencyScore", "fundingClarityScore", "organisationFitScore",
      "status", "summary", "strengths", "issues", "fieldFeedback", "eligibility", "unsupportedClaims", "contradictoryClaims", "manualReviewReason"
    ],
    properties: {
      qualityScore: { type: "number", minimum: 0, maximum: 100 },
      completenessScore: { type: "number", minimum: 0, maximum: 20 },
      meaningfulContentScore: { type: "number", minimum: 0, maximum: 15 },
      problemSolutionScore: { type: "number", minimum: 0, maximum: 20 },
      customerMarketScore: { type: "number", minimum: 0, maximum: 15 },
      businessModelScore: { type: "number", minimum: 0, maximum: 10 },
      validationTractionScore: { type: "number", minimum: 0, maximum: 10 },
      consistencyScore: { type: "number", minimum: 0, maximum: 5 },
      fundingClarityScore: { type: "number", minimum: 0, maximum: 5 },
      organisationFitScore: { type: "number", minimum: 0, maximum: 100 },
      status: { type: "string", enum: Array.from(statuses) },
      summary: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      issues: { type: "array", items: issueSchema },
      fieldFeedback: { type: "array", items: issueSchema },
      eligibility: {
        type: "object",
        additionalProperties: false,
        required: ["sectorMatch", "stageMatch", "geographyMatch", "fundingRangeMatch", "collegeMatch", "deadlineOpen"],
        properties: Object.fromEntries(["sectorMatch", "stageMatch", "geographyMatch", "fundingRangeMatch", "collegeMatch", "deadlineOpen"].map((key) => [key, { type: "boolean" }]))
      },
      unsupportedClaims: { type: "array", items: { type: "string" } },
      contradictoryClaims: { type: "array", items: { type: "string" } },
      manualReviewReason: { anyOf: [{ type: "string" }, { type: "null" }] }
    }
  };
}
