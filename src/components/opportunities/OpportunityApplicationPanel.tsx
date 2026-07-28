"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  Flag,
  Share2,
  Wrench
} from "lucide-react";
import { ExternalRegistrationDialog } from "@/components/opportunities/ExternalRegistrationDialog";
import { ApplicationMethodBadge } from "@/components/opportunities/ApplicationMethodBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getExternalRegistrations,
  recordOpportunityEvent,
  updateExternalRegistration
} from "@/lib/data/opportunity-tracking";
import { externalRegistrations } from "@/lib/data";
import {
  getOpportunityApplicationMethod,
  isExternallyManagedApplication
} from "@/lib/opportunities/application-methods";
import type { ExternalRegistrationStatus, Opportunity } from "@/lib/types";

const trackingStatuses: ExternalRegistrationStatus[] = [
  "Not Started",
  "Registration Opened",
  "Applied Externally",
  "Shortlisted",
  "Selected",
  "Not Selected",
  "Withdrawn"
];

function downloadDeadline(opportunity: Opportunity) {
  const compactDate = opportunity.deadline.replaceAll("-", "");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${opportunity.id}@ventureconnect`,
    `DTSTART;VALUE=DATE:${compactDate}`,
    `DTEND;VALUE=DATE:${compactDate}`,
    `SUMMARY:${opportunity.title} registration deadline`,
    `DESCRIPTION:Official registration is managed by ${opportunity.organizer_name}.`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${opportunity.id}-deadline.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OpportunityApplicationPanel({ opportunity }: { opportunity: Opportunity }) {
  const method = getOpportunityApplicationMethod(opportunity);
  const initialRegistration = useMemo(
    () => getExternalRegistrations(externalRegistrations).find((item) => item.opportunity_id === opportunity.id),
    [opportunity.id]
  );
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<ExternalRegistrationStatus>(initialRegistration?.status ?? "Not Started");
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [saved, setSaved] = useState(opportunity.saved);
  const [notice, setNotice] = useState("");
  const [externalApplicationId, setExternalApplicationId] = useState(initialRegistration?.external_application_id ?? "");
  const [teamName, setTeamName] = useState(initialRegistration?.team_name ?? "");
  const [submissionDate, setSubmissionDate] = useState(initialRegistration?.submission_date ?? "");
  const [notes, setNotes] = useState(initialRegistration?.notes ?? "");
  const [confirmationFileName, setConfirmationFileName] = useState(initialRegistration?.confirmation_file_name ?? "");

  useEffect(() => {
    void recordOpportunityEvent({ opportunityId: opportunity.id, eventType: "opportunity_viewed", referralSource: "opportunity_details" });
  }, [opportunity.id]);

  async function setExternalStatus(status: ExternalRegistrationStatus) {
    setRegistrationStatus(status);
    await updateExternalRegistration({
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      organizerName: opportunity.organizer_name,
      status,
      externalApplicationId: externalApplicationId || undefined,
      teamName: teamName || undefined,
      submissionDate: submissionDate || undefined,
      notes: notes || undefined,
      confirmationFileName: confirmationFileName || undefined
    });
  }

  async function continueExternally(destination: { url: string; domain: string }) {
    setConfirmationOpen(false);
    const opened = window.open(destination.url, "_blank", "noopener,noreferrer");
    if (opened) opened.opener = null;
    await recordOpportunityEvent({
      opportunityId: opportunity.id,
      eventType: "official_registration_clicked",
      referralSource: "opportunity_details"
    });
    await setExternalStatus("Registration Opened");
    setNotice(`Registration opened on ${destination.domain}. Return here to mark it as applied.`);
  }

  async function shareOpportunity() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: opportunity.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setNotice("Opportunity link copied.");
    }
  }

  const externallyManaged = isExternallyManagedApplication(method);

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ApplicationMethodBadge method={method} />
          {externallyManaged ? <Badge tone="slate">Tracked by You: {registrationStatus}</Badge> : null}
        </div>

        {method === "external_registration" || method === "hybrid_application" ? (
          <>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Register with {opportunity.organizer_name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              You will be redirected to the organiser&apos;s official registration page. Application questions, team details and submission rules are managed by the organiser.
            </p>
            <Button className="mt-5 w-full" onClick={() => setConfirmationOpen(true)}>
              Register on Official Website
              <ExternalLink size={16} />
            </Button>
            <button
              type="button"
              onClick={() => {
                const nextOpen = !trackingOpen;
                setTrackingOpen(nextOpen);
                if (nextOpen && registrationStatus !== "Applied Externally") {
                  void setExternalStatus("Applied Externally");
                  setNotice("Marked as applied and saved as a founder-tracked status.");
                }
              }}
              className="mt-3 w-full text-center text-sm font-semibold text-primary"
            >
              {trackingOpen ? "Hide tracking details" : "Mark as Applied"}
            </button>
            {method === "hybrid_application" ? (
              <Link href="/dashboard/idea-workspace?template=hackathon" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-800">
                <Wrench size={16} />
                Prepare Your Hackathon Project
              </Link>
            ) : null}
          </>
        ) : method === "idea_workspace_application" ? (
          <>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Submit a structured application</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Select an eligible Idea Workspace document. The organiser will receive the structured application inside Venture Connect.
            </p>
            <Link href={`/dashboard/opportunities?apply=${opportunity.id}`}>
              <Button className="mt-5 w-full">Apply using Idea Workspace</Button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Information listing</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This opportunity does not currently accept applications through Venture Connect.</p>
          </>
        )}

        {trackingOpen && externallyManaged ? (
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              This status is tracked by you and is not verified by the organiser.
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Tracking status</span>
              <select value={registrationStatus} onChange={(event) => setRegistrationStatus(event.target.value as ExternalRegistrationStatus)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
                {trackingStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={externalApplicationId} onChange={(event) => setExternalApplicationId(event.target.value)} placeholder="External application ID (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              <input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Team name (optional)" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              <input type="date" value={submissionDate} onChange={(event) => setSubmissionDate(event.target.value)} aria-label="Submission date" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
              <label className="flex h-10 cursor-pointer items-center rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
                <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(event) => setConfirmationFileName(event.target.files?.[0]?.name ?? "")} />
                {confirmationFileName || "Confirmation file (optional)"}
              </label>
            </div>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Private tracking notes (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <Button
              className="w-full"
              onClick={async () => {
                await setExternalStatus(registrationStatus === "Not Started" ? "Applied Externally" : registrationStatus);
                setNotice("External registration tracking saved. Venture Connect has not verified the organiser status.");
                setTrackingOpen(false);
              }}
            >
              <CheckCircle2 size={16} />
              Save tracking
            </Button>
          </div>
        ) : null}

        {notice ? <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div> : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setSaved((value) => !value);
            void recordOpportunityEvent({ opportunityId: opportunity.id, eventType: "opportunity_saved", referralSource: "opportunity_details" });
          }}
        >
          <Bookmark size={16} />
          {saved ? "Saved" : "Save"}
        </Button>
        <Button variant="secondary" onClick={() => void shareOpportunity()}><Share2 size={16} />Share</Button>
        <Button
          variant="secondary"
          onClick={() => {
            downloadDeadline(opportunity);
            void recordOpportunityEvent({ opportunityId: opportunity.id, eventType: "deadline_reminder_created", referralSource: "opportunity_details" });
            setNotice("Deadline calendar file created.");
          }}
        >
          <CalendarPlus size={16} />
          Add deadline
        </Button>
        <Button variant="secondary" onClick={() => setNotice("Incorrect-information report opened for admin review.")}><Flag size={16} />Report</Button>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Venture Connect lists this opportunity for discovery. Registration, selection, rules and communication are managed by the organiser unless explicitly stated otherwise.
      </p>

      {confirmationOpen ? (
        <ExternalRegistrationDialog
          opportunity={opportunity}
          onCancel={() => setConfirmationOpen(false)}
          onContinue={(destination) => void continueExternally(destination)}
        />
      ) : null}
    </>
  );
}
