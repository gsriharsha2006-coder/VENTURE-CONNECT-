import { computeEntitlements } from "@/lib/subscription/plans";
import { getBrowserSupabase, getCurrentUserId, normalizePlan } from "@/lib/data/shared";
import { mockCurrentProfile } from "@/lib/data/profiles";
import type { Subscription, SubscriptionPlan } from "@/lib/types";

export async function getSubscriptionUsage(): Promise<{
  plan: SubscriptionPlan;
  subscription: Subscription | null;
  entitlements: ReturnType<typeof computeEntitlements>;
}> {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) {
    const entitlements = computeEntitlements(mockCurrentProfile);
    return { plan: mockCurrentProfile.plan, subscription: null, entitlements };
  }

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", userId).eq("status", "active").maybeSingle()
  ]);

  const plan = normalizePlan(subscription?.plan ?? profile?.plan);
  const entitlements = computeEntitlements({
    ...mockCurrentProfile,
    id: profile?.id ?? mockCurrentProfile.id,
    user_id: userId,
    plan,
    free_report_used: subscription?.free_swot_used ?? false,
    reports_used_this_month: subscription?.report_count_used ?? 0,
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
          free_swot_used: subscription.free_swot_used
        }
      : null,
    entitlements
  };
}

