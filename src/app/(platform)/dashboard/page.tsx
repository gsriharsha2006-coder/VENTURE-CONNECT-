"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  CalendarCheck2,
  FileChartColumn,
  Lightbulb,
  LockKeyhole,
  MessagesSquare,
  Send
} from "lucide-react";
import { ApplicationMethodBadge } from "@/components/opportunities/ApplicationMethodBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { applications, dashboardStats, externalRegistrations, ideaWorkspaces, messageThreads, opportunities, reportSuite } from "@/lib/data";
import { getBadgesForWorkspace, validationBookings } from "@/lib/data/validations";
import { completionPercent, missingRequiredSections } from "@/lib/templates";

export default function DashboardPage() {
  const latest = ideaWorkspaces[0];
  const completion = completionPercent(latest.sections, latest.template);
  const missing = missingRequiredSections(latest.sections, latest.template);
  const canApply = completion === 100;
  const interestedThread = messageThreads[0];
  const latestBadges = getBadgesForWorkspace(latest.id);
  const upcomingValidation = validationBookings.find((booking) => booking.status !== "Validation Completed") ?? validationBookings[0];
  const hackathons = opportunities.filter((opportunity) => opportunity.opportunity_type === "Hackathon");
  const savedHackathons = hackathons.filter((opportunity) => opportunity.saved);
  const externallyAppliedHackathons = externalRegistrations.filter((registration) =>
    hackathons.some((opportunity) => opportunity.id === registration.opportunity_id)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Founder dashboard"
        title="Build, validate, apply, then unlock conversations."
        description="Use structured documents for internal applications and discover organiser-managed hackathons through their official registration flows."
        actions={
          <>
          <Link href="/dashboard/idea-workspace" className="flex">
            <Button>
              <Lightbulb size={16} />
              Open Idea Workspace
            </Button>
          </Link>
          <Link href="/dashboard/opportunities" className="flex">
            <Button variant="secondary">
              <Send size={16} />
              Explore opportunities
            </Button>
          </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <CardHeader eyebrow="Latest Idea Workspace" title={latest.name} className="mb-2" />
                <p className="max-w-3xl text-sm leading-6 text-slate-600">{latest.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={latest.status === "Complete" ? "green" : "amber"}>{latest.status}</Badge>
                  <Badge>{latest.template}</Badge>
                  {latest.video_link ? <Badge tone="slate">Video link attached</Badge> : null}
                  {latestBadges.length ? <Badge tone="green">Human Reviewed</Badge> : null}
                </div>
              </div>
              <div className="min-w-56 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Completion</span>
                  <span>{completion}%</span>
                </div>
                <ProgressBar value={completion} className="mt-3" />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {canApply ? "This document can be used for internal investor, incubator, accelerator, and partnered challenge applications." : "Complete required sections before internal applications."}
                </p>
              </div>
            </div>
            {!canApply ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Complete your Idea Workspace document before applying. Missing: {missing.map((section) => section.label).join(", ")}.
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader eyebrow="Recent Opportunities" title="Relevant posts" action={<Link href="/dashboard/opportunities" className="text-sm font-semibold text-primary">View all</Link>} />
              <div className="space-y-3">
                {opportunities.slice(0, 3).map((opportunity) => (
                  <div key={opportunity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{opportunity.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{opportunity.organizer_name} / {opportunity.deadline}</p>
                        <div className="mt-2"><ApplicationMethodBadge method={opportunity.application_method} /></div>
                      </div>
                      {opportunity.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Review</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader eyebrow="Recent Reports" title="Report history" action={<Link href="/dashboard/vc-readiness" className="text-sm font-semibold text-primary">Generate</Link>} />
              <div className="space-y-3">
                {reportSuite.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <FileChartColumn size={18} className="text-primary" />
                      <div>
                        <p className="text-sm font-semibold">{report.title}</p>
                        <p className="text-xs text-slate-500">{report.plan}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">{report.score}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader eyebrow="Hackathons" title="Upcoming deadlines" action={<Link href="/dashboard/opportunities" className="text-sm font-semibold text-primary">Discover</Link>} />
              <div className="space-y-3">
                {hackathons.map((opportunity) => (
                  <div key={opportunity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold">{opportunity.title}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><CalendarClock size={14} className="text-primary" />Registration deadline {opportunity.deadline}</p>
                    <p className="mt-2 text-xs font-semibold text-blue-700">External Registration</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader eyebrow="Saved hackathons" title="Return to registration" />
              {savedHackathons.length ? (
                <div className="space-y-3">
                  {savedHackathons.map((opportunity) => (
                    <div key={opportunity.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <Bookmark size={16} className="mt-0.5 text-primary" />
                      <div><p className="text-sm font-semibold">{opportunity.title}</p><p className="mt-1 text-xs text-slate-500">{opportunity.organizer_name}</p></div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-600">No saved hackathons yet.</p>}
            </Card>
            <Card>
              <CardHeader eyebrow="Tracked by You" title="Externally applied hackathons" action={<Link href="/applications" className="text-sm font-semibold text-primary">Open tracker</Link>} />
              <div className="space-y-3">
                {externallyAppliedHackathons.map((registration) => (
                  <div key={registration.id} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <Badge tone="slate">{registration.status}</Badge>
                    <p className="mt-3 text-sm font-semibold">{registration.opportunity_title}</p>
                    <p className="mt-1 text-xs text-slate-500">Founder-tracked / not organiser verified</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader eyebrow="Venture Connect" title="Investor and incubator applications" action={<Link href="/applications" className="text-sm font-semibold text-primary">Open applications</Link>} />
              <div className="space-y-3">
                {applications.map((application) => (
                  <div key={application.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <Badge tone={application.status === "Interested" ? "green" : application.status === "Rejected" ? "red" : "blue"}>{application.status}</Badge>
                    <p className="mt-3 text-sm font-semibold">{application.opportunity}</p>
                    <p className="mt-1 text-xs text-slate-500">{application.submittedAt}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Recommended Next Action" title="Apply with your completed Startup Template" />
            <p className="text-sm leading-6 text-slate-600">
              Complete your Startup Template to apply for investor opportunities. Your current primary document is complete, so BluePeak office hours is ready.
            </p>
            <Link href="/dashboard/opportunities">
              <Button className="mt-4 w-full">
                Review opportunities
                <ArrowRight size={16} />
              </Button>
            </Link>
          </Card>

          <Card>
            <CardHeader eyebrow="Message Access" title="Interest-gated status" />
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                {interestedThread.founderPlan === "Free" ? <LockKeyhole size={16} /> : <MessagesSquare size={16} />}
                {interestedThread.status}
              </div>
              <p className="mt-2 text-sm leading-6 text-blue-800">{interestedThread.lastMessage}</p>
            </div>
            <Link href="/dashboard/messages">
              <Button variant="secondary" className="mt-4 w-full">
                Open messages
              </Button>
            </Link>
          </Card>

          <Card>
            <CardHeader eyebrow="Validation" title="Upcoming human review" />
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <CalendarCheck2 size={16} />
                {upcomingValidation.workspace.startupName}
              </div>
              <p className="mt-2 text-sm leading-6 text-blue-800">{upcomingValidation.status} / {upcomingValidation.serviceType}</p>
            </div>
            <Link href={`/dashboard/validation-hub/workspace/${upcomingValidation.id}`}>
              <Button variant="secondary" className="mt-4 w-full">
                Open validation workspace
              </Button>
            </Link>
          </Card>

          <Card>
            <CardHeader eyebrow="Trust" title="Application readiness rules" />
            <div className="space-y-3 text-sm text-slate-600">
              {["External hackathon registration never requires an Idea Workspace document.", "Internal investor and programme applications require an eligible Idea Workspace document.", "Human-reviewed badges require a completed validator report and approved document version.", "Free founders see interest but not full chat or meeting links."].map((item) => (
                <p key={item} className="flex gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  {item}
                </p>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
