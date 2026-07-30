import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const baseline = fs.readFileSync(path.join(root, "supabase", "schema.sql"), "utf8");
const migrationDirectory = path.join(root, "supabase", "migrations");
const migrationFiles = fs.readdirSync(migrationDirectory)
  .filter((name) => name.endsWith(".sql"))
  .sort();
const activeSql = [
  baseline,
  ...migrationFiles.map((name) => fs.readFileSync(path.join(migrationDirectory, name), "utf8"))
].join("\n");

function createsTable(table: string) {
  return new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\b`, "i").test(activeSql);
}

function enablesRls(table: string) {
  return new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i").test(activeSql);
}

test("active Supabase setup path is ordered and excludes historical snapshots", () => {
  assert.deepEqual(migrationFiles, [
    "202607130001_gemini_vc_report_persistence.sql",
    "202607130002_openai_vc_report_provider.sql",
    "202607280001_validation_hub.sql",
    "202607280002_opportunity_application_methods.sql"
  ]);
  assert.ok(!migrationFiles.includes("schema-final.sql"));
  assert.ok(!migrationFiles.includes("schema-v2.sql"));
});

test("all tables created by the active setup path explicitly enable RLS", () => {
  const createdTables = [...activeSql.matchAll(/create\s+table\s+if\s+not\s+exists\s+public\.([a-z0-9_]+)/gi)]
    .map((match) => match[1]);
  const missingRls = [...new Set(createdTables)].filter((table) => !enablesRls(table));
  assert.deepEqual(missingRls, []);
});

test("staging schema gaps remain explicit until migrations implement them", () => {
  const requiredCapabilities: Record<string, string[]> = {
    profiles: ["profiles"],
    userRoles: ["user_roles"],
    founderWorkspaces: ["idea_workspaces"],
    organisations: ["organisations", "organisation_memberships"],
    opportunities: ["opportunities"],
    opportunityForms: ["opportunity_forms"],
    applications: ["applications"],
    applicationReviews: ["application_reviews", "reviewer_assignments"],
    conversations: ["conversations"],
    messages: ["messages"],
    validators: ["validator_profiles"],
    validationRequests: ["validation_bookings"],
    validationReports: ["validation_reports"],
    readinessReports: ["vc_reports", "vc_report_generation_requests"],
    subscriptions: ["subscriptions"],
    payments: ["payments", "payment_events"],
    notifications: ["notifications"],
    auditLogs: ["audit_logs"]
  };

  const missingCapabilities = Object.entries(requiredCapabilities)
    .filter(([, tables]) => tables.some((table) => !createsTable(table)))
    .map(([capability]) => capability);

  assert.deepEqual(missingCapabilities, [
    "userRoles",
    "organisations",
    "opportunityForms",
    "applicationReviews",
    "conversations",
    "payments",
    "auditLogs"
  ]);
});

test("critical security and idempotency guards are present in active SQL", () => {
  assert.match(activeSql, /profiles_prevent_privilege_escalation/i);
  assert.match(activeSql, /applications_founder_opportunity_unique_idx/i);
  assert.match(activeSql, /vc_report_generation_requests[\s\S]+unique\s*\(founder_id,\s*request_id\)/i);
  assert.match(activeSql, /validator_reviews_completed_booking/i);
  assert.match(activeSql, /validation_badges_require_report/i);
});

test("read-only live staging contract covers database and private storage", () => {
  const contract = fs.readFileSync(
    path.join(root, "supabase", "tests", "staging_contract.sql"),
    "utf8"
  );
  assert.match(contract, /Missing required staging table/i);
  assert.match(contract, /RLS is disabled/i);
  assert.match(contract, /messaging-attachments/i);
  assert.match(contract, /public\s*=\s*false/i);
});
