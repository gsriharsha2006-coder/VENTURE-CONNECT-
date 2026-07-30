"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { PRICING_TIERS } from "@/lib/subscription/plans";
import type { SubscriptionPlan } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function PricingCheckout() {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState("");

  async function subscribe(plan: Exclude<SubscriptionPlan, "Free">) {
    setLoading(plan);
    setCheckoutStatus("");
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
      setCheckoutStatus(error instanceof Error ? error.message : "Checkout could not be started.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {checkoutStatus ? <StatusMessage tone="error" className="mb-5">{checkoutStatus}</StatusMessage> : null}
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">For exploring the workflow</p>
          <h2 className="mt-2 text-xl font-semibold">Free</h2>
          <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">One Idea Workspace, Startup Template, one monthly submission, and one lifetime Basic SWOT Report.</p>
          <p className="mt-6 text-4xl font-semibold">₹0</p>
          <p className="mt-1 text-sm text-slate-500">No card required</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
          {["1 Idea Workspace", "Startup Template only", "1 submission/month", "1 Basic SWOT Report once", "No full messaging access"].map((feature) => (
            <li key={feature} className="flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              {feature}
            </li>
          ))}
          </ul>
          <Link href="/auth/register" className="mt-8">
            <Button variant="secondary" className="w-full">
              Start free
              <ArrowRight aria-hidden="true" size={16} />
            </Button>
          </Link>
        </div>

        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-lg border p-6 shadow-sm ${tier.highlighted ? "border-blue-300 bg-blue-50/70 ring-1 ring-blue-200" : "border-slate-200 bg-white"}`}
          >
            {tier.highlighted ? (
              <Badge className="mb-4 w-fit">
                <Crown aria-hidden="true" size={13} />
                Best for active founders
              </Badge>
            ) : <p className="mb-4 text-sm font-semibold text-slate-500">For student founder teams</p>}
            <h2 className="text-xl font-semibold">{tier.name}</h2>
            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{tier.description}</p>
            <p className="mt-6 text-4xl font-semibold">{tier.price.replace("Rs", "₹")}</p>
            <p className="mt-1 text-sm text-slate-500">Billed monthly</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
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
              {loading === tier.name ? "Opening checkout..." : `Choose ${tier.name}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
