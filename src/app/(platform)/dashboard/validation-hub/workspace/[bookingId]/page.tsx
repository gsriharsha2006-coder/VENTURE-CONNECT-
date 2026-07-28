"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CalendarDays, FileLock2, MessageSquare, ShieldCheck, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidationReportView } from "@/components/validation/ValidationReportView";
import { ValidationStatusBadge } from "@/components/validation/ValidationStatusBadge";
import { ValidatorAvatar } from "@/components/validation/ValidatorAvatar";
import { getActivityForBooking, getBadgesForWorkspace, getBookingById, getReportByBookingId, getValidatorById, workspaceTemplateLabel } from "@/lib/data/validations";
import { ideaWorkspaces } from "@/lib/data";
import { validationStatusOrder } from "@/lib/validation/config";

const tabs = ["Overview", "Document", "Messages", "Report", "Activity"] as const;

export default function ValidationWorkspacePage() {
  const params = useParams<{ bookingId: string }>();
  const booking = getBookingById(params.bookingId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [message, setMessage] = useState("");

  if (!booking) {
    return (
      <ValidationEmptyState
        title="Validation workspace not found"
        description="The selected validation booking is unavailable or no longer visible to this founder."
      />
    );
  }

  const validator = getValidatorById(booking.validatorId);
  const report = getReportByBookingId(booking.id);
  const badges = getBadgesForWorkspace(booking.workspace.id);
  const activity = getActivityForBooking(booking.id);
  const workspace = ideaWorkspaces.find((item) => item.id === booking.workspace.id);
  const progressIndex = Math.max(0, validationStatusOrder.indexOf(booking.status));
  const progressValue = booking.status === "Validation Completed"
    ? 100
    : Math.round(((progressIndex + 1) / validationStatusOrder.length) * 100);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Validation Workspace</Badge>
              <ValidationStatusBadge status={booking.status} />
              {booking.workspace.majorChangesSinceBadge ? <Badge tone="amber">Revalidation Recommended</Badge> : null}
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{booking.workspace.startupName}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Dedicated workspace for this booked human validation. Validator messaging, document access, report delivery, and badge status stay separate from investor messaging.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/idea-workspace">
              <Button variant="secondary">Update Idea Workspace</Button>
            </Link>
            <Link href="/dashboard/opportunities">
              <Button>Apply to an Opportunity</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-primary"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {activeTab === "Overview" ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={22} className="text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Validation status</p>
                        <p className="mt-1 text-xl font-semibold text-blue-950">{booking.status}</p>
                      </div>
                    </div>
                    <ProgressBar value={progressValue} className="mt-4 bg-white" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-500">Next action</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{booking.nextAction}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["Validator", validator?.name ?? "Assigned validator"],
                    ["Selected service", booking.serviceType],
                    ["Meeting details", booking.meetingLink ? `${booking.scheduledFor} / ${booking.meetingLanguage}` : "Written review"],
                    ["Idea Workspace version", `v${booking.workspace.version}`],
                    ["Delivery deadline", booking.deliveryDeadline],
                    ["Payment and payout", `${booking.paymentStatus} / ${booking.payoutStatus}`]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                {booking.workspace.majorChangesSinceBadge ? (
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    The Idea Workspace has major changes after the reviewed version. Do not silently carry old badges to the revised document.
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "Document" ? (
              <div className="space-y-4">
                <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  <FileLock2 size={18} className="mt-0.5 shrink-0" />
                  The selected Idea Workspace is shared read-only with the assigned validator. Founder controls access and the exact reviewed version is tracked.
                </div>
                <Card className="p-4">
                  <CardHeader eyebrow="Read-only document" title={`${booking.workspace.startupName} / ${workspaceTemplateLabel(booking.workspace.template)} / v${booking.workspace.version}`} />
                  {workspace ? (
                    <div className="space-y-3">
                      {Object.entries(workspace.sections).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key.replaceAll("_", " ")}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{value || "No content added yet."}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ValidationEmptyState title="Document unavailable" description="The workspace reference exists, but the local mock document was not found." />
                  )}
                </Card>
              </div>
            ) : null}

            {activeTab === "Messages" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Validator messaging opens only after a validation booking. This is separate from investor messaging.
                </div>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="max-w-[88%] rounded-xl bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
                    System: booking created and document access is pending validator acceptance.
                  </div>
                  <div className="max-w-[88%] rounded-xl bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
                    {validator?.name}: I will review the evidence and focus on the assumptions in your note.
                  </div>
                  {booking.meetingLink ? (
                    <div className="max-w-[88%] rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
                      Meeting link: {booking.meetingLink}
                    </div>
                  ) : null}
                  <div className="ml-auto max-w-[88%] rounded-xl bg-primary p-3 text-sm leading-6 text-white shadow-panel">
                    Founder: Please prioritize customer evidence and readiness for the incubator application.
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    placeholder="Message assigned validator..."
                  />
                  <Button>
                    <MessageSquare size={16} />
                    Send
                  </Button>
                </div>
              </div>
            ) : null}

            {activeTab === "Report" ? (
              report ? (
                <ValidationReportView report={report} badges={badges} />
              ) : (
                <ValidationEmptyState
                  title="Report not submitted yet"
                  description="The validator must complete mandatory report sections before badge approval or public review is possible."
                />
              )
            ) : null}

            {activeTab === "Activity" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {activity.length ? activity.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <span className={`block h-2.5 w-2.5 rounded-full ${item.complete ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <p className="mt-3 text-sm font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.timestamp}</p>
                  </div>
                )) : (
                  <ValidationEmptyState title="No activity yet" description="System updates will appear as the validator accepts, reviews, reports, and approves revisions." />
                )}
              </div>
            ) : null}
          </div>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Assigned validator" title={validator?.name ?? "Validator"} />
            <div className="flex items-center gap-3">
              <ValidatorAvatar name={validator?.name ?? "Validator"} verified={validator?.verified} />
              <div>
                <p className="font-semibold text-slate-950">{validator?.role}</p>
                <p className="text-sm text-slate-500">{validator?.institution}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Badges" title="Verified document markers" />
            <div className="space-y-3">
              {badges.length ? badges.map((badge) => (
                <div key={badge.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <Badge tone="green">
                    <UserCheck size={13} />
                    {badge.name}
                  </Badge>
                  <p className="mt-2 text-xs leading-5 text-emerald-800">
                    {badge.verificationId} / v{badge.workspaceVersion} / {badge.readinessStage}
                  </p>
                </div>
              )) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  No badge yet. Payment or booking alone cannot award one.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Session" title="Meeting and deadline" />
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex gap-2">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-primary" />
                {booking.scheduledFor ?? `Written review due ${booking.deliveryDeadline}`}
              </p>
              <p>Delivery deadline: {booking.deliveryDeadline}</p>
              <p>Language: {booking.meetingLanguage}</p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
