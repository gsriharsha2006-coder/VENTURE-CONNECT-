import "server-only";

import { toDatabaseRole, type DatabaseRole } from "@/lib/auth/roles";
import {
  resolveProfileByAuthUserId,
  type IdentityProfile,
  type OrganisationMembership
} from "@/lib/auth/identity";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthenticatedProfile = IdentityProfile & {
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  plan: string;
  razorpay_customer_id?: string | null;
  [key: string]: unknown;
};

export type AuthenticatedProfileContext = {
  authUserId: string;
  profile: AuthenticatedProfile;
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;
};

export class AuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404 | 503,
    message: string
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getAuthenticatedAuthUserId() {
  const supabase = await createServerSupabase();
  if (!supabase) throw new AuthorizationError(503, "Supabase is not configured.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function resolveAuthenticatedProfile(): Promise<AuthenticatedProfileContext | null> {
  const supabase = await createServerSupabase();
  if (!supabase) throw new AuthorizationError(503, "Supabase is not configured.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const profile = await resolveProfileByAuthUserId<AuthenticatedProfile>(
    authData.user.id,
    async (column, value) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq(column, value)
        .maybeSingle();
      if (error) throw error;
      return data as AuthenticatedProfile | null;
    }
  );

  if (!profile) return null;
  return { authUserId: authData.user.id, profile, supabase };
}

export async function requireProfile(): Promise<AuthenticatedProfileContext> {
  const context = await resolveAuthenticatedProfile();
  if (!context) throw new AuthorizationError(401, "Authentication and a profile are required.");
  return context;
}

export async function requireRole(allowedRoles: readonly DatabaseRole[]) {
  const context = await requireProfile();
  const role = toDatabaseRole(context.profile.role);
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError(403, "This account role is not allowed to perform that action.");
  }
  return { ...context, role };
}

export async function requireOrganisationMembership(
  organisationId: string,
  allowedRoles: readonly OrganisationMembership["membership_role"][] = ["owner", "admin", "reviewer", "member"]
) {
  if (!organisationId) throw new AuthorizationError(404, "Organisation not found.");
  const context = await requireProfile();
  if (toDatabaseRole(context.profile.role) === "admin") {
    return { ...context, membership: null, administrator: true as const };
  }

  const { data, error } = await context.supabase
    .from("organisation_members")
    .select("organisation_id, profile_id, membership_role, status")
    .eq("organisation_id", organisationId)
    .eq("profile_id", context.profile.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  const membership = data as OrganisationMembership | null;
  if (!membership || !allowedRoles.includes(membership.membership_role)) {
    throw new AuthorizationError(403, "Active organisation membership is required.");
  }
  return { ...context, membership, administrator: false as const };
}
