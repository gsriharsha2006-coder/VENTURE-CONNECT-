import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runDeterministicQualityCheck, runRuleBasedValidation } from "../src/lib/application-quality/engine";
import { isSemanticQualityResult } from "../src/lib/application-quality/schema";
import type { ApplicationDraft } from "../src/lib/application-quality/types";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function draft(overrides: Partial<ApplicationDraft> = {}): ApplicationDraft {
  return {
    applicationId: "application-1",
    opportunityId: "opportunity-1",
    sector: "SaaS",
    startupStage: "MVP",
    geography: "India",
    college: "Example Institute",
    fundingRequirement: 500000,
    requiredFields: ["problem", "solution", "useOfFunds"],
    answers: {
      problem: "Small teams lose time coordinating fragmented customer support workflows.",
      solution: "A shared support workspace organises requests and assigns clear ownership.",
      useOfFunds: "Fund product reliability, customer onboarding, and measured pilot delivery.",
      website: "https://example.test"
    },
    ...overrides
  };
}

test("eligibility mismatches are deterministic and skip semantic review", () => {
  const result = runDeterministicQualityCheck(draft({ sector: "Consumer", fundingRequirement: 2000000 }), {
    acceptedSectors: ["SaaS"], maximumFunding: 1000000
  });
  assert.equal(result.status, "eligibility_mismatch");
  assert.equal(result.semanticReviewRequired, false);
  assert.equal(result.eligibilityMismatches.length, 2);
});

test("a date-only deadline remains open through the listed day", () => {
  const result = runDeterministicQualityCheck(draft(), { deadline: "2026-08-02" }, new Date("2026-08-02T18:00:00.000Z"));
  assert.equal(result.eligibility.deadlineOpen, true);
});

test("placeholder, duplicate, invalid URL, and missing use-of-funds answers are blocked", () => {
  const repeated = "The same generic paragraph is repeated without field-specific evidence.";
  const issues = runRuleBasedValidation(draft({
    fundingRequirement: 1000,
    answers: {
      problem: "asdf",
      solution: repeated,
      marketOpportunity: repeated,
      useOfFunds: "",
      website: "javascript:alert(1)"
    }
  }));
  const codes = new Set(issues.map((issue) => issue.code));
  assert.equal(codes.has("placeholder"), true);
  assert.equal(codes.has("duplicate_answer"), true);
  assert.equal(codes.has("invalid_url"), true);
  assert.equal(codes.has("missing_use_of_funds"), true);
});

test("semantic quality schema accepts bounded investor-grade output and rejects malformed output", () => {
  const valid = {
    qualityScore: 75, completenessScore: 20, meaningfulContentScore: 12,
    problemSolutionScore: 15, customerMarketScore: 10, businessModelScore: 7,
    validationTractionScore: 5, consistencyScore: 3, fundingClarityScore: 3,
    organisationFitScore: 80, status: "ready_to_submit", summary: "Ready for human review.",
    strengths: ["Clear problem"], issues: [], fieldFeedback: [],
    eligibility: { sectorMatch: true, stageMatch: true, geographyMatch: true, fundingRangeMatch: true, collegeMatch: true, deadlineOpen: true },
    unsupportedClaims: [], contradictoryClaims: [], manualReviewReason: null
  };
  assert.equal(isSemanticQualityResult(valid), true);
  assert.equal(isSemanticQualityResult({ ...valid, completenessScore: 25 }), false);
  assert.equal(isSemanticQualityResult({ ...valid, status: "approved_by_ai" }), false);
});

test("application checks persist server-side and submission requires the guarded RPC", () => {
  const checkRoute = source("src/app/api/applications/[id]/quality-check/route.ts");
  const submitRoute = source("src/app/api/applications/[id]/submit/route.ts");
  const migration = source("supabase/migrations/202608020001_application_quality_and_sponsorship.sql");
  assert.match(checkRoute, /runDeterministicQualityCheck/);
  assert.match(checkRoute, /generateSemanticQualityReview/);
  assert.match(checkRoute, /createServiceClient/);
  assert.match(submitRoute, /submit_ready_application/);
  assert.match(migration, /Submitted application snapshots are immutable/);
  assert.doesNotMatch(migration, /founders insert own quality checks/i);
  assert.doesNotMatch(migration, /using\s*\(true\)/i);
});

test("founder primary navigation contains exactly the five product sections", () => {
  const shell = source("src/components/layout/AppShell.tsx");
  const founderBlock = shell.match(/const founderNav:[\s\S]*?\n\];/)?.[0] ?? "";
  const labels = [...founderBlock.matchAll(/label:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(labels, ["Dashboard", "Idea Workspace", "Opportunities", "VC Readiness Report", "Messages"]);
});

test("sponsored cards are imported only by allowed founder surfaces and internal admin tooling", () => {
  const allowed = [
    "src/app/(platform)/dashboard/page.tsx",
    "src/app/(platform)/opportunities/page.tsx",
    "src/app/(platform)/opportunities/[id]/page.tsx",
    "src/app/(platform)/admin/sponsorship/page.tsx"
  ];
  allowed.forEach((path) => assert.match(source(path), /SponsoredCard|SponsorshipAdmin/));
  [
    "src/app/(platform)/dashboard/idea-workspace/page.tsx",
    "src/app/(platform)/dashboard/vc-readiness/page.tsx",
    "src/app/(platform)/dashboard/messages/page.tsx",
    "src/app/(platform)/investor/applications/page.tsx",
    "src/app/auth/page.tsx",
    "src/app/auth/register/page.tsx"
  ].forEach((path) => assert.doesNotMatch(source(path), /SponsoredCard|getSponsoredCreatives/));
});

test("event and investor application routes remain separate", () => {
  const panel = source("src/components/opportunities/OpportunityApplicationPanel.tsx");
  const internalRoute = source("src/app/api/opportunities/[id]/register/route.ts");
  const qualityRoute = source("src/app/api/applications/[id]/quality-check/route.ts");
  assert.match(panel, /internal_registration/);
  assert.match(panel, /\/register/);
  assert.match(panel, /\/apply/);
  assert.doesNotMatch(internalRoute, /quality-check|generateSemantic|idea_workspace_id/);
  assert.match(qualityRoute, /requireRole\(\["founder"\]\)/);
});
