"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, FileChartColumn, LockKeyhole, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useDemoPlan } from "@/hooks/useDemoPlan";
import { ideaWorkspaces, reportSuite } from "@/lib/data";
import { saveGeneratedReport } from "@/lib/data/reports";
import { downloadReportPdf } from "@/lib/pdf";
import { computeEntitlements } from "@/lib/subscription/plans";
import { completionPercent, getTemplateDef } from "@/lib/templates";
import type { IdeaWorkspaceItem, Profile, ReportType, VcReportContent } from "@/lib/types";

type ReportHistoryItem = {
  id: string;
  workspaceName: string;
  report: VcReportContent;
};

export default function VcReadinessReportPage() {
  const [workspace, setWorkspace] = useState<IdeaWorkspaceItem>(ideaWorkspaces[0]);
  const [reportType, setReportType] = useState<ReportType>("Basic SWOT Report");
  const [report, setReport] = useState<VcReportContent | null>(null);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [status, setStatus] = useState("Select an Idea Workspace document and generate a VC Readiness Report.");
  const [loading, setLoading] = useState(false);
  const [freeUsedInSession, setFreeUsedInSession] = useState(false);
  const [plan, setPlan] = useDemoPlan();

  useEffect(() => {
    const stored = window.localStorage.getItem("venture-connect-active-workspace");
    if (stored) {
      try {
        setWorkspace(JSON.parse(stored) as IdeaWorkspaceItem);
      } catch {
        /* use seed */
      }
    }
    const storedHistory = window.localStorage.getItem("venture-connect-report-history");
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory) as ReportHistoryItem[]);
      } catch {
        /* use empty history */
      }
    }
    setFreeUsedInSession(window.localStorage.getItem("venture-connect-free-swot-used") === "true");
  }, []);

  const profile = useMemo<Profile>(() => ({
    id: "prototype-founder",
    full_name: "Prototype Founder",
    email: "prototype@venture-connect.local",
    role: "Founder",
    plan,
    free_report_used: freeUsedInSession,
    reports_used_this_month: history.filter((item) => item.report.tier === "premium").length
  }), [freeUsedInSession, history, plan]);
  const entitlements = useMemo(() => computeEntitlements(profile), [profile]);
  const suiteItem = reportSuite.find((item) => item.title === reportType) ?? reportSuite[0];
  const template = getTemplateDef(workspace.template);
  const completion = completionPercent(workspace.sections, workspace.template);
  const reportUnlocked = reportType === "Basic SWOT Report" || entitlements.reportTypes.includes(reportType);
  const freeAvailable = entitlements.freeReportAvailable && !freeUsedInSession;

  const reportOptions = useMemo(
    () => reportSuite.map((item) => ({ ...item, locked: item.title !== "Basic SWOT Report" && !entitlements.reportTypes.includes(item.title) })),
    [entitlements.reportTypes]
  );

  async function handleGenerate() {
    if (reportType === "Basic SWOT Report" && !freeAvailable) {
      setStatus("Free Basic SWOT Report is one-time only. Upgrade to Student Pro or Founder Pro for premium reports.");
      return;
    }
    if (!reportUnlocked) {
      setStatus(`${reportType} requires ${suiteItem.plan}.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id.startsWith("workspace-") ? undefined : workspace.id,
          workspaceName: workspace.name,
          template: workspace.template,
          sections: workspace.sections,
          reportType
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || "Report generation failed.");
        return;
      }
      setReport(data.report);
      const nextHistory = [
        { id: `report-${Date.now()}`, workspaceName: workspace.name, report: data.report as VcReportContent },
        ...history
      ];
      setHistory(nextHistory);
      window.localStorage.setItem("venture-connect-report-history", JSON.stringify(nextHistory));
      if (!data.savedReport) {
        void saveGeneratedReport({
          ideaWorkspaceId: workspace.id.startsWith("workspace-") ? null : workspace.id,
          report: data.report as VcReportContent
        });
      }
      if (reportType === "Basic SWOT Report") {
        setFreeUsedInSession(true);
        window.localStorage.setItem("venture-connect-free-swot-used", "true");
      }
      setStatus(`Generated ${reportType} via ${data.provider}.`);
    } catch {
      setStatus("Report generation failed. The mock fallback should work without API keys; check the server route.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!report) return;
    downloadReportPdf({
      filename: `${report.reportType.replace(/\s+/g, "-").toLowerCase()}-${workspace.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: report.reportType,
      subtitle: `${workspace.name} / ${template.label}`,
      scores: [{ label: "Report score", value: report.overallScore }],
      sections: report.sections.map((section) => ({
        title: section.title,
        lines: [
          section.body ?? "",
          ...(section.items ?? []),
          typeof section.score === "number" ? `Score: ${section.score}/100` : ""
        ].filter(Boolean)
      }))
    });
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <Badge>
          <FileChartColumn size={13} />
          VC Readiness Report
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">AI-generated readiness reports from founder documents</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          AI only generates reports from the selected Idea Workspace. It does not provide live hints, chat assistance, or unrestricted coaching.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            aria-label="Demo subscription plan"
            value={plan}
            onChange={(event) => {
              setPlan(event.target.value as "Free" | "Student Pro" | "Founder Pro");
              setReportType("Basic SWOT Report");
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold"
          >
            <option>Free</option>
            <option>Student Pro</option>
            <option>Founder Pro</option>
          </select>
          <Badge tone="slate">{entitlements.plan}</Badge>
          <Badge tone={freeAvailable ? "green" : "amber"}>Free SWOT: {freeAvailable ? "available" : "used"}</Badge>
          <Badge>{entitlements.reportsRemaining} premium reports left</Badge>
        </div>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Document" title="Report input" />
            <select
              value={workspace.id}
              onChange={(event) => {
                const selected = ideaWorkspaces.find((item) => item.id === event.target.value) ?? ideaWorkspaces[0];
                setWorkspace(selected);
                window.localStorage.setItem("venture-connect-active-workspace", JSON.stringify(selected));
              }}
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none"
            >
              {ideaWorkspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex justify-between text-sm font-semibold">
                <span>{template.label}</span>
                <span>{completion}%</span>
              </div>
              <ProgressBar value={completion} className="mt-3" />
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Report Type" title="Choose output" />
            <div className="space-y-2">
              {reportOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReportType(item.title)}
                  className={`w-full rounded-lg border p-3 text-left transition ${reportType === item.title ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.locked ? <LockKeyhole size={15} className="text-slate-400" /> : <Badge tone="green">Ready</Badge>}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.subtitle}</p>
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <div className="space-y-4">
          <Card>
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <Badge tone={reportUnlocked ? "green" : "amber"}>{suiteItem.plan}</Badge>
                <h2 className="mt-3 text-2xl font-semibold">{reportType}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{suiteItem.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {suiteItem.sections.map((section) => <Badge key={section} tone="slate">{section}</Badge>)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!reportUnlocked ? (
                  <Link href="/pricing">
                    <Button variant="secondary">
                      <LockKeyhole size={16} />
                      Upgrade
                    </Button>
                  </Link>
                ) : null}
                <Button onClick={handleGenerate} disabled={loading || !reportUnlocked}>
                  {reportType === "Basic SWOT Report" ? <Wand2 size={16} /> : <Sparkles size={16} />}
                  {loading ? "Generating..." : "Generate report"}
                </Button>
              </div>
            </div>
            <p className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">{status}</p>
          </Card>

          {report ? (
            <Card>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <Badge>{report.reportType}</Badge>
                  <h2 className="mt-3 text-2xl font-semibold">Saved report preview</h2>
                  <p className="mt-2 text-5xl font-semibold">{report.overallScore}<span className="text-lg text-slate-500">/100</span></p>
                  <ProgressBar value={report.overallScore} className="mt-4 max-w-xs" />
                  <p className="mt-3 text-sm font-semibold text-primary">{report.finalRecommendation}</p>
                </div>
                <Button variant="secondary" onClick={handleDownload}>
                  <Download size={16} />
                  Export PDF
                </Button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {report.sections.map((section) => (
                  <div key={section.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{section.title}</h3>
                      {typeof section.score === "number" ? <Badge>{section.score}/100</Badge> : null}
                    </div>
                    {section.body ? <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p> : null}
                    {section.items?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {section.items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <h3 className="font-semibold text-blue-900">Improvement suggestions</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {report.improvementSuggestions.map((suggestion) => (
                    <p key={suggestion} className="rounded-lg bg-white p-3 text-sm leading-6 text-blue-900">{suggestion}</p>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader eyebrow="Saved" title="Report history" />
            {history.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReport(item.report)}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge>{item.report.reportType}</Badge>
                      <span className="text-lg font-semibold text-primary">{item.report.overallScore}/100</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{item.workspaceName}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(item.report.generatedAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Generated reports will be saved here for this prototype browser session.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
