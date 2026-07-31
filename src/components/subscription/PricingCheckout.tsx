import Link from "next/link";
import { ArrowRight, CheckCircle2, Crown, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { PRICING_TIERS } from "@/lib/subscription/plans";

export function PricingCheckout() {
  return (
    <div>
      <StatusMessage className="mb-5">
        Plans are shown for product comparison. Paid checkout is unavailable until billing and account services are configured and verified.
      </StatusMessage>
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">For preparing a first application</p>
          <h2 className="mt-2 text-xl font-semibold">Free</h2>
          <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">One Idea Workspace, the startup template, one monthly submission, and one basic readiness report.</p>
          <p className="mt-6 text-4xl font-semibold">Rs 0</p>
          <p className="mt-1 text-sm text-slate-500">No card required</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
            {["1 Idea Workspace", "Startup template", "1 submission per month", "1 basic report", "Messaging remains interest-gated"].map((feature) => (
              <li key={feature} className="flex gap-2">
                <CheckCircle2 aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/auth/register" className="mt-8">
            <Button variant="secondary" className="w-full">
              Create an account
              <ArrowRight aria-hidden="true" size={16} />
            </Button>
          </Link>
        </div>

        {PRICING_TIERS.map((tier) => {
          const descriptionId = `${tier.name.toLowerCase().replaceAll(" ", "-")}-availability`;
          return (
            <div key={tier.name} className={`relative flex flex-col rounded-lg border p-6 shadow-sm ${tier.highlighted ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
              {tier.highlighted ? (
                <Badge className="mb-4 w-fit"><Crown aria-hidden="true" size={13} />For active founder teams</Badge>
              ) : <p className="mb-4 text-sm font-semibold text-slate-500">For student founder teams</p>}
              <h2 className="text-xl font-semibold">{tier.name}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{tier.description}</p>
              <p className="mt-6 text-4xl font-semibold">{tier.price}</p>
              <p className="mt-1 text-sm text-slate-500">Planned monthly billing</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" variant="secondary" disabled aria-describedby={descriptionId}>
                <LockKeyhole aria-hidden="true" size={16} />
                Checkout unavailable
              </Button>
              <p id={descriptionId} className="mt-3 text-xs leading-5 text-slate-500">Billing has not been enabled in this environment.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
