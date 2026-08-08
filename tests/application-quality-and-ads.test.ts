import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runDeterministicQualityCheck, runRuleBasedValidation } from "../src/lib/application-quality/engine";
import { isSemanticQualityResult, QUALITY_CHECK_STATUSES } from "../src/lib/application-quality/schema";
import type { ApplicationDraft, SemanticQualityResult } from "../src/lib/application-quality/types";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const validFields = ["problem", "solution", "targetCustomer", "businessModel", "customerValidation", "useOfFunds", "website"];

function draft(overrides: Partial<ApplicationDraft> = {}): ApplicationDraft {
  return {
    applicationId: "application-1",
    opportunityId: "opportunity-1",
    sector: "SaaS",
    startupStage: "MVP",
    geography: "India",
    college: "Example Institute",
    isStudent: true,
    fundingRequirement: 500000,
    requiredFields: ["problem", "solution", "targetCustomer", "businessModel", "customerValidation", "useOfFunds"],
    answers: {
      problem: "Small support teams lose several hours each week coordinating fragmented customer requests.",
      solution: "A shared support workspace organises every request and assigns clear ownership to the right teammate.",
      targetCustomer: "Customer support leaders at Indian software companies with 10 to 100 employees.",
      businessModel: "The proposed model is a monthly subscription paid by each participating software company.",
      customerValidation: "We interviewed twelve support leads and will validate the prototype through three structured pilots.",
      useOfFunds: "The requested funds will support product development, pilot infrastructure, and customer onboarding.",
      website: "https://example.test"
    },
    ...overrides
  };
}

function semantic(overrides: Partial<SemanticQualityResult> = {}): SemanticQualityResult {
  return {
    status: "ready_to_submit",
    score: 86,
    summary: "The application is clear enough for organisation review.",
    strengths: ["The problem identifies a specific operational pain point."],
    majorIssues: [],
    corrections: [],
    manualReviewReason: null,
    ...overrides
  };
}

test("missing required field produces Incomplete with the exact field", () => {
  const result = runDeterministicQualityCheck(draft({ answers: { ...draft().answers, problem: "" } }), {});
  assert.equal(result.status, "incomplete");
  assert.equal(result.corrections[0].field, "problem");
  assert.match(result.corrections[0].issue, /Problem Statement is missing/);
});

test("placeholder content is detected", () => {
  const issues = runRuleBasedValidation(draft({ answers: { ...draft().answers, problem: "TBD" } }));
  assert.equal(issues.some((item) => item.code === "placeholder" && item.field === "problem"), true);
});

test("random-character content is detected", () => {
  const issues = runRuleBasedValidation(draft({ answers: { ...draft().answers, solution: "hjdf87fhsdf" } }));
  assert.equal(issues.some((item) => item.code === "random_text"), true);
});

test("normal abbreviations, product names, and URLs are not random characters", () => {
  const issues = runRuleBasedValidation(draft({
    requiredFields: [],
    answers: { sector: "B2B SaaS", startupName: "Xylo7", website: "https://example.com/v2?q=ABC" }
  }));
  assert.equal(issues.some((item) => item.code === "random_text"), false);
});

test("field-specific very-short answers are detected", () => {
  const issues = runRuleBasedValidation(draft({ answers: { ...draft().answers, targetCustomer: "Students" } }));
  assert.equal(issues.some((item) => item.code === "too_short" && item.field === "targetCustomer"), true);
});

test("optional N/A is allowed", () => {
  const issues = runRuleBasedValidation(draft({ requiredFields: [], answers: { traction: "N/A" } }));
  assert.equal(issues.length, 0);
});

test("essentially repeated answers in separate sections are detected", () => {
  const repeated = "Student founders lose time because application information is fragmented across many documents and forms.";
  const issues = runRuleBasedValidation(draft({ answers: { ...draft().answers, problem: repeated, businessModel: repeated } }));
  assert.equal(issues.some((item) => item.code === "repeated_answer" && item.field === "businessModel"), true);
});

