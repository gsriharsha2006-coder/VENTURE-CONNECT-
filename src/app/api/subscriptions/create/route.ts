import { NextResponse } from "next/server";
import { AuthorizationError, requireProfile } from "@/lib/auth/server";
import { PRICING_TIERS, PLAN_PRICES } from "@/lib/subscription/plans";
import { createRazorpayCustomer, createSubscription } from "@/lib/razorpay/client";
import { createServiceClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { authUserId, profile } = await requireProfile();
    const { plan } = await request.json() as { plan: Exclude<SubscriptionPlan, "Free"> };
    if (!plan || !["Student Pro", "Founder Pro"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const tier = PRICING_TIERS.find((item) => item.name === plan);
    if (!tier?.razorpayPlanId) {
      return NextResponse.json({ error: "Razorpay plan not configured" }, { status: 500 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured. Razorpay remains a future integration." },
        { status: 503 }
      );
    }

    let customerId = profile.razorpay_customer_id;
    if (!customerId) {
      const customer = await createRazorpayCustomer(profile.email ?? "", profile.full_name ?? "Venture Connect member");
      customerId = customer.id;
      await supabase.from("profiles").update({ razorpay_customer_id: customerId }).eq("id", profile.id);
    }

    if (!customerId) return NextResponse.json({ error: "Unable to resolve payment customer." }, { status: 500 });
    const subscription = await createSubscription(tier.razorpayPlanId, customerId);
    await supabase.from("subscriptions").insert({
      user_id: authUserId,
      plan,
      status: "active",
      razorpay_subscription_id: subscription.id,
      razorpay_customer_id: customerId,
      started_at: new Date().toISOString()
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: PLAN_PRICES[plan],
      plan
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to create subscription." }, { status: 500 });
  }
}
