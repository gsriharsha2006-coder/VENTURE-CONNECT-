import assert from "node:assert/strict";
import test from "node:test";

import {
  ReportValidationError,
  parseStructuredReportOutput,
  validateStructuredReportPayload
} from "../src/lib/ai/reportSchema";

const validBasicReport = {
  startupName: "Campus Labs",
  reportType: "Basic SWOT Report",
  overallScore: 68,
  finalRecommendation: "Needs Validation",
  executiveSummary: "A promising problem with customer evidence still required.",
  problemClarity: 72,
  solutionClarity: 70,
  customerClarity: 62,
  validationLevel: 48,
  businessModelClarity: 59,
  teamReadiness: 67,
  strengths: ["Clear student workflow"],
  weaknesses: ["Limited interview evidence"],
  priorityActions: ["Interview ten target users"],
  disclaimer: "Educational guidance only; this is not investment advice."
};

test("structured AI output accepts the exact expected report contract", () => {
  const parsed = parseStructuredReportOutput(
    `\`\`\`json\n${JSON.stringify(validBasicReport)}\n\`\`\``,
    "Basic SWOT Report"
  );
  assert.equal(parsed.startupName, "Campus Labs");
  assert.equal(parsed.overallScore, 68);
});

test("structured AI output rejects invented fields and out-of-range scores", () => {
  assert.throws(
    () => validateStructuredReportPayload({ ...validBasicReport, promisedFunding: "Rs 1 crore" }, "Basic SWOT Report"),
    ReportValidationError
  );
  assert.throws(
    () => validateStructuredReportPayload({ ...validBasicReport, overallScore: 101 }, "Basic SWOT Report"),
    ReportValidationError
  );
});
