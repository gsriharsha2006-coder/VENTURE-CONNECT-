"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, ClipboardCheck, FileText, IndianRupee, MessageSquare, RefreshCw, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { ValidationStatusBadge } from "@/components/validation/ValidationStatusBadge";
import { validationBookings, validationReports, validators } from "@/lib/data/validations";
import { validationServices } from "@/lib/validation/config";

const activeValidator = validators[0];
const assignedBookings = validationBookings.filter((booking) => booking.validatorId === activeValidator.id);
const reportDue = validationBookings.filter((booking) => booking.accepted && booking.status !== "Validation Completed");

export default function ValidatorDashboardPage() {
  const earnings = assignedBookings.reduce((sum, booking) => sum + validationServices[booking.serviceType].validatorPayout, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Badge>
          <ShieldCheck size={13} />
          Validator Dashboard
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Manage human validation requests without exposing documents too early.</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Review new requests, accept or decline, complete structured reports, handle revisions, and track payout eligibility after the dispute window.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="New requests" value="1" delta="Acceptance required" />
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
            <CardHeader eyebrow="Profile performance" title={activeValidator.level} />
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2"><Star size={16} className="fill-amber-300 text-amber-500" />Rating {activeValidator.rating}</p>
              <p className="flex items-center gap-2"><ClipboardCheck size={16} className="text-primary" />{activeValidator.completedValidations} completed validations</p>
              <p className="flex items-center gap-2"><RefreshCw size={16} className="text-primary" />Low dispute rate demo status</p>
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
