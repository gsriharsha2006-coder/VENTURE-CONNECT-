"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileChartColumn, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { isStoredVcReportContent } from "@/lib/ai/reportSchema";
import { pilotDemoWorkspaces } from "@/lib/pilot/demo-data";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { getIdeaWorkspaces } from "@/lib/data/ideaWorkspaces";
import { getGeneratedReports, type ReportHistoryItem } from "@/lib/data/reports";
import { downloadReportPdf } from "@/lib/pdf";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { completionPercent, getTemplateDef } from "@/lib/templates";
import type { IdeaWorkspaceItem, VcReportContent } from "@/lib/types";

type Props = { developmentMode: boolean; openaiConfigured: boolean };

export function VcReadinessReportClient({ developmentMode, openaiConfigured }: Props) {
  const supabaseConfigured = isSupabaseConfigured();
  const demoEnabled = isDemoDataEnabled();
  const [workspaces, setWorkspaces] = useState<IdeaWorkspaceItem[]>(demoEnabled ? pilotDemoWorkspaces : []);
  const [workspaceId, setWorkspaceId] = useState("");
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [report, setReport] = useState<VcReportContent | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Select a completed Startup Template to begin.");
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getIdeaWorkspaces(), getGeneratedReports()])
      .then(([workspaceRows, reportRows]) => {
        if (!active) return;
        const activeWorkspaces = workspaceRows.filter((item) => !item.archived);
        const basicReports = reportRows.filter((item) => item.report.reportType === "Basic SWOT Report");
        setWorkspaces(activeWorkspaces);
        setWorkspaceId(activeWorkspaces[0]?.id ?? "");
        setHistory(basicReports);
        setReport(basicReports[0]?.report ?? null);
        setStatus(basicReports.length ? "Your saved pilot report is available below." : "Select a completed Startup Template to begin.");
      })
      .catch(() => setStatus("Report data could not be loaded. Refresh and try again."));
    return () => { active = false; };
  }, []);

  const workspace = workspaces.find((item) => item.id === workspaceId) ?? workspaces[0];
  const completion = workspace ? completionPercent(workspace.sections, "startup") : 0;
  const documentReady = Boolean(workspace && completion === 100 && workspace.status === "Complete");
  const reportAlreadyGenerated = history.length > 0;
  const canGenerate = documentReady && confirmed && !reportAlreadyGenerated && !loading;

  async function refreshHistory() {
    const reports = (await getGeneratedReports()).filter((item) => item.report.reportType === "Basic SWOT Report");
    setHistory(reports);
    setReport(reports[0]?.report ?? null);
  }

  async function generate() {
    if (!workspace || !canGenerate || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setStatus("Generating and validating your report...");
    try {
      const requestId = window.crypto.randomUUID();
      const body = supabaseConfigured
        ? { requestId, workspaceId: workspace.id, reportType: "Basic SWOT Report" }
        : { requestId, workspaceId: workspace.id, reportType: "Basic SWOT Report", prototypeWorkspace: { name: workspace.name, template: "startup", sections: workspace.sections } };
      const response = await fetch("/api/reports/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json() as { report?: unknown; persistence?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The report could not be generated.");
      if (!isStoredVcReportContent(payload.report)) throw new Error("The structured report was invalid and was not saved.");
      setReport(payload.report);
      if (payload.persistence === "permanent") await refreshHistory();
      setStatus(payload.persistence === "permanent" ? "Report generated and saved. Reopening this page will not regenerate it." : "Development sample generated. It is temporary and does not use the pilot allowance.");
    } catch (reason) {
      setStatus(reason instanceof Error ? reason.message : "The report could not be generated. No allowance was consumed.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  function download() {
    if (!report || !workspace) return;
    downloadReportPdf({
      filename: `vc-readiness-report-${workspace.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: "VC Readiness Report",
      subtitle: `${workspace.name} / Startup Template`,
      scores: [{ label: "Overall readiness", value: report.overallScore }],
      sections: [{ title: "Readiness summary", lines: [report.summary ?? ""] }, ...report.sections.map((section) => ({ title: section.title, lines: [section.body ?? "", ...(section.items ?? []), typeof section.score === "number" ? `Score: ${section.score}/100` : ""].filter(Boolean) })), { title: "Five priority improvements", lines: report.improvementSuggestions.slice(0, 5) }]
    });
  }

  if (!supabaseConfigured && !demoEnabled) {
    return <div className="space-y-5"><PageHeader eyebrow="VC Readiness Report" title="Account connection required" description="Sign in with the configured pilot backend to load your Startup Template." /><EmptyState icon={LockKeyhole} title="Report unavailable" description="No sample founder data is substituted in production mode." action={<Link href="/dashboard/idea-workspace"><Button variant="secondary">Return to Idea Workspace</Button></Link>} /></div>;
  }

  return (
    <div className="min-w-0 space-y-5">
      {developmentMode && !openaiConfigured ? <StatusMessage>Development mode: reports use temporary sample output until the configured model endpoint is available.</StatusMessage> : null}
      <PageHeader eyebrow="VC Readiness Report" title="One basic readiness report for the pilot" description="Generate an educational readiness review from one completed Startup Template. The saved result reopens without another model call." />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Step 1" title="Select your startup idea" />
            <label htmlFor="report-workspace" className="text-sm font-semibold text-slate-700">Completed Startup Template</label>
            <select id="report-workspace" value={workspaceId} onChange={(event) => { setWorkspaceId(event.target.value); setConfirmed(false); }} disabled={!workspaces.length || reportAlreadyGenerated} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"><option value="">Select a startup idea</option>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3 text-sm font-semibold"><span>{workspace?.name ?? "No startup selected"}</span><span>{completion}%</span></div><ProgressBar value={completion} className="mt-3" /><p className="mt-3 text-sm text-slate-600">Status: {workspace?.status ?? "Not selected"}. {documentReady ? "Ready for analysis." : "Complete every section and mark the document Complete first."}</p></div>
          </Card>

          <Card>
            <CardHeader eyebrow="Step 2" title="Review what will be analysed" />
            {workspace ? <dl className="grid gap-3 sm:grid-cols-2">{getTemplateDef("startup").sections.map((section) => <div key={section.key} className="rounded-lg border border-slate-200 p-3"><dt className="text-sm font-semibold">{section.label}</dt><dd className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">{workspace.sections[section.key] || "Not completed"}</dd></div>)}</dl> : <p className="text-sm text-slate-600">Select a startup idea to review its sections.</p>}
          </Card>

          {report ? <Card>
            <div className="flex flex-wrap items-start justify-between gap-3"><CardHeader eyebrow="Saved result" title={report.startupName || workspace?.name || "VC Readiness Report"} /><Button variant="secondary" onClick={download}><Download size={16} />Export PDF</Button></div>
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]"><div className="rounded-xl bg-slate-950 p-5 text-white"><p className="text-xs uppercase tracking-wide text-slate-300">Overall readiness</p><p className="mt-2 text-4xl font-semibold">{report.overallScore}</p><p className="mt-2 text-sm text-slate-300">{report.finalRecommendation}</p></div><div><h2 className="font-semibold">Short readiness summary</h2><p className="mt-2 text-sm leading-6 text-slate-600">{report.summary}</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{report.sections.filter((section) => typeof section.score === "number").map((section) => <div key={section.title} className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">{section.title}</p><p className="mt-1 text-xl font-semibold">{section.score}/100</p></div>)}</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">{report.sections.filter((section) => section.items?.length).map((section) => <section key={section.title} className="rounded-lg border border-slate-200 p-4"><h2 className="font-semibold">{section.title}</h2><ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">{section.items?.slice(0, 5).map((item) => <li key={item}>• {item}</li>)}</ul></section>)}</div>
            <section className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4"><h2 className="font-semibold text-blue-950">Five priority improvements</h2><ol className="mt-2 space-y-2 text-sm leading-6 text-blue-900">{report.improvementSuggestions.slice(0, 5).map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></section>
            <p className="mt-4 text-xs leading-5 text-slate-500">This report is educational and is not investment advice, a funding recommendation, or an incubation decision.</p>
          </Card> : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card><CardHeader eyebrow="Step 3" title="Confirm and generate" /><div className="space-y-3 text-sm"><p><strong>Startup:</strong> {workspace?.name ?? "Not selected"}</p><p><strong>Report allowance:</strong> {reportAlreadyGenerated ? "Used" : "One report available"}</p><p><strong>Report:</strong> Basic VC Readiness Report</p></div>
            {!reportAlreadyGenerated ? <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span>I confirm that the selected Startup Template is accurate and understand that the report is educational, not investment advice.</span></label> : <StatusMessage tone="success" className="mt-5">Your one pilot report is saved. Refreshing or reopening this page will not regenerate it.</StatusMessage>}
            <Button className="mt-4 min-h-12 w-full" onClick={() => void generate()} disabled={!canGenerate}><FileChartColumn size={17} />{loading ? "Generating report..." : reportAlreadyGenerated ? "Pilot report already generated" : "Generate VC Readiness Report"}</Button>
            {!documentReady && !reportAlreadyGenerated ? <p className="mt-3 text-sm text-slate-600">Complete and mark the Startup Template Complete before generating.</p> : null}
            <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-5 text-blue-900">{status}</p>
          </Card>
          <Card><CardHeader eyebrow="Report history" title="Saved pilot report" />{history.length ? <button type="button" onClick={() => setReport(history[0].report)} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><div className="flex items-center justify-between"><Badge>VC Readiness Report</Badge><strong>{history[0].report.overallScore}/100</strong></div><p className="mt-2 text-sm text-slate-600">{history[0].workspaceName}</p></button> : <p className="text-sm leading-6 text-slate-600">Your saved report will appear here after successful generation.</p>}</Card>
        </aside>
      </div>
    </div>
  );
}
