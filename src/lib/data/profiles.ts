import { backendUnavailableError, getBrowserSupabase, getCurrentUserId, normalizePlan, supabaseDataError } from "@/lib/data/shared";
import { toUserRole } from "@/lib/auth/roles";
import { isDemoDataEnabled } from "@/lib/demo-data";
import type { Profile } from "@/lib/types";

export const mockCurrentProfile: Profile = {
  id: "prototype-founder",
  user_id: "prototype-founder",
  full_name: "Prototype Founder",
  company_name: "MedLens AI",
  email: "prototype@venture-connect.local",
  phone: "",
  role: "Founder",
  plan: "Free",
  trust_score: 72,
  verification_status: "Pending",
  free_report_used: false,
  reports_used_this_month: 0,
  opportunity_submissions_used: 0
};

export async function getCurrentProfile(): Promise<Profile> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("load current profile");
  if (!supabase || !userId) {
    if (isDemoDataEnabled()) return mockCurrentProfile;
    throw backendUnavailableError("Profile loading");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) throw supabaseDataError("load current profile", error ?? "Profile row is missing.");

  return {
    ...mockCurrentProfile,
    id: data.id,
    user_id: data.user_id ?? userId,
    full_name: data.full_name ?? mockCurrentProfile.full_name,
    company_name: data.company_name ?? undefined,
    email: data.email ?? mockCurrentProfile.email,
    phone: data.phone ?? undefined,
    role: toUserRole(data.role),
    plan: normalizePlan(data.plan),
    trust_score: data.trust_score ?? 0,
    verification_status: data.verification_status === "verified" ? "Verified" : "Pending"
  };
}
