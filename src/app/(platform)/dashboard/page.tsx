"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardCheck, Compass, FileText, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, SkeletonCard, StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SponsoredCard } from "@/components/ads/SponsoredCard";
import { getSponsoredCreatives } from "@/lib/data/ads";
import { getApplications } from "@/lib/data/applications";
import { getIdeaWorkspaces } from "@/lib/data/ideaWorkspaces";
import { getOpportunities } from "@/lib/data/opportunities";
import { completionPercent } from "@/lib/templates";
import type { SponsoredCreative } from "@/lib/ads/types";
import type { Application, IdeaWorkspaceItem, Opportunity } from "@/lib/types";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<IdeaWorkspaceItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promotion, setPromotion] = useState<SponsoredCreative | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([getIdeaWorkspaces(), getApplications(), getOpportunities()])
      .then(([workspaceRows, applicationRows, opportunityRows]) => {
        if (!active) return;
        setWorkspaces(workspaceRows);
        setApplications(applicationRows);
        setOpportunities(opportunityRows);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Account data could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void getSponsoredCreatives("dashboard_sidebar").then((items) => {
      if (active) setPromotion(items[0] ?? null);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const activeWorkspaces = useMemo(() => workspaces.filter((workspace) => !workspace.archived), [workspaces]);
  const latestWorkspace = activeWorkspaces[0];
  const upcoming = useMemo(
    () => opportunities
      .filter((opportunity) => opportunity.deadline && opportunity.deadline !== "Rolling")
      .slice(0, 4),
    [opportunities]
  );
  const hasRecords = activeWorkspaces.length > 0 || applications.length > 0 || opportunities.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Founder dashboard"
        title="Prepare the next credible application."
        description="Continue the document that needs work, review relevant deadlines, and track submitted applications from one operational view."
        actions={(
          <Link href="/dashboard/idea-workspace">
            <Button><Lightbulb aria-hidden="true" size={16} />{latestWorkspace ? "Continue workspace" : "Create workspace"}</Button>
          </Link>
        )}
      />

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      {loading ? (
        <div aria-label="Loading founder dashboard" className="grid gap-4 md:grid-cols-2">
          <SkeletonCard className="h-52" />
          <SkeletonCard className="h-52" />
        </div>
      ) : !hasRecords ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <EmptyState
            title="No workspaces or applications yet"
            description="Start with one Idea Workspace. Opportunities and application status will appear after account data is available and you submit a real record."
            icon={FileText}
            action={(
              <Link href="/dashboard/idea-workspace"><Button>Start an Idea Workspace<ArrowRight aria-hidden="true" size={16} /></Button></Link>
            )}
          />
          <Card>
            <CardHeader eyebrow="Getting started" title="Three useful first steps" />
            <ol className="space-y-4 text-sm leading-6 text-slate-600">
              {[
                ["1", "Describe the problem and current workaround."],
                ["2", "Add customer evidence and the proposed solution."],
                ["3", "Review eligibility before starting an application."]
              ].map(([number, text]) => (
                <li key={number} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 font-semibold text-primary">{number}</span><span>{text}</span></li>
              ))}
            </ol>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {latestWorkspace ? (
              <Card>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <Badge tone={latestWorkspace.status === "Complete" ? "green" : "amber"}>{latestWorkspace.status}</Badge>
                    <h2 className="mt-3 truncate text-xl font-semibold">{latestWorkspace.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{latestWorkspace.summary}</p>
                  </div>
                  <Link href="/dashboard/idea-workspace" className="shrink-0"><Button variant="secondary">Open document<ArrowRight aria-hidden="true" size={16} /></Button></Link>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm font-semibold"><span>Required sections</span><span>{completionPercent(latestWorkspace.sections, latestWorkspace.template)}%</span></div>
                  <ProgressBar value={completionPercent(latestWorkspace.sections, latestWorkspace.template)} />
                </div>
              </Card>
            ) : null}

            <Card>
              <CardHeader eyebrow="Applications" title="Recent submissions" action={<Link href="/applications" className="text-sm font-semibold text-primary">View all</Link>} />
              {applications.length ? (
                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {applications.slice(0, 5).map((application) => (
                    <div key={application.id} className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center">
                      <div><p className="text-sm font-semibold">{application.opportunity}</p><p className="mt-1 text-xs text-slate-500">Submitted {application.submittedAt}</p></div>
                      <Badge tone={application.status === "Interested" ? "green" : "blue"}>{application.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm leading-6 text-slate-600">No applications have been submitted.</p>}
            </Card>
          </div>

          <aside className="space-y-4">
            {promotion ? <SponsoredCard creative={promotion} placement="dashboard_sidebar" /> : null}
            <Card>
              <CardHeader eyebrow="Deadlines" title="Relevant opportunities" />
              {upcoming.length ? (
                <div className="space-y-4">
                  {upcoming.map((opportunity) => (
                    <div key={opportunity.id} className="border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                      <p className="text-sm font-semibold">{opportunity.title}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><CalendarClock aria-hidden="true" size={14} />{opportunity.deadline}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm leading-6 text-slate-600">No opportunity deadlines are available.</p>}
              <Link href="/dashboard/opportunities"><Button variant="secondary" className="mt-5 w-full"><Compass aria-hidden="true" size={16} />Explore opportunities</Button></Link>
            </Card>
            <Card>
              <CardHeader eyebrow="Review status" title="Application tracking" />
              <p className="text-sm leading-6 text-slate-600">Status changes come from the relevant programme workflow. Messaging appears only after authorised interest.</p>
              <Link href="/applications"><Button variant="secondary" className="mt-5 w-full"><ClipboardCheck aria-hidden="true" size={16} />Open applications</Button></Link>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
