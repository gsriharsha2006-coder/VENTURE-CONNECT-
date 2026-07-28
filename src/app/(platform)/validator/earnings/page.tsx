"use client";

import { ShieldCheck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { validationBookings } from "@/lib/data/validations";
import { validationServices } from "@/lib/validation/config";

export default function ValidatorEarningsPage() {
  const projected = validationBookings.reduce((sum, booking) => sum + validationServices[booking.serviceType].validatorPayout, 0);
  const platformShare = validationBookings.reduce((sum, booking) => sum + validationServices[booking.serviceType].platformShare, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Badge>
          <Wallet size={13} />
          Earnings
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Payouts release after quality gates.</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Commission and payout amounts come from reusable validation configuration, not deeply hard-coded UI values.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Projected validator payout" value={`Rs ${projected}`} delta="Demo bookings" />
        <MetricCard label="Platform share" value={`Rs ${platformShare}`} delta="Config-driven" />
        <MetricCard label="Ready to release" value="Rs 450" delta="Dispute window cleared" />
      </div>

      <Card>
        <CardHeader eyebrow="Booking payouts" title="Release conditions" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Booking</th>
                <th className="py-3 pr-4">Service</th>
                <th className="py-3 pr-4">Founder paid</th>
                <th className="py-3 pr-4">Validator payout</th>
                <th className="py-3 pr-4">Venture Connect share</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {validationBookings.map((booking) => {
                const service = validationServices[booking.serviceType];
                return (
                  <tr key={booking.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-semibold">{booking.workspace.startupName}</td>
                    <td className="py-3 pr-4">{booking.serviceType}</td>
                    <td className="py-3 pr-4">Rs {service.founderPrice}</td>
                    <td className="py-3 pr-4">Rs {service.validatorPayout}</td>
                    <td className="py-3 pr-4">Rs {service.platformShare}</td>
                    <td className="py-3 pr-4"><Badge tone={booking.payoutStatus === "Released" ? "green" : "amber"}>{booking.payoutStatus}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader eyebrow="Payout policy" title="Escrow release rules" />
        <div className="grid gap-3 md:grid-cols-3">
          {["Required report submitted", "Session completed when applicable", "Founder dispute window ended"].map((item) => (
            <p key={item} className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              {item}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
