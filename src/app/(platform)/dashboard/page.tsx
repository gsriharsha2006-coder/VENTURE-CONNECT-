"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ClipboardCheck, FileChartColumn, Lightbulb, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonCard, StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getApplications } from "@/lib/data/applications";
import { getIdeaWorkspaces } from "@/lib/data/ideaWorkspaces";
import { getOpportunities } from "@/lib/data/opportunities";
import { getGeneratedReports, type ReportHistoryItem } from "@/lib/data/reports";
import { completionPercent } from "@/lib/templates";
import type { Application, IdeaWorkspaceItem, Opportunity } from "@/lib/types";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<IdeaWorkspaceItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([getIdeaWorkspaces(), getApplications(), getOpportunities(), getGeneratedReports()])
      .then(([workspaceRows, applicationRows, opportunityRows, reportRows]) => {
        if (!active) return;
        setWorkspaces(workspaceRows);
        setApplications(applicationRows);
        setOpportunities(opportunityRows);
        setReports(reportRows);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Pilot overview could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const currentIdea = workspaces.find((item) => !item.archived);
  const recentApplication = applications[0];
  const upcomingHackathon = useMemo(() => opportunities.filter((item) => item.opportunity_type === "Hackathon").sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))[0], [opportunities]);
  const latestReport = reports[0];
  const interested = applications.find((item) => item.status === "Interested");
  const completion = currentIdea ? completionPercent(currentIdea.sections, "startup") : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Founder / Student overview"
        title="Continue your pilot work"
        description="A compact summary of the four pilot workflows. Use the primary navigation for detailed work."
        actions={<Link href="/dashboard/idea-workspace"><Button><Lightbulb size={16} />{currentIdea ? "Continue Idea Workspace" : "Create Startup Idea"}</Button></Link>}
      />
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} className="h-40" />)}</div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="flex min-h-44 flex-col"><Lightbulb size={20} className="text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Current idea completion</p><p className="mt-2 font-semibold">{currentIdea?.name ?? "No startup idea yet"}</p><div className="mt-3"><ProgressBar value={completion} /></div><p className="mt-2 text-xs text-slate-500">{completion}% complete</p></Card>
          <Card className="flex min-h-44 flex-col"><ClipboardCheck size={20} className="text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent application</p><p className="mt-2 font-semibold">{recentApplication?.opportunity ?? "No submitted application"}</p><Badge tone="slate" className="mt-3 w-fit">{recentApplication?.status ?? "Not started"}</Badge></Card>
          <Card className="flex min-h-44 flex-col"><CalendarClock size={20} className="text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming hackathon</p><p className="mt-2 font-semibold">{upcomingHackathon?.title ?? "No published deadline"}</p><p className="mt-3 text-sm text-slate-600">{upcomingHackathon?.deadline ?? "Check Opportunities for updates."}</p></Card>
          <Card className="flex min-h-44 flex-col"><FileChartColumn size={20} className="text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Latest readiness result</p><p className="mt-2 font-semibold">{latestReport ? `${latestReport.report.overallScore}/100` : "Not generated"}</p><p className="mt-3 text-sm text-slate-600">{latestReport?.report.finalRecommendation ?? "One basic report is available for the pilot."}</p></Card>
          <Card className="flex min-h-44 flex-col"><MessageSquare size={20} className="text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Incubation interest</p><p className="mt-2 font-semibold">{interested ? "An incubator is interested" : "No interest notification"}</p><p className="mt-3 text-sm text-slate-600">{interested ? "Open Messages to continue the permitted conversation." : "Messaging opens after Interested or Request Information."}</p></Card>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Idea Workspace", "/dashboard/idea-workspace"],
          ["Opportunities", "/dashboard/opportunities"],
          ["VC Readiness Report", "/dashboard/vc-readiness"],
          ["Messages", "/dashboard/messages"]
        ].map(([label, href]) => <Link key={href} href={href}><Button variant="secondary" className="w-full justify-between">{label}<ArrowRight size={15} /></Button></Link>)}
      </div>
    </div>
  );
}