test("invalid URL scheme is detected without a network request", () => {
  const issues = runRuleBasedValidation(draft({ answers: { ...draft().answers, website: "javascript:alert(1)" } }));
  assert.equal(issues.some((item) => item.code === "invalid_url" && item.field === "website"), true);
});

test("explicit eligibility mismatch includes requirement, expected, and actual values", () => {
  const result = runDeterministicQualityCheck(draft({ sector: "Consumer" }), { acceptedSectors: ["SaaS", "Fintech"] });
  assert.equal(result.status, "eligibility_mismatch");
  assert.deepEqual(result.eligibilityMismatches[0], {
    field: "sector", requirement: "Sector or category", expected: "SaaS or Fintech", actual: "Consumer"
  });
  assert.equal(result.semanticReviewRequired, false);
});

test("configured student eligibility is evaluated without inventing criteria", () => {
  const result = runDeterministicQualityCheck(draft({ isStudent: false }), { studentOnly: true });
  assert.equal(result.status, "eligibility_mismatch");
  assert.equal(result.eligibilityMismatches[0].field, "isStudent");
});

test("a date-only deadline remains open through the listed day", () => {
  const result = runDeterministicQualityCheck(draft(), { deadline: "2026-08-08" }, new Date("2026-08-08T18:00:00.000Z"));
  assert.equal(result.eligibilityMismatches.length, 0);
});

test("clear application can resolve to Ready to Submit", () => {
  assert.equal(runDeterministicQualityCheck(draft(), {}).semanticReviewRequired, true);
  assert.equal(isSemanticQualityResult(semantic(), validFields), true);
});

test("understandable but weak application can resolve to Needs Revision", () => {
  assert.equal(isSemanticQualityResult(semantic({
    status: "needs_revision", score: 61,
    majorIssues: ["The target customer remains too broad."],
    corrections: [{ field: "targetCustomer", issue: "The segment is broad.", correction: "Identify the first intended customer segment." }]
  }), validFields), true);
});

test("ambiguous application can resolve conservatively to Manual Review", () => {
  assert.equal(isSemanticQualityResult(semantic({
    status: "manual_review", score: 50,
    summary: "Conflicting claims need human interpretation.",
    manualReviewReason: "The customer type conflicts across two application sections."
  }), validFields), true);
});

test("only the five supported statuses are accepted", () => {
  assert.deepEqual(QUALITY_CHECK_STATUSES, ["ready_to_submit", "needs_revision", "incomplete", "eligibility_mismatch", "manual_review"]);
  QUALITY_CHECK_STATUSES.forEach((status) => assert.equal(isSemanticQualityResult(semantic({
    status,
    manualReviewReason: status === "manual_review" ? "Human interpretation is required." : null
  }), validFields), true));
  assert.equal(isSemanticQualityResult({ ...semantic(), status: "approved_by_ai" }, validFields), false);
});

test("strengths cannot exceed three", () => {
  assert.equal(isSemanticQualityResult(semantic({ strengths: ["One", "Two", "Three", "Four"] }), validFields), false);
});

test("major issues cannot exceed three", () => {
  assert.equal(isSemanticQualityResult(semantic({ majorIssues: ["One", "Two", "Three", "Four"] }), validFields), false);
});

test("corrections must reference fields present in the application", () => {
  assert.equal(isSemanticQualityResult(semantic({ corrections: [{ field: "valuation", issue: "Issue", correction: "Correction" }] }), validFields), false);
});

test("quality score must remain between zero and one hundred", () => {
  assert.equal(isSemanticQualityResult(semantic({ score: 0 }), validFields), true);
  assert.equal(isSemanticQualityResult(semantic({ score: 100 }), validFields), true);
  assert.equal(isSemanticQualityResult(semantic({ score: 101 }), validFields), false);
});

test("quality score is labelled as application quality rather than startup potential", () => {
  const wizard = source("src/components/applications/ApplicationWizard.tsx");
  const types = source("src/lib/application-quality/types.ts");
  assert.match(wizard, /This score measures application completeness and clarity/);
  assert.doesNotMatch(types, /investmentScore|valuationScore|founderScore|marketAttractivenessScore/);
});

