"use client";

import { motion } from "framer-motion";
import { Download, FileText, PlayCircle, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { aiReport, ideaWorkspaces, trendingStartups } from "@/lib/data";
import { completionPercent } from "@/lib/templates";

const startup = trendingStartups[0];
const workspace = ideaWorkspaces[0];

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex items-start gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-xl font-bold text-white shadow-panel">{startup.logo}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">{startup.name}</h1>
                <Badge tone="green">
                  <ShieldCheck size={13} />
                  Verified startup
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {startup.founder}, {startup.role} / {startup.location} / {startup.industry}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{startup.shortDescription}</p>
            </div>
          </div>
          <Button>
            <Download size={16} />
            Export application packet
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Founder Profile" title="Startup overview" />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Stage", startup.stage],
                ["Funding ask", startup.ask],
                ["Traction", startup.traction],
                ["Monthly growth", startup.monthlyGrowth],
                ["Active users", startup.activeUsers],
                ["Retention", startup.retention]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Application Assets" title="Attached packet items" />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Idea Workspace", value: `${completionPercent(workspace.sections, workspace.template)}% complete`, icon: FileText },
                { label: "One-minute video", value: startup.demoVideo, icon: PlayCircle },
                { label: "VC Readiness Report", value: `${aiReport.readiness}/100 readiness`, icon: UserRound }
              ].map((asset) => {
                const Icon = asset.icon;
                return (
                  <div key={asset.label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <Icon size={20} className="text-primary" />
                    <p className="mt-4 text-sm font-semibold text-slate-950">{asset.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{asset.value}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Readiness" title="Investor score summary" />
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
              <p className="text-5xl font-semibold text-blue-950">{aiReport.readiness}</p>
              <ProgressBar value={aiReport.readiness} className="mt-5 bg-white" />
              <p className="mt-4 text-sm leading-6 text-blue-900">{aiReport.market}</p>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Trust" title="Profile governance" />
            <div className="space-y-3 text-sm text-slate-700">
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Trust score: 82/100</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Plan: Free</p>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Messaging: locked until interest and paid plan access</p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
