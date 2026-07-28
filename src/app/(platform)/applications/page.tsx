"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileChartColumn,
  Lightbulb,
  MessagesSquare,
  Save,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { applications as seedApplications, externalRegistrations as seedExternalRegistrations } from "@/lib/data";
import { getExternalRegistrations, updateExternalRegistration } from "@/lib/data/opportunity-tracking";
import { getBadgesForWorkspace } from "@/lib/data/validations";
import type { ApplicationStatus, ExternalRegistration, ExternalRegistrationStatus } from "@/lib/types";

const actions: Array<{ label: string; status: ApplicationStatus; icon: typeof CheckCircle2; tone: "primary" | "secondary" }> = [
  { label: "Under Review", status: "Under Review", icon: ClipboardList, tone: "secondary" },
  { label: "Save", status: "Saved by Investor", icon: Save, tone: "secondary" },
  { label: "Interested", status: "Interested", icon: MessagesSquare, tone: "primary" },
  { label: "Shortlist", status: "Shortlisted", icon: CheckCircle2, tone: "secondary" },
  { label: "Reject", status: "Rejected", icon: XCircle, tone: "secondary" }
];

const externalStatuses: ExternalRegistrationStatus[] = [
  "Not Started",
  "Registration Opened",
  "Applied Externally",
  "Shortlisted",
  "Selected",
  "Not Selected",
  "Withdrawn"
];

function statusTone(status: ApplicationStatus) {
  if (status === "Rejected") return "red";
  if (status === "Interested" || status === "Shortlisted") return "green";
  if (status === "Saved by Investor") return "amber";
  return "blue";
}

