import { computeEntitlements } from "@/lib/subscription/plans";
import { backendUnavailableError, getBrowserSupabase, getCurrentUserId, normalizePlan, supabaseDataError } from "@/lib/data/shared";
import { mockCurrentProfile } from "@/lib/data/profiles";
import { isDemoDataEnabled } from "@/lib/demo-data";
import type { Subscription, SubscriptionPlan } from "@/lib/types";

export async function getSubscriptionUsage(): Promise<{
  plan: SubscriptionPlan;
  subscription: Subscription | null;
  entitlements: ReturnType<typeof computeEntitlements>;
}> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("load subscription usage");
  if (!supabase || !userId) {
    if (!isDemoDataEnabled()) throw backendUnavailableError("Subscription usage");
    const entitlements = computeEntitlements(mockCurrentProfile);
    return { plan: mockCurrentProfile.plan, subscription: null, entitlements };
  }

  const [{ data: profile, error: profileError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", userId).eq("status", "active").maybeSingle()
  ]);
  if (profileError) throw supabaseDataError("load subscription profile", profileError);
  if (subscriptionError) throw supabaseDataError("load active subscription", subscriptionError);
  if (!profile) throw supabaseDataError("load subscription profile", "Profile row is missing.");

  // Until a verified payment webhook becomes the source of truth, the protected
  // profile plan is authoritative. Browser-editable state is never trusted.
  const plan = normalizePlan(profile?.plan ?? subscription?.plan);
  const usageMonth = typeof subscription?.report_usage_month === "string" ? subscription.report_usage_month.slice(0, 7) : "";
  const currentMonth = new Date().toISOString().slice(0, 7);
  const reportsUsed = usageMonth && usageMonth !== currentMonth ? 0 : subscription?.report_count_used ?? 0;
  const entitlements = computeEntitlements({
    ...mockCurrentProfile,
    id: profile?.id ?? mockCurrentProfile.id,
    user_id: userId,
    plan,
    free_report_used: subscription?.free_swot_used ?? false,
    reports_used_this_month: reportsUsed,
    reports_month_reset: usageMonth ? `${usageMonth}-01T00:00:00.000Z` : undefined,
    opportunity_submissions_used: subscription?.opportunity_submissions_used ?? 0
  });

  return {
    plan,
    subscription: subscription
      ? {
          id: subscription.id,
          user_id: subscription.user_id ?? userId,
          plan,
          status: subscription.status as Subscription["status"],
          started_at: subscription.started_at,
          expires_at: subscription.expires_at ?? undefined,
          report_count_used: subscription.report_count_used,
          opportunity_submissions_used: subscription.opportunity_submissions_used,
          free_swot_used: subscription.free_swot_used,
          report_usage_month: subscription.report_usage_month,
          updated_at: subscription.updated_at
        }
      : null,
    entitlements
  };
}
