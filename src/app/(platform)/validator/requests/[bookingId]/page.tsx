"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileLock2, ShieldAlert, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidationStatusBadge } from "@/components/validation/ValidationStatusBadge";
import { getBookingById, workspaceTemplateLabel } from "@/lib/data/validations";

export default function ValidatorRequestDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const booking = getBookingById(params.bookingId);
  const [decision, setDecision] = useState<"Pending" | "Accepted" | "Declined" | "Conflict declared">("Pending");
  const [agreementChecked, setAgreementChecked] = useState(false);

  if (!booking) {
    return <ValidationEmptyState title="Request not found" description="The selected validation request is unavailable." />;
  }

  const canAccessDocument = decision === "Accepted" || booking.accepted;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <Badge>Request review</Badge>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{booking.workspace.startupName}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Review the founder request and service scope before accepting. Full confidential document access is locked until acceptance and agreement confirmation.
            </p>
          </div>
          <ValidationStatusBadge status={booking.status} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Founder request" title="Short request and service details" />
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Founder", booking.founderName],
                ["Selected service", booking.serviceType],
                ["Domain", booking.domain],
                ["Template", workspaceTemplateLabel(booking.workspace.template)],
                ["Workspace version", `v${booking.workspace.version}`],
                ["Delivery deadline", booking.deliveryDeadline]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Founder note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{booking.requestNote}</p>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Document access" title="Confidential document gate" />
            <div className="mb-3 flex justify-between text-sm font-semibold text-slate-600">
              <span>Completion percentage</span>
              <span>{booking.workspace.completionPercentage}%</span>
            </div>
            <ProgressBar value={booking.workspace.completionPercentage} />
            {canAccessDocument ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                Agreement accepted. Read-only document access can open for Idea Workspace v{booking.workspace.version}.
              </div>
            ) : (
              <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <FileLock2 size={18} className="mt-0.5 shrink-0" />
                Full document content remains locked until you accept and confirm required agreements.
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Decision" title="Accept or decline" />
            <label className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              <input type="checkbox" checked={agreementChecked} onChange={(event) => setAgreementChecked(event.target.checked)} className="mt-1" />
              I confirm there is no conflict of interest and I will not disclose confidential founder information.
            </label>
            <div className="mt-4 grid gap-2">
              <Button disabled={!agreementChecked} onClick={() => setDecision("Accepted")}>
                <CheckCircle2 size={16} />
                Accept request
              </Button>
              <Button variant="secondary" onClick={() => setDecision("Declined")}>
                <XCircle size={16} />
                Decline
              </Button>
              <Button variant="secondary" onClick={() => setDecision("Conflict declared")}>
                <ShieldAlert size={16} />
                Declare conflict
              </Button>
            </div>
            {decision !== "Pending" ? (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                Decision saved in prototype state: {decision}.
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader eyebrow="Report requirement" title="Mandatory before badge" />
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />Badge recommendation stays disabled until mandatory report sections are complete.</p>
              <p className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />Payout release waits for report submission, session completion, and dispute window.</p>
            </div>
            <Link href={`/validator/reports/${booking.id}`}>
              <Button variant="secondary" className="mt-5 w-full">Open report builder</Button>
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
