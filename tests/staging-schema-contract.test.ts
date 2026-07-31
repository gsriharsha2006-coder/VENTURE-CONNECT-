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
const remediationSql = fs.readFileSync(
  path.join(migrationDirectory, "202607300001_database_contract_and_identity.sql"),
  "utf8"
);

function createsTable(table: string) {
  return new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\b`, "i").test(activeSql);
}

function enablesRls(table: string) {
  return new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i").test(activeSql);
}

function declaresColumn(table: string, column: string) {
  const createPattern = new RegExp(
    `create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\s*\\([\\s\\S]*?\\b${column}\\b`,
    "i"
  );
  const alterPattern = new RegExp(
    `alter\\s+table\\s+public\\.${table}[\\s\\S]*?add\\s+column\\s+if\\s+not\\s+exists\\s+${column}\\b`,
    "i"
  );
  return createPattern.test(activeSql) || alterPattern.test(activeSql);
}

test("active Supabase setup path is chronological and excludes historical snapshots", () => {
  assert.deepEqual(migrationFiles, [
    "202607130001_gemini_vc_report_persistence.sql",
    "202607130002_openai_vc_report_provider.sql",
    "202607280001_validation_hub.sql",
    "202607280002_opportunity_application_methods.sql",
    "202607300001_database_contract_and_identity.sql"
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

test("required production data capabilities are present in the migration chain", () => {
  const requiredTables = [
    "profiles",
    "idea_workspaces",
    "organisations",
    "organisation_members",
    "opportunities",
    "opportunity_forms",
    "opportunity_form_sections",
    "opportunity_form_fields",
    "applications",
    "application_answers",
    "reviewer_assignments",
    "application_reviews",
    "review_scores",
    "conversations",
    "conversation_members",
    "messages",
    "message_attachments",
    "meetings",
    "validator_profiles",
    "validation_bookings",
    "validation_reports",
    "vc_reports",
    "subscriptions",
    "payments",
    "payment_events",
    "notifications",
    "audit_logs"
  ];
  assert.deepEqual(requiredTables.filter((table) => !createsTable(table)), []);
});

test("canonical profile identity columns are explicit and backfilled", () => {
  assert.match(activeSql, /profiles[\s\S]+user_id\s+uuid\s+not\s+null\s+unique\s+references\s+auth\.users/i);
  assert.match(remediationSql, /create\s+or\s+replace\s+function\s+public\.current_profile_id\(\)/i);
  assert.ok(declaresColumn("opportunities", "created_by_profile_id"));
  assert.ok(declaresColumn("applications", "founder_profile_id"));
  assert.ok(declaresColumn("messages", "sender_profile_id"));
  assert.match(remediationSql, /update\s+public\.applications[\s\S]+founder_profile_id\s*=\s*p\.id/i);
  assert.match(remediationSql, /where\s+user_id\s*=\s*auth\.uid\(\)/i);
});

test("new tables include keys, constraints, indexes, and timestamp triggers", () => {
  const newTables = [
    "organisations",
    "organisation_members",
    "opportunity_forms",
    "opportunity_form_sections",
    "opportunity_form_fields",
    "application_answers",
    "reviewer_assignments",
    "application_reviews",
    "review_scores",
    "conversations",
    "conversation_members",
    "message_attachments",
    "meetings",
    "payments",
    "payment_events",
    "audit_logs"
  ];
  for (const table of newTables) {
    const declaration = remediationSql.match(
      new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`, "i")
    )?.[1];
    assert.ok(declaration, `Missing CREATE TABLE body for ${table}`);
    assert.match(declaration, /\bid\s+uuid\s+primary\s+key\b/i, `${table} must have a UUID primary key`);
    assert.match(declaration, /\bcreated_at\s+timestamptz\s+not\s+null\b/i, `${table} must have created_at`);
  }

  assert.match(remediationSql, /organisation_members[\s\S]+unique\s*\(organisation_id,\s*profile_id\)/i);
  assert.match(remediationSql, /opportunity_forms_one_active_idx/i);
  assert.match(remediationSql, /reviewer_assignments_one_active_idx/i);
  assert.match(remediationSql, /conversations_exactly_one_context/i);
  assert.match(remediationSql, /payments_provider_payment_unique_idx/i);
  assert.match(remediationSql, /unique\s*\(provider,\s*provider_event_id\)/i);
  assert.match(remediationSql, /payload_hash\s+text\s+not\s+null/i);
  assert.match(remediationSql, /message_attachments_validate_message/i);
  assert.match(remediationSql, /message_attachments_private_bucket/i);
  assert.match(remediationSql, /message_attachments_scoped_path/i);
  assert.match(remediationSql, /messages_prevent_reassignment/i);
  assert.match(remediationSql, /conversation_members_protect_scope/i);
  assert.match(
    remediationSql,
    /opportunity_form_sections_prevent_published_change[\s\S]+before insert or update or delete/i
  );
  assert.match(
    remediationSql,
    /opportunity_form_fields_prevent_published_change[\s\S]+before insert or update or delete/i
  );
  assert.match(remediationSql, /payments_set_updated_at/i);
});

