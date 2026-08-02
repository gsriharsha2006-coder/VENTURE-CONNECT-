import assert from "node:assert/strict";
import test from "node:test";

import { dashboardForRole, toDatabaseRole } from "../src/lib/auth/roles";
import { canInitiateInstitutionConversation } from "../src/lib/auth/identity";
import { canSendMessage } from "../src/lib/messaging/permissions";
import {
  applicationMethodUsesWorkspace,
  defaultApplicationMethodForType,
  validateExternalRegistrationUrl
} from "../src/lib/opportunities/application-methods";
import { isPilotApiDisabled, isPilotPageDisabled, isPilotOpportunityType } from "../src/lib/pilot/config";
import type { Profile } from "../src/lib/types";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile-1",
    full_name: "Test Founder",
    email: "founder@example.test",
    role: "Founder",
    plan: "Free",
    free_report_used: false,
    reports_used_this_month: 0,
    ...overrides
  };
}

test("pilot roles map to the founder, organisation, and admin workspaces", () => {
  assert.equal(toDatabaseRole("Hackathon Organizer"), "hackathon_organizer");
  assert.equal(dashboardForRole("Founder"), "/dashboard");
  assert.equal(dashboardForRole("Incubator"), "/organisation");
  assert.equal(dashboardForRole("Hackathon Organizer"), "/organisation");
  assert.equal(dashboardForRole("Admin"), "/admin");
  assert.equal(dashboardForRole("Investor"), "/pilot-access-unavailable");
  assert.equal(dashboardForRole("Validator"), "/pilot-access-unavailable");
});

test("only incubation programmes and hackathons are discoverable in the pilot", () => {
  assert.equal(isPilotOpportunityType("Incubator program"), true);
  assert.equal(isPilotOpportunityType("Hackathon"), true);
  assert.equal(isPilotOpportunityType("Investor Opportunity"), false);
  assert.equal(isPilotOpportunityType("Event"), false);
});

test("legacy marketplaces, advertising, payments, and investor routes are disabled", () => {
  ["/investor", "/pricing", "/services", "/validators", "/dashboard/validation-hub"].forEach((path) => {
    assert.equal(isPilotPageDisabled(path), true);
  });
  ["/api/ads", "/api/subscriptions/checkout", "/api/webhooks/razorpay", "/api/validations"].forEach((path) => {
    assert.equal(isPilotApiDisabled(path), true);
  });
});

test("hackathons use organiser registration while incubation uses Idea Workspace", () => {
  assert.equal(defaultApplicationMethodForType("Hackathon"), "external_registration");
  assert.equal(defaultApplicationMethodForType("Incubator program"), "idea_workspace_application");
  assert.equal(applicationMethodUsesWorkspace("external_registration"), false);
  assert.equal(applicationMethodUsesWorkspace("idea_workspace_application"), true);
  assert.equal(validateExternalRegistrationUrl("http://localhost/register").valid, false);

  const result = validateExternalRegistrationUrl("https://example.org/apply#form");
  assert.deepEqual(result, { valid: true, url: "https://example.org/apply", domain: "example.org" });
});

test("incubator messaging opens only after an authorised Interested or Information Request action", () => {
  assert.equal(canInitiateInstitutionConversation("incubator", "interested", true), true);
  assert.equal(canInitiateInstitutionConversation("incubator", "request_information", true), true);
  assert.equal(canInitiateInstitutionConversation("incubator", "under_review", true), false);
  assert.equal(canInitiateInstitutionConversation("hackathon_organizer", "interested", true), false);
  assert.equal(canInitiateInstitutionConversation("incubator", "interested", false), false);

  const conversation = { founder_id: "founder-1", organisation_id: "incubator-1" };
  assert.equal(canSendMessage(profile({ id: "founder-1" }), conversation, "founder-1"), true);
  assert.equal(canSendMessage(profile({ id: "incubator-1", role: "Incubator" }), conversation, "incubator-1"), true);
  assert.equal(canSendMessage(profile({ id: "other-founder" }), conversation, "other-founder"), false);
});
