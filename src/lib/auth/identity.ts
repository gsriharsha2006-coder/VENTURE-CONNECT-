export type IdentityProfile = {
  id: string;
  user_id: string;
  role: string;
};

export type OrganisationMembership = {
  organisation_id: string;
  profile_id: string;
  membership_role: "owner" | "admin" | "reviewer" | "member";
  status: "invited" | "active" | "suspended" | "removed";
};

export class ProfileIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileIdentityError";
  }
}

export async function resolveProfileByAuthUserId<T extends IdentityProfile>(
  authUserId: string,
  lookup: (column: "user_id", value: string) => Promise<T | null>
): Promise<T | null> {
  if (!authUserId) throw new ProfileIdentityError("An Auth user ID is required.");
  const profile = await lookup("user_id", authUserId);
  if (profile && profile.user_id !== authUserId) {
    throw new ProfileIdentityError("Resolved profile does not belong to the authenticated user.");
  }
  return profile;
}

export function profileOwnsRecord(profileId: string, ownerProfileId: string | null | undefined) {
  return Boolean(profileId && ownerProfileId && profileId === ownerProfileId);
}

export function membershipGrantsAccess(
  profileId: string,
  organisationId: string,
  membership: OrganisationMembership | null | undefined,
  allowedRoles: OrganisationMembership["membership_role"][] = ["owner", "admin", "reviewer", "member"]
) {
  return Boolean(
    membership &&
    membership.profile_id === profileId &&
    membership.organisation_id === organisationId &&
    membership.status === "active" &&
    allowedRoles.includes(membership.membership_role)
  );
}

export function reviewerCanAccessApplication(
  reviewerProfileId: string,
  assignment: {
    reviewer_profile_id: string;
    application_id: string;
    status: "active" | "completed" | "revoked";
  } | null | undefined,
  applicationId: string
) {
  return Boolean(
    assignment &&
    assignment.reviewer_profile_id === reviewerProfileId &&
    assignment.application_id === applicationId &&
    assignment.status !== "revoked"
  );
}

export function canInitiateInstitutionConversation(
  role: string,
  applicationStatus: string,
  authorisedForApplication: boolean
) {
  const normalisedRole = role.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (
    ["incubator", "admin"].includes(normalisedRole) &&
    ["interested", "request_information"].includes(applicationStatus.trim().toLowerCase()) &&
    authorisedForApplication
  );
}