test("domain foreign keys use explicit profile and parent relationships", () => {
  const requiredForeignKeys = [
    /organisations[\s\S]+created_by_profile_id\s+uuid\s+not\s+null\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+restrict/i,
    /organisation_members[\s\S]+organisation_id\s+uuid\s+not\s+null\s+references\s+public\.organisations\(id\)\s+on\s+delete\s+cascade/i,
    /reviewer_assignments[\s\S]+reviewer_profile_id\s+uuid\s+not\s+null\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+restrict/i,
    /conversations[\s\S]+application_id\s+uuid\s+references\s+public\.applications\(id\)\s+on\s+delete\s+restrict/i,
    /conversation_members[\s\S]+profile_id\s+uuid\s+not\s+null\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+cascade/i,
    /message_attachments[\s\S]+message_id\s+uuid\s+not\s+null\s+references\s+public\.messages\(id\)\s+on\s+delete\s+cascade/i,
    /payments[\s\S]+profile_id\s+uuid\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+set\s+null/i,
    /payment_events[\s\S]+payment_id\s+uuid\s+references\s+public\.payments\(id\)\s+on\s+delete\s+set\s+null/i,
    /audit_logs[\s\S]+acting_auth_user_id\s+uuid\s+references\s+auth\.users\(id\)\s+on\s+delete\s+set\s+null/i
  ];
  for (const foreignKey of requiredForeignKeys) assert.match(remediationSql, foreignKey);
});

test("RLS encodes organisation, reviewer, conversation, and server-only boundaries", () => {
  assert.match(remediationSql, /assigned reviewers read applications/i);
  assert.match(remediationSql, /organisation admins manage reviewer assignments/i);
  assert.match(remediationSql, /authorised partners create gated conversations/i);
  assert.match(remediationSql, /conversation participants read messages/i);
  assert.match(remediationSql, /conversation participants send messages/i);
  assert.match(remediationSql, /Payment, payment event, and audit tables intentionally have no authenticated/i);
  assert.doesNotMatch(remediationSql, /using\s*\(\s*true\s*\)/i);
  for (const table of ["payments", "payment_events", "audit_logs"]) {
    assert.doesNotMatch(
      remediationSql,
      new RegExp(`create\\s+policy\\s+"[^"]+"\\s+on\\s+public\\.${table}\\s+for`, "i")
    );
  }
});

test("existing security and report idempotency guards remain present", () => {
  assert.match(activeSql, /profiles_prevent_privilege_escalation/i);
  assert.match(activeSql, /applications_founder_opportunity_unique_idx/i);
  assert.match(activeSql, /vc_report_generation_requests[\s\S]+unique\s*\(founder_id,\s*request_id\)/i);
  assert.match(activeSql, /validator_reviews_completed_booking/i);
  assert.match(activeSql, /validation_badges_require_report/i);
});

test("live staging contract is clearly separate and covers private storage", () => {
  const contract = fs.readFileSync(
    path.join(root, "supabase", "tests", "staging_contract.sql"),
    "utf8"
  );
  assert.match(contract, /live staging schema contract/i);
  assert.match(contract, /offline TypeScript contract does not prove these live RLS checks/i);
  assert.match(contract, /Missing required staging column/i);
  assert.match(contract, /Server-controlled payment or audit table exposes/i);
  assert.match(contract, /messaging-attachments/i);
  assert.match(contract, /public\s*=\s*false/i);
});
