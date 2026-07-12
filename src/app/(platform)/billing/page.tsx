import Link from "next/link";
import { CreditCard, FileChartColumn, Send, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { pricingTiers } from "@/lib/data";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <Card>
        <Badge>
          <CreditCard size={13} />
          Billing
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold">Plan, usage, and Razorpay-ready subscriptions</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Track workspace, submission, report, and messaging limits. Razorpay subscription IDs can be attached when live credentials are configured.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} className={tier.highlighted ? "border-blue-300 bg-blue-50" : ""}>
            <h2 className="text-xl font-semibold">{tier.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{tier.description}</p>
            <p className="mt-5 text-3xl font-semibold">{tier.price}</p>
            <Link href="/pricing">
              <Button className="mt-5 w-full" variant={tier.highlighted ? "primary" : "secondary"}>Manage plan</Button>
            </Link>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <Wallet size={22} className="text-primary" />
          <p className="mt-3 text-sm text-slate-500">Current plan</p>
          <p className="mt-1 text-2xl font-semibold">Free</p>
          <p className="mt-2 text-xs text-slate-500">Manual plan updates are available in Admin for testing.</p>
        </Card>
        <Card>
          <Send size={22} className="text-primary" />
          <p className="mt-3 text-sm text-slate-500">Opportunity submissions used</p>
          <p className="mt-1 text-2xl font-semibold">0 / 1</p>
          <p className="mt-2 text-xs text-slate-500">Free plan resets monthly.</p>
        </Card>
        <Card>
          <FileChartColumn size={22} className="text-primary" />
          <p className="mt-3 text-sm text-slate-500">Free SWOT used</p>
          <p className="mt-1 text-2xl font-semibold">No</p>
          <p className="mt-2 text-xs text-slate-500">One-time only, not monthly.</p>
        </Card>
      </div>

      <Card>
        <CardHeader eyebrow="Razorpay Structure" title="Subscription fields" />
        <div className="grid gap-3 md:grid-cols-3">
          {["plan", "status", "started_at", "expires_at", "report_count_used", "opportunity_submissions_used", "free_swot_used"].map((field) => (
            <p key={field} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{field}</p>
          ))}
        </div>
      </Card>
    </div>
  );
}
