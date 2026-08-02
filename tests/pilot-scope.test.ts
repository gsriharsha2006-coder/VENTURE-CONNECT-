import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getTemplateDef, WORKSPACE_TEMPLATES } from "../src/lib/templates";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("the pilot exposes one Startup Template with the required thirteen sections", () => {
  const expected = [
    "Basic Information", "Problem", "Solution", "Target Customer", "Existing Alternatives",
    "Product Description", "Business Model", "Customer Validation", "Current Progress or Traction",
    "Team", "Funding Requirement", "Use of Funds", "Risks and Assumptions"
  ];
  assert.equal(WORKSPACE_TEMPLATES.length, 1);
  assert.equal(getTemplateDef("startup").label, "Startup Template");
  assert.deepEqual(getTemplateDef("startup").sections.map((section) => section.label), expected);
});

test("the live report API permits only the single basic pilot report", () => {
  const route = source("src/app/api/reports/generate/route.ts");
  assert.match(route, /reportType !== "Basic SWOT Report"/);
  assert.match(route, /template !== "startup"/);
  assert.match(source("src/components/product/VcReadinessReportClient.tsx"), /One basic readiness report for the pilot/);
});

test("quality checks are capped at initial check plus one recheck in API and database", () => {
  const route = source("src/app/api/applications/[id]/quality-check/route.ts");
  assert.match(route, /MAX_APPLICATION_CHECKS = 2/);
  assert.match(route, /applicationChecks.*>= MAX_APPLICATION_CHECKS/);
  assert.match(source("supabase/migrations/202608020002_pace_pilot_release.sql"), /one initial quality check and one recheck/i);
});

test("pilot analytics store event names and metadata, not private workspace answers", () => {
  const migration = source("supabase/migrations/202608020002_pace_pilot_release.sql");
  assert.match(migration, /create table if not exists public\.pilot_events/);
  assert.match(migration, /must not contain private startup answers/i);
  assert.doesNotMatch(source("src/app/api/pilot/events/route.ts"), /sections|answers|document_content/);
});
