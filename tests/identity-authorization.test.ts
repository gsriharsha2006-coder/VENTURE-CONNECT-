import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  canInitiateInstitutionConversation,
  membershipGrantsAccess,
  profileOwnsRecord,
  resolveProfileByAuthUserId,
  reviewerCanAccessApplication
} from "../src/lib/auth/identity";

test("Auth user IDs and profile IDs may differ while resolving through profiles.user_id", async () => {
  const authUserId = "11111111-1111-4111-8111-111111111111";
  const profileId = "22222222-2222-4222-8222-222222222222";
  let queriedColumn = "";

  const profile = await resolveProfileByAuthUserId(authUserId, async (column, value) => {
    queriedColumn = column;
    assert.equal(value, authUserId);
    return { id: profileId, user_id: authUserId, role: "founder" };
  });

  assert.equal(queriedColumn, "user_id");
  assert.equal(profile?.id, profileId);
  assert.notEqual(profile?.id, authUserId);
});

test("a profile resolved for a different Auth user is rejected", async () => {
  await assert.rejects(
    resolveProfileByAuthUserId("auth-user-a", async () => ({
      id: "profile-b",
      user_id: "auth-user-b",
      role: "founder"
    })),
    /does not belong to the authenticated user/
  );
});

test("profile ownership does not grant access to another profile record", () => {
  assert.equal(profileOwnsRecord("profile-a", "profile-a"), true);
  assert.equal(profileOwnsRecord("profile-a", "profile-b"), false);
});

test("organisation membership is scoped to the matching active organisation", () => {
  const membership = {
    organisation_id: "org-a",
    profile_id: "profile-a",
    membership_role: "reviewer" as const,
    status: "active" as const
  };
  assert.equal(membershipGrantsAccess("profile-a", "org-a", membership, ["reviewer"]), true);
  assert.equal(membershipGrantsAccess("profile-a", "org-b", membership, ["reviewer"]), false);
});

test("reviewers cannot access applications without a matching active assignment", () => {
  const assignment = {
    reviewer_profile_id: "reviewer-a",
    application_id: "application-a",
    status: "active" as const
  };
  assert.equal(reviewerCanAccessApplication("reviewer-a", assignment, "application-a"), true);
  assert.equal(reviewerCanAccessApplication("reviewer-a", assignment, "application-b"), false);
  assert.equal(reviewerCanAccessApplication("reviewer-b", assignment, "application-a"), false);
});

test("founders cannot manually initiate institution conversations", () => {
  assert.equal(canInitiateInstitutionConversation("founder", "interested", true), false);
  assert.equal(canInitiateInstitutionConversation("investor", "submitted", true), false);
  assert.equal(canInitiateInstitutionConversation("incubator", "interested", false), false);
  assert.equal(canInitiateInstitutionConversation("incubator", "interested", true), true);
});

test("affected server routes use centralized profile resolution", () => {
  const root = process.cwd();
  const routeFiles = [
    "src/app/api/conversations/route.ts",
    "src/app/api/conversations/[id]/messages/route.ts",
    "src/app/api/conversations/[id]/meetings/route.ts",
    "src/app/api/conversations/[id]/upload/route.ts",
    "src/app/api/submissions/[id]/action/route.ts",
    "src/app/api/subscription/status/route.ts",
    "src/app/api/subscriptions/create/route.ts",
    "src/app/api/reports/generate/route.ts"
  ];
  for (const file of routeFiles) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(source, /require(Profile|Role)\(/, `${file} must use a centralized authorization helper`);
    assert.doesNotMatch(
      source,
      /\.from\("profiles"\)[\s\S]{0,180}\.eq\("id",\s*(?:user\.id|authUserId)\)/,
      `${file} must not compare an Auth user ID to profiles.id`
    );
  }
});

test("new browser writes populate profile-domain ownership columns", () => {
  const root = process.cwd();
  const applications = fs.readFileSync(path.join(root, "src/lib/data/applications.ts"), "utf8");
  const opportunities = fs.readFileSync(path.join(root, "src/lib/data/opportunities.ts"), "utf8");
  assert.match(applications, /founder_profile_id:\s*profile\.id/);
  assert.match(opportunities, /created_by_profile_id:\s*profile\.id/);
});