export default function ApplicationsPage() {
  const [tab, setTab] = useState<"internal" | "external">("internal");
  const [applications, setApplications] = useState(seedApplications);
  const [selectedId, setSelectedId] = useState(seedApplications[0]?.id ?? "");
  const [registrations, setRegistrations] = useState<ExternalRegistration[]>(seedExternalRegistrations);
  const [selectedExternalId, setSelectedExternalId] = useState(seedExternalRegistrations[0]?.id ?? "");
  const [externalNotice, setExternalNotice] = useState("");
  const selected = applications.find((application) => application.id === selectedId) ?? applications[0];
  const selectedExternal = registrations.find((registration) => registration.id === selectedExternalId) ?? registrations[0];
  const validationBadges = selected?.idea_workspace_id ? getBadgesForWorkspace(selected.idea_workspace_id) : [];

  useEffect(() => {
    const tracked = getExternalRegistrations(seedExternalRegistrations);
    setRegistrations(tracked);
    setSelectedExternalId((current) => current || tracked[0]?.id || "");
  }, []);

  const externalCounts = useMemo(
    () => ({
      opened: registrations.filter((item) => item.status === "Registration Opened").length,
      applied: registrations.filter((item) => item.status === "Applied Externally").length,
      decisions: registrations.filter((item) => ["Shortlisted", "Selected", "Not Selected"].includes(item.status)).length
    }),
    [registrations]
  );

  function updateStatus(status: ApplicationStatus) {
    if (!selected) return;
    setApplications((current) =>
      current.map((application) =>
        application.id === selected.id
          ? {
              ...application,
              status,
              reviewedAt: new Date().toISOString().slice(0, 10),
              timeline: [
                ...application.timeline,
                ...(application.timeline.some((step) => step.label === status)
                  ? []
                  : [{ label: status, date: "Now", complete: true }])
              ]
            }
          : application
      )
    );
  }

  async function updateTrackedStatus(status: ExternalRegistrationStatus) {
    if (!selectedExternal) return;
    const updated = await updateExternalRegistration({
      opportunityId: selectedExternal.opportunity_id,
      opportunityTitle: selectedExternal.opportunity_title,
      organizerName: selectedExternal.organizer_name,
      status,
      externalApplicationId: selectedExternal.external_application_id,
      teamName: selectedExternal.team_name,
      submissionDate: selectedExternal.submission_date,
      notes: selectedExternal.notes,
      confirmationFileName: selectedExternal.confirmation_file_name
    });
    setRegistrations((current) => [updated, ...current.filter((item) => item.opportunity_id !== updated.opportunity_id)]);
    setSelectedExternalId(updated.id);
    setExternalNotice("Tracking updated. This remains a founder-entered status until the organiser confirms it.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Applications"
        title="Internal applications and external registrations"
        description="Structured Venture Connect applications and founder-tracked organiser registrations stay separate, so every status has a clear source."
      />
      <div role="tablist" aria-label="Application tracking views" className="flex w-full gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 sm:w-fit">
          <button role="tab" aria-selected={tab === "internal"} type="button" onClick={() => setTab("internal")} className={`min-h-10 shrink-0 rounded-md px-4 py-2 text-sm font-semibold ${tab === "internal" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>
            Venture Connect Applications ({applications.length})
          </button>
          <button role="tab" aria-selected={tab === "external"} type="button" onClick={() => setTab("external")} className={`min-h-10 shrink-0 rounded-md px-4 py-2 text-sm font-semibold ${tab === "external" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>
            External Registrations ({registrations.length})
          </button>
      </div>

      {tab === "internal" ? (
        applications.length && selected ? (
          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader eyebrow="Venture Connect" title="Structured applications" />
              <div className="space-y-3">
                {applications.map((application) => (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() => setSelectedId(application.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${selectedId === application.id ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{application.startup}</p>
                        <p className="mt-1 text-xs text-slate-500">{application.opportunity}</p>
                      </div>
                      <Badge tone={statusTone(application.status)}>{application.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                    <h2 className="mt-3 text-2xl font-semibold">{selected.startup}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Submitted by {selected.founder} to {selected.reviewer} for {selected.opportunity}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button key={action.label} variant={action.tone} onClick={() => updateStatus(action.status)}>
                          <Icon size={16} />
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-4">
                {[
                  { label: "Idea Workspace", icon: Lightbulb, text: "Completed document attached." },
                  { label: "VC Readiness Report", icon: FileChartColumn, text: "Report score and summary available when included." },
                  { label: "Human Validation", icon: ShieldCheck, text: validationBadges.length ? "Limited Human Reviewed summary available." : "No human-reviewed badge attached." },
                  { label: "Message Thread", icon: MessagesSquare, text: selected.status === "Interested" ? "Thread created after interest." : "Locked until Interested." }
                ].map((packet) => {
                  const Icon = packet.icon;
                  return (
                    <Card key={packet.label}>
                      <Icon size={22} className="text-primary" />
                      <h3 className="mt-4 text-base font-semibold">{packet.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{packet.text}</p>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardHeader eyebrow="Timeline" title="Application status" />
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {["Submitted", "Under Review", "Saved by Investor", "Interested", "Shortlisted", "Rejected"].map((status) => {
                    const step = selected.timeline.find((item) => item.label === status);
                    const complete = selected.status === status || Boolean(step?.complete);
                    return (
                      <div key={status} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <span className={`block h-2.5 w-2.5 rounded-full ${complete ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <p className="mt-3 text-xs font-semibold text-slate-700">{status}</p>
                        <p className="mt-1 text-xs text-slate-500">{step?.date ?? "Pending"}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <CardHeader eyebrow="Messaging" title="Unlock logic" />
                <p className="text-sm leading-6 text-slate-600">
                  When a reviewer marks Interested, the founder receives a notification and a conversation thread is created.
                </p>
                <Link href="/dashboard/messages"><Button variant="secondary" className="mt-4">Open messages</Button></Link>
              </Card>
            </div>
          </div>
        ) : (
          <Card><CardHeader eyebrow="Empty" title="No Venture Connect applications yet" /><p className="text-sm text-slate-600">Internal investor and programme applications will appear here.</p></Card>
        )
      ) : registrations.length && selectedExternal ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><p className="text-sm text-slate-500">Registration opened</p><p className="mt-2 text-3xl font-semibold">{externalCounts.opened}</p></Card>
            <Card><p className="text-sm text-slate-500">Applied externally</p><p className="mt-2 text-3xl font-semibold">{externalCounts.applied}</p></Card>
            <Card><p className="text-sm text-slate-500">Founder-tracked decisions</p><p className="mt-2 text-3xl font-semibold">{externalCounts.decisions}</p></Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader eyebrow="Tracked by You" title="External registrations" />
              <div className="space-y-3">
                {registrations.map((registration) => (
                  <button key={registration.id} type="button" onClick={() => setSelectedExternalId(registration.id)} className={`w-full rounded-lg border p-4 text-left ${selectedExternal.id === registration.id ? "border-blue-200 bg-blue-50" : "border-slate-200"}`}>
                    <p className="text-sm font-semibold">{registration.opportunity_title}</p>
                    <p className="mt-1 text-xs text-slate-500">{registration.organizer_name}</p>
                    <Badge tone="slate" className="mt-3">{registration.status}</Badge>
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone="amber">Tracked by You</Badge>
                  <h2 className="mt-3 text-2xl font-semibold">{selectedExternal.opportunity_title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{selectedExternal.organizer_name}</p>
                </div>
                <ExternalLink size={22} className="text-primary" />
              </div>
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Venture Connect has not verified this external application status. Registration, selection, and communication remain with the organiser.
              </div>
              <label className="mt-5 block">
                <span className="text-sm font-semibold">Update tracking status</span>
                <select value={selectedExternal.status} onChange={(event) => void updateTrackedStatus(event.target.value as ExternalRegistrationStatus)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  {externalStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Team: {selectedExternal.team_name ?? "Not recorded"}</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Application ID: {selectedExternal.external_application_id ?? "Not recorded"}</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Submission date: {selectedExternal.submission_date ?? "Not recorded"}</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Updated: {new Date(selectedExternal.updated_at).toLocaleDateString()}</p>
              </div>
              {externalNotice ? <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{externalNotice}</div> : null}
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader eyebrow="Empty" title="No external registrations tracked" />
          <p className="text-sm text-slate-600">Open a hackathon, workshop, webinar, or external programme and use its official registration link.</p>
          <Link href="/dashboard/opportunities"><Button className="mt-4">Explore opportunities</Button></Link>
        </Card>
      )}
    </div>
  );
}
