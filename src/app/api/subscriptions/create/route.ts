import { NextResponse } from "next/server";
import { PRICING_TIERS, PLAN_PRICES } from "@/lib/subscription/plans";
import { createRazorpayCustomer, createSubscription } from "@/lib/razorpay/client";
import { createServiceClient, getAuthUser } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await request.json() as { plan: Exclude<SubscriptionPlan, "Free"> };
  if (!plan || !["Student Pro", "Founder Pro"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const tier = PRICING_TIERS.find((t) => t.name === plan);
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
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let customerId = profile.razorpay_customer_id;
  if (!customerId) {
    const customer = await createRazorpayCustomer(profile.email, profile.full_name);
    customerId = customer.id;
    await supabase.from("profiles").update({ razorpay_customer_id: customerId }).eq("id", user.id);
  }

  const subscription = await createSubscription(tier.razorpayPlanId, customerId);

  await supabase.from("subscriptions").insert({
    user_id: user.id,
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
}
