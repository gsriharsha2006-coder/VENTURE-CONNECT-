import assert from "node:assert/strict";
import test from "node:test";

import { isDemoDataEnabled } from "../src/lib/demo-data";
import { demoValidators, getValidatorDirectory } from "../src/lib/data/validations";
import {
  getValidatorTrustPresentation,
  PUBLIC_VALIDATOR_EMPTY_STATE
} from "../src/lib/validation/trust";
import type { ValidatorProfile } from "../src/lib/validation/types";

test("demo validator data is unavailable unless explicitly enabled", () => {
  assert.equal(isDemoDataEnabled("false"), false);
  assert.equal(isDemoDataEnabled(undefined), false);
  assert.deepEqual(getValidatorDirectory(false), []);
  assert.equal(getValidatorDirectory(true).length, demoValidators.length);
});

test("every demo validator is labelled and cannot be presented as verified", () => {
  assert.ok(demoValidators.length > 0);
  demoValidators.forEach((validator) => {
    const presentation = getValidatorTrustPresentation(validator);
    assert.equal(validator.isDemo, true);
    assert.equal(validator.isVerified, false);
    assert.equal(presentation.profileBadge, "Demo profile");
    assert.equal(presentation.showVerifiedBadge, false);
    assert.equal(presentation.showVerifiedStatistics, false);
  });
});

test("demo reviews and bookings use sample labels", () => {
  const presentation = getValidatorTrustPresentation(demoValidators[0]);
  assert.equal(presentation.reviewHeading, "Sample reviews");
  assert.equal(presentation.reviewBadge, "Sample booking");
  assert.notEqual(presentation.reviewHeading, "Verified founder reviews");
  assert.notEqual(presentation.reviewBadge, "Verified booking");
});

test("demo validators do not expose unsupported institutional affiliations", () => {
  demoValidators.forEach((validator) => {
    const presentation = getValidatorTrustPresentation(validator);
    assert.equal(validator.organisationAffiliation, undefined);
    assert.equal(validator.affiliationVerified, false);
    assert.equal(presentation.showOrganisationAffiliation, false);
  });
});

test("public validator lookup has a professional empty-state contract", () => {
  assert.equal(PUBLIC_VALIDATOR_EMPTY_STATE.title, "No verified validator profile is currently available.");
  assert.match(PUBLIC_VALIDATOR_EMPTY_STATE.description, /administrator approval/i);
});

test("verified statistics render only with complete verified evidence", () => {
  const base = demoValidators[0];
  const incomplete: ValidatorProfile = {
    ...base,
    isDemo: false,
    isVerified: true,
    verified: true,
    completedValidations: 3,
    averageRating: 4.8,
    reviewCount: 0
  };
  assert.equal(getValidatorTrustPresentation(incomplete).showVerifiedStatistics, false);

  const verified: ValidatorProfile = {
    ...incomplete,
    reviewCount: 3,
    organisationAffiliation: "Administrator-approved organisation",
    affiliationVerified: true
  };
  const presentation = getValidatorTrustPresentation(verified);
  assert.equal(presentation.showVerifiedBadge, true);
  assert.equal(presentation.showVerifiedStatistics, true);
  assert.equal(presentation.showOrganisationAffiliation, true);
});