test("two-check maximum is enforced in the route and database", () => {
  assert.match(source("src/app/api/applications/[id]/quality-check/route.ts"), /MAX_APPLICATION_CHECKS = 2/);
  assert.match(source("supabase/migrations/202608020002_pace_pilot_release.sql"), /application_quality_checks where application_id = new\.application_id\) >= 2/);
});

test("semantic review is skipped when deterministic validation is decisive", () => {
  const result = runDeterministicQualityCheck(draft({ answers: { ...draft().answers, problem: "" } }), {});
  const route = source("src/app/api/applications/[id]/quality-check/route.ts");
  assert.equal(result.semanticReviewRequired, false);
  assert.match(route, /if \(!deterministic\.semanticReviewRequired\)[\s\S]*?return NextResponse\.json[\s\S]*?const semantic = await generateSemanticQualityReview/);
});

test("invalid semantic output falls back to Manual Review without exposing model output", () => {
  const provider = source("src/lib/application-quality/openai.ts");
  assert.match(provider, /buildManualReviewFallback/);
  assert.doesNotMatch(source("src/components/applications/ApplicationWizard.tsx"), /response\.output|system prompt|chain-of-thought/i);
});

test("immutable submission snapshot remains protected", () => {
  const migration = source("supabase/migrations/202608020001_application_quality_and_sponsorship.sql");
  const submitRoute = source("src/app/api/applications/[id]/submit/route.ts");
  assert.match(migration, /Submitted application snapshots are immutable/);
  assert.match(submitRoute, /submit_ready_application/);
});

test("unauthorised users cannot run another founder's quality check", () => {
  const route = source("src/app/api/applications/[id]/quality-check/route.ts");
  assert.match(route, /requireRole\(\["founder"\]\)/);
  assert.match(route, /\.eq\("founder_profile_id", profile\.id\)/);
});

test("application checks persist server-side without a public write policy", () => {
  const route = source("src/app/api/applications/[id]/quality-check/route.ts");
  const migration = source("supabase/migrations/202608020001_application_quality_and_sponsorship.sql");
  assert.match(route, /createServiceClient/);
  assert.match(route, /application_quality_checks/);
  assert.doesNotMatch(migration, /founders insert own quality checks/i);
  assert.doesNotMatch(migration, /using\s*\(true\)/i);
});

test("founder primary navigation contains exactly the four pilot features", () => {
  const shell = source("src/components/layout/AppShell.tsx");
  const founderBlock = shell.match(/const founderNav:[\s\S]*?\n\];/)?.[0] ?? "";
  const labels = [...founderBlock.matchAll(/label:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, ["Idea Workspace", "Opportunities", "VC Readiness Report", "Messages"]);
});

test("advertising remains absent from pilot founder surfaces and blocked at middleware", () => {
  const founderSurfaces = [
    "src/app/(platform)/dashboard/page.tsx",
    "src/app/(platform)/opportunities/page.tsx",
    "src/app/(platform)/opportunities/[id]/page.tsx",
    "src/app/(platform)/idea-workspace/page.tsx",
    "src/components/product/VcReadinessReportClient.tsx"
  ];
  founderSurfaces.forEach((path) => assert.doesNotMatch(source(path), /SponsoredCard|getSponsoredCreatives/));
  assert.match(source("src/lib/pilot/config.ts"), /"\/api\/ads"/);
});

test("hackathon registrations remain separate from incubation quality checks", () => {
  const panel = source("src/components/opportunities/OpportunityApplicationPanel.tsx");
  const internalRoute = source("src/app/api/opportunities/[id]/register/route.ts");
  const qualityRoute = source("src/app/api/applications/[id]/quality-check/route.ts");
  assert.match(panel, /internal_registration/);
  assert.match(panel, /\/register/);
  assert.match(panel, /\/apply/);
  assert.doesNotMatch(internalRoute, /quality-check|generateSemantic|idea_workspace_id/);
  assert.match(qualityRoute, /requireRole\(\["founder"\]\)/);
});
