import type { ValidatorProfile } from "@/lib/validation/types";

export const PUBLIC_VALIDATOR_EMPTY_STATE = {
  title: "No verified validator profile is currently available.",
  description: "Verified public profiles will appear after administrator approval."
} as const;

export type ValidatorTrustPresentation = {
  profileBadge: "Demo profile" | "Verified validator" | null;
  showVerifiedBadge: boolean;
  showVerifiedStatistics: boolean;
  showOrganisationAffiliation: boolean;
  reviewHeading: "Sample reviews" | "Founder reviews";
  reviewBadge: "Sample booking" | "Verified booking";
};

export function getValidatorTrustPresentation(
  validator: ValidatorProfile
): ValidatorTrustPresentation {
  const showVerifiedBadge = validator.isVerified && !validator.isDemo;
  const showVerifiedStatistics =
    showVerifiedBadge &&
    validator.completedValidations > 0 &&
    typeof validator.averageRating === "number" &&
    validator.reviewCount > 0;

  return {
    profileBadge: validator.isDemo
      ? "Demo profile"
      : showVerifiedBadge
        ? "Verified validator"
        : null,
    showVerifiedBadge,
    showVerifiedStatistics,
    showOrganisationAffiliation:
      !validator.isDemo &&
      validator.affiliationVerified &&
      Boolean(validator.organisationAffiliation?.trim()),
    reviewHeading: validator.isDemo ? "Sample reviews" : "Founder reviews",
    reviewBadge: validator.isDemo ? "Sample booking" : "Verified booking"
  };
}
