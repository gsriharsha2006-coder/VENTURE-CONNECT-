import type { ApplicationQualityCorrection, QualityCheckStatus, SemanticQualityResult } from "./types";

export const QUALITY_CHECK_STATUSES: QualityCheckStatus[] = [
  "ready_to_submit",
  "needs_revision",
  "incomplete",
  "eligibility_mismatch",
  "manual_review"
];

const RESULT_KEYS = ["status", "score", "summary", "strengths", "majorIssues", "corrections", "manualReviewReason"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

function boundedStrings(value: unknown, maximum: number): value is string[] {
  return Array.isArray(value) && value.length <= maximum && value.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 600);
}

function validCorrections(value: unknown, validFields: Set<string>): value is ApplicationQualityCorrection[] {
  return Array.isArray(value) && value.length <= 3 && value.every((item) => {
    if (!isRecord(item) || !hasExactKeys(item, ["field", "issue", "correction"])) return false;
    return typeof item.field === "string" && validFields.has(item.field) &&
      typeof item.issue === "string" && item.issue.trim().length > 0 && item.issue.length <= 600 &&
      typeof item.correction === "string" && item.correction.trim().length > 0 && item.correction.length <= 600;
  });
}

export function isSemanticQualityResult(value: unknown, validFieldNames: string[]): value is SemanticQualityResult {
  if (!isRecord(value) || !hasExactKeys(value, RESULT_KEYS)) return false;
  const status = String(value.status);
  const manualReasonValid = status === "manual_review"
    ? typeof value.manualReviewReason === "string" && value.manualReviewReason.trim().length > 0 && value.manualReviewReason.length <= 600
    : value.manualReviewReason === null;
  return QUALITY_CHECK_STATUSES.includes(status as QualityCheckStatus) &&
    typeof value.score === "number" && Number.isFinite(value.score) && value.score >= 0 && value.score <= 100 &&
    typeof value.summary === "string" && value.summary.trim().length > 0 && value.summary.length <= 600 &&
    boundedStrings(value.strengths, 3) &&
    boundedStrings(value.majorIssues, 3) &&
    validCorrections(value.corrections, new Set(validFieldNames)) &&
    manualReasonValid;
}

export function parseSemanticQualityResult(value: unknown, validFieldNames: string[]) {
  if (!isSemanticQualityResult(value, validFieldNames)) throw new Error("Semantic quality response did not match the required schema.");
  return value;
}

export function buildManualReviewFallback(reason = "The automated quality check could not confidently validate this application."): SemanticQualityResult {
  return {
    status: "manual_review",
    score: 50,
    summary: "A human reviewer should confirm the application's clarity and consistency.",
    strengths: [],
    majorIssues: ["The automated meaning-based review did not return a reliable structured result."],
    corrections: [],
    manualReviewReason: reason
  };
}

export function buildApplicationQualityJsonSchema(validFieldNames: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: RESULT_KEYS,
    properties: {
      status: { type: "string", enum: QUALITY_CHECK_STATUSES },
      score: { type: "number", minimum: 0, maximum: 100 },
      summary: { type: "string", maxLength: 600 },
      strengths: { type: "array", maxItems: 3, items: { type: "string", maxLength: 600 } },
      majorIssues: { type: "array", maxItems: 3, items: { type: "string", maxLength: 600 } },
      corrections: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "issue", "correction"],
          properties: {
            field: { type: "string", enum: validFieldNames },
            issue: { type: "string", maxLength: 600 },
            correction: { type: "string", maxLength: 600 }
          }
        }
      },
      manualReviewReason: { anyOf: [{ type: "string", maxLength: 600 }, { type: "null" }] }
    }
  };
}
