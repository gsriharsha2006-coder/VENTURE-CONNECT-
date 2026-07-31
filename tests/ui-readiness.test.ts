import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isDemoDataEnabled } from "../src/lib/demo-data";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public routes render independently of Supabase server authentication", () => {
  const publicSources = [
    source("src/components/landing/LandingPage.tsx"),
    source("src/app/pricing/page.tsx"),
    source("src/app/validators/page.tsx"),
    source("src/app/auth/page.tsx"),
    source("src/app/auth/register/page.tsx"),
    source("src/app/auth/recover/page.tsx")
  ];

  publicSources.forEach((value) => {
    assert.doesNotMatch(value, /@\/lib\/supabase\/server/);
    assert.doesNotMatch(value, /requireRole\(/);
  });
});

test("protected routes use authenticated profile resolution and a controlled redirect", () => {
  const layout = source("src/app/(platform)/layout.tsx");
  assert.match(layout, /resolveAuthenticatedProfile/);
  assert.match(layout, /redirect\("\/auth\?reason=configuration"\)/);
  assert.match(layout, /redirect\("\/auth\?reason=session-required"\)/);
});

test("demo data remains disabled unless explicitly enabled", () => {
  assert.equal(isDemoDataEnabled(undefined), false);
  assert.equal(isDemoDataEnabled("false"), false);
  assert.equal(isDemoDataEnabled("true"), true);

  const guardedSources = [
    source("src/lib/data/applications.ts"),
    source("src/lib/data/ideaWorkspaces.ts"),
    source("src/lib/data/messages.ts"),
    source("src/lib/data/opportunities.ts"),
    source("src/app/api/feed/route.ts"),
    source("src/app/api/startups/route.ts")
  ];
  guardedSources.forEach((value) => assert.match(value, /isDemoDataEnabled/));
});

test("authentication has no prototype bypass and unavailable submissions are disabled", () => {
  const signIn = source("src/app/auth/page.tsx");
  const register = source("src/app/auth/register/page.tsx");
  assert.doesNotMatch(signIn, /prototype.*bypass|demo.*login/i);
  assert.doesNotMatch(register, /prototype.*account|fake.*success/i);
  assert.match(signIn, /disabled=\{submitting \|\| !supabaseReady\}/);
  assert.match(register, /disabled=\{submitting \|\| !supabaseReady\}/);
});

test("role navigation is derived from account role and mobile controls are labelled", () => {
  const shell = source("src/components/layout/AppShell.tsx");
  assert.match(shell, /toDatabaseRole\(role\)/);
  assert.match(shell, /aria-label="Open navigation"/);
  assert.match(shell, /aria-label="Close navigation"/);
  assert.match(shell, /focus\(\)/);
});

test("critical layouts include constrained responsive behavior", () => {
  const landing = source("src/components/landing/LandingPage.tsx");
  const registration = source("src/app/auth/register/page.tsx");
  const dashboard = source("src/app/(platform)/dashboard/page.tsx");
  assert.match(landing, /sm:|md:|lg:|xl:/);
  assert.match(registration, /sm:|md:|lg:|xl:/);
  assert.match(dashboard, /sm:|md:|lg:|xl:/);
  assert.doesNotMatch(`${landing}\n${registration}\n${dashboard}`, /w-screen/);
});

test("unavailable paid actions are visibly disabled and explained", () => {
  const pricing = source("src/components/subscription/PricingCheckout.tsx");
  assert.match(pricing, /disabled/);
  assert.match(pricing, /Paid checkout is unavailable/i);
});

test("public validator directory does not invent verified statistics", () => {
  const directory = source("src/app/validators/page.tsx");
  assert.match(directory, /No approved validators are currently available/);
  assert.doesNotMatch(directory, /\d+(?:,\d+)*\+?\s+(?:verified validators|completed validations)/i);
});
