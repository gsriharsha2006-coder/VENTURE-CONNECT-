"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Send,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidationReportView } from "@/components/validation/ValidationReportView";
import { ValidationStatusBadge } from "@/components/validation/ValidationStatusBadge";
import { ValidatorAvatar } from "@/components/validation/ValidatorAvatar";
import {
  getActivityForBooking,
  getBadgesForWorkspace,
  getBookingById,
  getReportByBookingId,
  getValidatorById,
  workspaceTemplateLabel
} from "@/lib/data/validations";
import { ideaWorkspaces } from "@/lib/data";
import { validationStatusOrder } from "@/lib/validation/config";

const tabs = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Document", icon: FileText },
  { label: "Messages", icon: MessageSquare },
  { label: "Report", icon: ShieldCheck },
  { label: "Activity", icon: Activity }
] as const satisfies ReadonlyArray<{ label: string; icon: LucideIcon }>;

type WorkspaceTab = (typeof tabs)[number]["label"];

export default function ValidationWorkspacePage() {
  const params = useParams<{ bookingId: string }>();
  const booking = getBookingById(params.bookingId);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Overview");
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<string[]>([]);

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

  function sendMessage() {
    const content = message.trim();
    if (!content) return;
    setSentMessages((current) => [...current, content]);
    setMessage("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Validation Workspace"
        title={booking.workspace.startupName}
        description="A private workspace for the booked review, exact document version, validator conversation, structured report, and verification history."
        actions={(
          <>
            <Link href="/dashboard/idea-workspace">
              <Button variant="secondary">Update document</Button>
            </Link>
            <Link href="/dashboard/opportunities">
              <Button>
                Apply to opportunities
                <ArrowRight aria-hidden="true" size={16} />
              </Button>
            </Link>
          </>
        )}
      />

      <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {validator?.isDemo ? <Badge tone="amber">Sample booking</Badge> : null}
          <ValidationStatusBadge status={booking.status} />
          <Badge tone="slate">{booking.serviceType}</Badge>
          <Badge tone="slate">Idea Workspace v{booking.workspace.version}</Badge>
          {booking.workspace.majorChangesSinceBadge ? <Badge tone="amber">Revalidation recommended</Badge> : null}
        </div>
        <div className="w-full max-w-md">
          <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600">
            <span>Validation progress</span>
            <span>{progressValue}%</span>
          </div>
          <ProgressBar value={progressValue} />
        </div>
      </section>

      <div role="tablist" aria-label="Validation workspace sections" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.label)}
              className={`inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors ${
                selected ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon aria-hidden="true" size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section role="tabpanel" className="min-w-0">
          {activeTab === "Overview" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <p className="text-sm font-semibold text-primary">Current status</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{booking.status}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Next action: {booking.nextAction}</p>
                </Card>
                <Card>
                  <p className="text-sm font-semibold text-primary">Delivery commitment</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{booking.deliveryDeadline}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{booking.scheduledFor ?? "Written review without a live session"}</p>
                </Card>
              </div>
              <Card>
                <CardHeader eyebrow="Booking details" title="Scope and controls" />
                <dl className="divide-y divide-slate-200 border-y border-slate-200">
                  {[
                    ["Validator", validator?.name ?? "Assigned validator"],
                    ["Selected service", booking.serviceType],
                    ["Meeting", booking.meetingLink ? `${booking.scheduledFor} · ${booking.meetingLanguage}` : "Written review"],
                    ["Payment", booking.paymentStatus],
                    ["Validator payout", booking.payoutStatus],
                    ["Reviewed document", `${workspaceTemplateLabel(booking.workspace.template)} · v${booking.workspace.version}`]
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]">
                      <dt className="text-sm font-medium text-slate-500">{label}</dt>
                      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              {booking.workspace.majorChangesSinceBadge ? (
                <StatusMessage>
                  The Idea Workspace has major changes after the reviewed version. Existing badges should not be carried to the revision without another review.
                </StatusMessage>
              ) : null}
            </div>
          ) : null}

          {activeTab === "Document" ? (
            <Card>
              <CardHeader
                eyebrow="Read-only document"
                title={`${booking.workspace.startupName} · ${workspaceTemplateLabel(booking.workspace.template)} · v${booking.workspace.version}`}
              />
              <StatusMessage className="mb-5">
                The assigned validator receives read-only access to this exact version. Later edits remain separate.
              </StatusMessage>
              {workspace ? (
                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {Object.entries(workspace.sections).slice(0, 8).map(([key, value]) => (
                    <div key={key} className="grid gap-2 py-4 lg:grid-cols-[210px_1fr]">
                      <p className="text-sm font-semibold capitalize text-slate-700">{key.replaceAll("_", " ")}</p>
                      <p className="text-sm leading-6 text-slate-600">{value || "No content added yet."}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <ValidationEmptyState title="Document unavailable" description="The workspace reference exists, but the local mock document was not found." />
              )}
            </Card>
          ) : null}

          {activeTab === "Messages" ? (
            <Card>
              <CardHeader eyebrow="Booking conversation" title="Messages with the assigned validator" />
              <p className="mb-5 text-sm leading-6 text-slate-600">This thread exists only for the paid validation and remains separate from investor messaging.</p>
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="max-w-[88%] rounded-lg bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
                  System: booking created and document access is pending validator acceptance.
                </div>
                <div className="max-w-[88%] rounded-lg bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
                  {validator?.name}: I will review the evidence and focus on the assumptions in your note.
                </div>
                {booking.meetingLink ? (
                  <div className="max-w-[88%] rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
                    Meeting link: {booking.meetingLink}
                  </div>
                ) : null}
                <div className="ml-auto max-w-[88%] rounded-lg bg-primary p-3 text-sm leading-6 text-white">
                  Please prioritize customer evidence and readiness for the incubator application.
                </div>
                {sentMessages.map((item, index) => (
                  <div key={`${item}-${index}`} className="ml-auto max-w-[88%] rounded-lg bg-primary p-3 text-sm leading-6 text-white">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <label className="sr-only" htmlFor="validation-message">Message assigned validator</label>
                <input
                  id="validation-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendMessage();
                  }}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none"
                  placeholder="Message assigned validator..."
                />
                <Button onClick={sendMessage} aria-label="Send validation message">
                  <Send aria-hidden="true" size={16} />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>
            </Card>
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
            <Card>
              <CardHeader eyebrow="Audit trail" title="Validation activity" />
              {activity.length ? (
                <ol className="divide-y divide-slate-200 border-y border-slate-200">
                  {activity.map((item) => (
                    <li key={item.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-4">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${item.complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {item.complete ? <CheckCircle2 aria-hidden="true" size={14} /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                      </span>
                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                      <time className="text-xs text-slate-500">{item.timestamp}</time>
                    </li>
                  ))}
                </ol>
              ) : (
                <ValidationEmptyState title="No activity yet" description="System updates will appear as the validator accepts, reviews, reports, and approves revisions." />
              )}
            </Card>
          ) : null}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader eyebrow="Assigned validator" title={validator?.name ?? "Validator"} />
            <div className="flex items-center gap-3">
              <ValidatorAvatar name={validator?.name ?? "Validator"} photoUrl={validator?.photoUrl} verified={validator?.verified} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{validator?.role}</p>
                <p className="truncate text-sm text-slate-500">{validator?.institution}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Verification" title="Document badges" />
            <div className="space-y-3">
              {badges.length ? badges.map((badge) => (
                <div key={badge.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <Badge tone="green">
                    <UserCheck aria-hidden="true" size={13} />
                    {badge.name}
                  </Badge>
                  <p className="mt-2 text-xs leading-5 text-emerald-800">
                    {badge.verificationId} · v{badge.workspaceVersion} · {badge.readinessStage}
                  </p>
                </div>
              )) : (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  No badge yet. Booking or payment alone cannot award one.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Deadline" title="Session and delivery" />
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex gap-2">
                <CalendarDays aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-primary" />
                {booking.scheduledFor ?? `Written review due ${booking.deliveryDeadline}`}
              </p>
              <p>Language: {booking.meetingLanguage}</p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
