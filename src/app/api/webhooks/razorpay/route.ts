import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay/client";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { received: true, mode: "mock-fallback", message: "Supabase is not configured; Razorpay persistence is not active." },
      { status: 202 }
    );
  }

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged": {
      const sub = event.payload.subscription?.entity;
      if (sub) {
        const plan = sub.notes?.plan || "Student Pro";
        await supabase
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("razorpay_subscription_id", sub.id);

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("razorpay_subscription_id", sub.id)
          .single();

        if (subscription) {
          await supabase.from("profiles").update({ plan }).eq("id", subscription.user_id);
        }
      }
      break;
    }
    case "subscription.cancelled":
    case "subscription.completed": {
      const sub = event.payload.subscription?.entity;
      if (sub) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", expires_at: new Date().toISOString() })
          .eq("razorpay_subscription_id", sub.id);

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("razorpay_subscription_id", sub.id)
          .single();

        if (subscription) {
          await supabase.from("profiles").update({ plan: "Free" }).eq("id", subscription.user_id);
        }
      }
      break;
    }
    case "payment.captured": {
      const payment = event.payload.payment?.entity;
      if (payment) {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("id, user_id")
          .eq("razorpay_subscription_id", payment.subscription_id)
          .maybeSingle();

        await supabase.from("payments").insert({
          user_id: subscription?.user_id || payment.email,
          subscription_id: subscription?.id,
          amount: payment.amount,
          razorpay_payment_id: payment.id,
          status: "captured"
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
