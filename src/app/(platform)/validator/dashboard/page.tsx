"use client";

import Link from "next/link";
import { CalendarDays, ClipboardCheck, FileText, IndianRupee, MessageSquare, RefreshCw, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidationStatusBadge } from "@/components/validation/ValidationStatusBadge";
import { validationBookings, validationReports, validators } from "@/lib/data/validations";
import { validationServices } from "@/lib/validation/config";

export default function ValidatorDashboardPage() {
  const activeValidator = validators[0];
  if (!activeValidator) {
    return (
      <ValidationEmptyState
        title="No approved validator profile is available"
        description="A validator workspace will appear after identity, expertise, and service scope have been reviewed. No sample requests or performance figures are shown."
      />
    );
  }

  const assignedBookings = validationBookings.filter((booking) => booking.validatorId === activeValidator.id);
  const reportDue = validationBookings.filter((booking) => booking.accepted && booking.status !== "Validation Completed");
  const earnings = assignedBookings.reduce((sum, booking) => sum + validationServices[booking.serviceType].validatorPayout, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Validator dashboard"
        title="Manage validation requests without exposing documents too early."
        description="Review incoming work, complete structured reports, handle revisions, and track payout eligibility after the dispute window."
        actions={
          <Link href="/validator/requests">
            <Button>Review requests</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="New requests" value={String(assignedBookings.filter((booking) => !booking.accepted).length)} delta="Acceptance required" />
        <MetricCard label="Reports due" value={String(reportDue.length)} delta="Mandatory sections enforced" />
        <MetricCard label="Completed validations" value={String(validationReports.length)} delta="Badge checks complete" />
        <MetricCard label="Earnings summary" value={`Rs ${earnings}`} delta="Payouts after dispute window" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="New requests" title="Review before document access" action={<Link href="/validator/requests" className="text-sm font-semibold text-primary">Open queue</Link>} />
            <div className="space-y-3">
              {validationBookings.slice(-2).map((booking) => (
                <Link key={booking.id} href={`/validator/requests/${booking.id}`} className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{booking.workspace.startupName}</p>
                      <p className="mt-1 text-xs text-slate-500">{booking.founderName} / {booking.serviceType} / {booking.domain}</p>
                    </div>
                    <ValidationStatusBadge status={booking.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{booking.requestNote}</p>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Documents under review" title="Active validation workspaces" />
            <div className="grid gap-3 md:grid-cols-2">
              {assignedBookings.map((booking) => (
                <Link key={booking.id} href={`/validator/reports/${booking.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200">
                  <Badge tone={booking.status === "Validation Completed" ? "green" : "blue"}>{booking.status}</Badge>
                  <p className="mt-3 text-sm font-semibold text-slate-950">{booking.workspace.startupName}</p>
                  <p className="mt-1 text-xs text-slate-500">v{booking.workspace.version} / Due {booking.deliveryDeadline}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Upcoming sessions" title="Calendar" />
            <div className="space-y-3">
              {validationBookings.filter((booking) => booking.scheduledFor).map((booking) => (
                <div key={booking.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <CalendarDays size={16} className="text-primary" />
                    {booking.workspace.startupName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{booking.scheduledFor} / {booking.meetingLanguage}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow={activeValidator.isDemo ? "Demo profile" : "Profile performance"} title={activeValidator.level} />
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2"><Star size={16} className="text-slate-400" />Rating not yet available</p>
              <p className="flex items-center gap-2"><ClipboardCheck size={16} className="text-primary" />No verified validation history</p>
              <p className="flex items-center gap-2"><RefreshCw size={16} className="text-primary" />Sample workflow status</p>
            </div>
            <Link href="/validator/profile">
              <Button variant="secondary" className="mt-5 w-full">Improve profile</Button>
            </Link>
          </Card>

          <Card>
            <CardHeader eyebrow="Quick actions" title="Validator tools" />
            <div className="grid gap-2">
              {[
                { href: "/validator/requests", label: "Requests", icon: MessageSquare },
                { href: "/validator/reports", label: "Reports", icon: FileText },
                { href: "/validator/earnings", label: "Earnings", icon: IndianRupee }
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 hover:border-blue-200">
                  <span>{label}</span>
                  <Icon size={16} className="text-primary" />
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
