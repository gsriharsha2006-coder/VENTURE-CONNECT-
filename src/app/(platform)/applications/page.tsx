"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ClipboardList, FileChartColumn, Lightbulb, MessagesSquare, Save, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { applications as seedApplications } from "@/lib/data";
import type { ApplicationStatus } from "@/lib/types";

const actions: Array<{ label: string; status: ApplicationStatus; icon: typeof CheckCircle2; tone: "primary" | "secondary" }> = [
  { label: "Under Review", status: "Under Review", icon: ClipboardList, tone: "secondary" },
  { label: "Save", status: "Saved by Investor", icon: Save, tone: "secondary" },
  { label: "Interested", status: "Interested", icon: MessagesSquare, tone: "primary" },
  { label: "Shortlist", status: "Shortlisted", icon: CheckCircle2, tone: "secondary" },
  { label: "Reject", status: "Rejected", icon: XCircle, tone: "secondary" }
];

function statusTone(status: ApplicationStatus) {
  if (status === "Rejected") return "red";
  if (status === "Interested" || status === "Shortlisted") return "green";
  if (status === "Saved by Investor") return "amber";
  return "blue";
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState(seedApplications);
  const [selectedId, setSelectedId] = useState(seedApplications[0].id);
  const selected = applications.find((application) => application.id === selectedId) ?? applications[0];

  function updateStatus(status: ApplicationStatus) {
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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <Badge>
          <ClipboardList size={13} />
          Applications
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Structured application review trail</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Track founder submissions, review status, Idea Workspace attachment, report summary, and messaging unlock after Interested.
        </p>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader eyebrow="Queue" title="Applications" />
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

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { label: "Idea Workspace", icon: Lightbulb, text: selected.idea_workspace_id ? "Completed document attached." : "Event application, document optional." },
              { label: "VC Readiness Report", icon: FileChartColumn, text: "Report score and summary visible to reviewers." },
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
              When a reviewer marks Interested, the founder receives a notification and a conversation thread is created. Free founders see interest and short feedback but cannot access full chat or meeting links.
            </p>
            <Link href="/dashboard/messages">
              <Button variant="secondary" className="mt-4">Open messages</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
