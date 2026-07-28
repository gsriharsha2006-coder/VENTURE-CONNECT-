"use client";

import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ValidationStatusBadge } from "@/components/validation/ValidationStatusBadge";
import { validationBookings, validationReports } from "@/lib/data/validations";

export default function ValidatorReportsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Badge>
          <FileText size={13} />
          Reports
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Build structured validation reports.</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Use separate score justifications, strengths, concerns, required improvements, experiments, final conclusion, and badge recommendations.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {validationBookings.map((booking) => {
          const report = validationReports.find((item) => item.bookingId === booking.id);
          return (
            <Card key={booking.id}>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <ValidationStatusBadge status={booking.status} />
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{booking.workspace.startupName}</h2>
                  <p className="mt-2 text-sm text-slate-600">{booking.serviceType} / Due {booking.deliveryDeadline}</p>
                </div>
                {report?.approvedForBadge ? <Badge tone="green"><ShieldCheck size={13} />Badge approved</Badge> : <Badge tone="amber">Report required</Badge>}
              </div>
              <Link href={`/validator/reports/${booking.id}`}>
                <Button className="mt-5 w-full" variant={report ? "secondary" : "primary"}>
                  {report ? "Review report" : "Build report"}
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
