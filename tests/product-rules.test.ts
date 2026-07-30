import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { dashboardForRole, toDatabaseRole, toUserRole } from "../src/lib/auth/roles";
import { canSendMessage } from "../src/lib/messaging/permissions";
import {
  applicationMethodUsesWorkspace,
  defaultApplicationMethodForType,
  validateExternalRegistrationUrl
} from "../src/lib/opportunities/application-methods";
import { verifyPaymentSignature, verifyWebhookSignature } from "../src/lib/razorpay/client";
import { canGenerateReport, computeEntitlements } from "../src/lib/subscription/plans";
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

test("role mapping sends each supported role to its protected dashboard", () => {
  assert.equal(toDatabaseRole("Hackathon Organizer"), "hackathon_organizer");
  assert.equal(toUserRole("validator"), "Validator");
  assert.equal(dashboardForRole("Founder"), "/dashboard");
  assert.equal(dashboardForRole("Validator"), "/validator/dashboard");
  assert.equal(dashboardForRole("Admin"), "/admin");
  assert.equal(dashboardForRole("Incubator"), "/investor/discover");
});

test("plan limits remain finite and report access follows entitlement", () => {
  const free = profile();
  const pro = profile({ plan: "Student Pro", reports_used_this_month: 2 });

  assert.equal(computeEntitlements(free).workspacesLimit, 1);
  assert.equal(computeEntitlements(pro).workspacesLimit, 10);
  assert.equal(computeEntitlements(pro).reportsRemaining, 1);
  assert.equal(canGenerateReport(free, "Premium SWOT Analysis").allowed, false);
  assert.equal(canGenerateReport(pro, "Premium SWOT Analysis").allowed, true);
});

test("hackathons default to organiser-managed registration and reject private destinations", () => {
  assert.equal(defaultApplicationMethodForType("Hackathon"), "external_registration");
  assert.equal(applicationMethodUsesWorkspace("external_registration"), false);
  assert.equal(validateExternalRegistrationUrl("http://localhost/register").valid, false);

  const result = validateExternalRegistrationUrl("https://example.org/apply#form");
  assert.deepEqual(result, {
    valid: true,
    url: "https://example.org/apply",
    domain: "example.org"
  });
});

test("only the matching investor or founder participant can send in an interest-created conversation", () => {
  const conversation = { founder_id: "founder-1", investor_id: "investor-1" };
  assert.equal(canSendMessage(profile({ id: "founder-1" }), conversation, "founder-1"), true);
  assert.equal(
    canSendMessage(profile({ id: "investor-1", role: "Investor" }), conversation, "investor-1"),
    true
  );
  assert.equal(canSendMessage(profile({ id: "other-founder" }), conversation, "other-founder"), false);
});

test("Razorpay payment and webhook signatures are verified server-side", () => {
  const previousSecret = process.env.RAZORPAY_KEY_SECRET;
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const paymentSecret = "test-payment-secret";
  const webhookSecret = "test-webhook-secret";
  process.env.RAZORPAY_KEY_SECRET = paymentSecret;
  process.env.RAZORPAY_KEY_ID = "test-key";
  process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

  try {
    const paymentSignature = crypto
      .createHmac("sha256", paymentSecret)
      .update("order-1|payment-1")
      .digest("hex");
    const body = JSON.stringify({ event: "payment.captured" });
    const webhookSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    assert.equal(verifyPaymentSignature("order-1", "payment-1", paymentSignature), true);
    assert.equal(verifyPaymentSignature("order-1", "payment-1", "invalid"), false);
    assert.equal(verifyWebhookSignature(body, webhookSignature), true);
    assert.equal(verifyWebhookSignature(`${body}x`, webhookSignature), false);
  } finally {
    restoreEnvironment("RAZORPAY_KEY_SECRET", previousSecret);
    restoreEnvironment("RAZORPAY_KEY_ID", previousKeyId);
    restoreEnvironment("RAZORPAY_WEBHOOK_SECRET", previousWebhookSecret);
  }
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
