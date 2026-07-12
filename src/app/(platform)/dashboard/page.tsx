"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileChartColumn,
  Lightbulb,
  LockKeyhole,
  MessagesSquare,
  Send,
  Store
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { applications, dashboardStats, ideaWorkspaces, messageThreads, opportunities, reportSuite, servicePosts } from "@/lib/data";
import { completionPercent, missingRequiredSections } from "@/lib/templates";

export default function DashboardPage() {
  const latest = ideaWorkspaces[0];
  const completion = completionPercent(latest.sections, latest.template);
  const missing = missingRequiredSections(latest.sections, latest.template);
  const canApply = completion === 100;
  const interestedThread = messageThreads[0];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center"
      >
        <div>
          <Badge>Founder Home</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Build, validate, apply, then unlock conversations.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Venture Connect keeps the founder workflow focused: Idea Workspace, VC Readiness Report, structured applications, and interest-gated messaging.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/idea-workspace">
            <Button>
              <Lightbulb size={16} />
              Open Idea Workspace
            </Button>
          </Link>
          <Link href="/dashboard/opportunities">
            <Button variant="secondary">
              <Send size={16} />
              Apply
            </Button>
          </Link>
        </div>
      </motion.div>

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
                </div>
              </div>
              <div className="min-w-56 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Completion</span>
                  <span>{completion}%</span>
                </div>
                <ProgressBar value={completion} className="mt-3" />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {canApply ? "This document can be used for investor, incubator, hackathon, and challenge applications." : "Complete required sections before applying."}
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

          <Card>
            <CardHeader eyebrow="Applications" title="Status trail" action={<Link href="/dashboard/opportunities" className="text-sm font-semibold text-primary">Open applications</Link>} />
            <div className="grid gap-3 lg:grid-cols-3">
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
            <CardHeader eyebrow="Services" title="Verified provider shortcut" />
            <div className="space-y-3">
              {servicePosts.slice(0, 2).map((post) => (
                <div key={post.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Store size={16} className="text-primary" />
                    <p className="text-sm font-semibold">{post.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Starts at Rs {post.original_price.toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <Link href="/dashboard/services">
              <Button variant="secondary" className="mt-4 w-full">
                Browse services
              </Button>
            </Link>
          </Card>

          <Card>
            <CardHeader eyebrow="Trust" title="Application readiness rules" />
            <div className="space-y-3 text-sm text-slate-600">
              {["Investor/incubator/hackathon applications require a complete Idea Workspace document.", "Events can be applied to directly after reading guidelines.", "Free founders see interest but not full chat or meeting links."].map((item) => (
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
