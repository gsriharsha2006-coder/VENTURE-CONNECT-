"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PRICING_TIERS } from "@/lib/subscription/plans";
import type { SubscriptionPlan } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function PricingCheckout() {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);

  async function subscribe(plan: Exclude<SubscriptionPlan, "Free">) {
    setLoading(plan);
    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout is not configured yet.");

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const checkout = new window.Razorpay!({
          key: data.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: data.subscriptionId,
          name: "Venture Connect",
          description: `${plan} Plan`,
          handler: () => {
            window.location.href = "/dashboard/billing?subscribed=1";
          }
        });
        checkout.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Free</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">One Idea Workspace, Startup Template, one monthly submission, and one lifetime Basic SWOT Report.</p>
        <p className="mt-6 text-4xl font-semibold">Rs 0</p>
        <ul className="mt-6 space-y-2 text-sm text-slate-700">
          {["1 Idea Workspace", "Startup Template only", "1 submission/month", "1 Basic SWOT Report once", "No full messaging access"].map((feature) => (
            <li key={feature} className="flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              {feature}
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-8 w-full" disabled>Current tier</Button>
      </div>

      {PRICING_TIERS.map((tier) => (
        <div
          key={tier.name}
          className={`rounded-lg border p-6 shadow-sm ${tier.highlighted ? "border-blue-300 bg-blue-50/70" : "border-slate-200 bg-white"}`}
        >
          <h2 className="text-xl font-semibold">{tier.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{tier.description}</p>
          <p className="mt-6 text-4xl font-semibold">{tier.price}</p>
          <ul className="mt-6 space-y-2 text-sm text-slate-700">
            {tier.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                {feature}
              </li>
            ))}
          </ul>
          <Button
            className="mt-8 w-full"
            variant={tier.highlighted ? "primary" : "secondary"}
            disabled={loading === tier.name}
            onClick={() => subscribe(tier.name)}
          >
            {loading === tier.name ? "Loading..." : `Choose ${tier.name}`}
          </Button>
        </div>
      ))}
    </div>
  );
}
