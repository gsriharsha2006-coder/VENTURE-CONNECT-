"use client";

import Link from "next/link";
import { AlertTriangle, ClipboardCheck, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ValidationStatusBadge } from "@/components/validation/ValidationStatusBadge";
import { validationBookings } from "@/lib/data/validations";

export default function ValidatorRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Badge>
          <ClipboardCheck size={13} />
          Validator Requests
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Accept, decline, or declare conflicts before document access.</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          You can see the founder request, selected service, domain, completion percentage, and version. Full confidential documents unlock only after acceptance and required agreements.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {validationBookings.map((booking) => (
          <Card key={booking.id}>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <ValidationStatusBadge status={booking.status} />
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{booking.workspace.startupName}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{booking.requestNote}</p>
              </div>
              {!booking.accepted ? <Badge tone="amber"><LockKeyhole size={13} />Document locked</Badge> : <Badge tone="green">Accepted</Badge>}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-950">{booking.serviceType}</p>
                <p className="mt-1 text-slate-500">{booking.domain}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
                  <span>Completion</span>
                  <span>{booking.workspace.completionPercentage}%</span>
                </div>
                <ProgressBar value={booking.workspace.completionPercentage} />
              </div>
            </div>
            {booking.workspace.completionPercentage < 100 ? (
              <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                Incomplete document. You may still accept, but the report can require improvements.
              </div>
            ) : null}
            <Link href={`/validator/requests/${booking.id}`}>
              <Button className="mt-5 w-full">Review request</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
