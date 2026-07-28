"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, LockKeyhole, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useDemoPlan } from "@/hooks/useDemoPlan";
import { isStoredVcReportContent } from "@/lib/ai/reportSchema";
import { ideaWorkspaces as mockIdeaWorkspaces, reportSuite } from "@/lib/data";
import { getIdeaWorkspaces } from "@/lib/data/ideaWorkspaces";
import { getGeneratedReports, type ReportHistoryItem } from "@/lib/data/reports";
import { getSubscriptionUsage } from "@/lib/data/subscriptions";
import { downloadReportPdf } from "@/lib/pdf";
import { computeEntitlements } from "@/lib/subscription/plans";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { completionPercent, getTemplateDef } from "@/lib/templates";
import type { IdeaWorkspaceItem, Profile, ReportType, VcReportContent } from "@/lib/types";

type Props = {
  developmentMode: boolean;
  openaiConfigured: boolean;
};

export function VcReadinessReportClient({ developmentMode, openaiConfigured }: Props) {
  const supabaseConfigured = isSupabaseConfigured();
  const [workspaceOptions, setWorkspaceOptions] = useState<IdeaWorkspaceItem[]>(supabaseConfigured ? [] : mockIdeaWorkspaces);
  const [workspace, setWorkspace] = useState<IdeaWorkspaceItem | null>(supabaseConfigured ? null : mockIdeaWorkspaces[0]);
  const [reportType, setReportType] = useState<ReportType>("Basic SWOT Report");
  const [report, setReport] = useState<VcReportContent | null>(null);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [status, setStatus] = useState("Select a completed Idea Workspace document and generate a VC Readiness Report.");
  const [loading, setLoading] = useState(false);
  const [reportSource, setReportSource] = useState<"openai" | "mock" | null>(null);
  const freeUsedInSession = false;
  const [liveUsage, setLiveUsage] = useState<Awaited<ReturnType<typeof getSubscriptionUsage>> | null>(null);
  const [demoPlan, setDemoPlan] = useDemoPlan();
  const generationInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (supabaseConfigured) {
      Promise.all([getIdeaWorkspaces(), getGeneratedReports(), getSubscriptionUsage()])
        .then(([workspaces, savedReports, usage]) => {
          if (cancelled) return;
          const active = workspaces.filter((item) => !item.archived);
          setWorkspaceOptions(active);
          setWorkspace(active[0] ?? null);
          setHistory(savedReports);
          setLiveUsage(usage);
          setStatus(active.length
            ? "Select a completed Idea Workspace document and generate a VC Readiness Report."
            : "Create and complete an Idea Workspace document before generating a report.");
        })
        .catch(() => {
          if (!cancelled) setStatus("We could not load your report data. Please refresh and try again.");
        });
      return () => {
        cancelled = true;
      };
    }

    const stored = window.localStorage.getItem("venture-connect-active-workspace");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as IdeaWorkspaceItem;
        setWorkspace(parsed);
      } catch {
        // Keep the deterministic development workspace.
      }
    }
    const storedHistory = window.localStorage.getItem("venture-connect-report-history");
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory) as ReportHistoryItem[];
        setHistory(parsed.filter((item) => isStoredVcReportContent(item.report)));
      } catch {
        // Keep an empty development history.
      }
    }
    return () => {
      cancelled = true;
    };
  }, [supabaseConfigured]);

  const prototypeProfile = useMemo<Profile>(() => ({
    id: "prototype-founder",
    full_name: "Prototype Founder",
    email: "prototype@venture-connect.local",
    role: "Founder",
    plan: demoPlan,
    free_report_used: freeUsedInSession,
    reports_used_this_month: 0
  }), [demoPlan, freeUsedInSession]);
  const entitlements = liveUsage?.entitlements ?? computeEntitlements(prototypeProfile);
  const activePlan = liveUsage?.plan ?? demoPlan;
  const suiteItem = reportSuite.find((item) => item.title === reportType) ?? reportSuite[0];
  const template = workspace ? getTemplateDef(workspace.template) : null;
  const completion = workspace ? completionPercent(workspace.sections, workspace.template) : 0;
  const reportUnlocked = reportType === "Basic SWOT Report" || entitlements.reportTypes.includes(reportType);
  const freeAvailable = entitlements.freeReportAvailable && (supabaseConfigured || !freeUsedInSession);
  const documentReady = Boolean(workspace && completion === 100);
  const allowanceReady = reportType === "Basic SWOT Report" ? freeAvailable : entitlements.reportsRemaining > 0;
  const canGenerate = documentReady && reportUnlocked && allowanceReady;
  const allowanceLabel = entitlements.reportsRemaining > 0
    ? `${entitlements.reportsRemaining} premium report${entitlements.reportsRemaining === 1 ? "" : "s"} remaining`
    : activePlan === "Free"
      ? "Premium reports require an upgrade"
      : "No premium reports remaining this month";

  const reportOptions = useMemo(
    () => reportSuite.map((item) => ({
      ...item,
      locked: item.title !== "Basic SWOT Report" && !entitlements.reportTypes.includes(item.title)
    })),
    [entitlements.reportTypes]
  );

  async function refreshSupabaseReportState() {
    const [savedReports, usage] = await Promise.all([getGeneratedReports(), getSubscriptionUsage()]);
    setHistory(savedReports);
    setLiveUsage(usage);
  }

  async function handleGenerate() {
    if (!workspace) {
      setStatus("Select an Idea Workspace document first.");
      return;
    }
    if (completion < 100) {
      setStatus("Complete every required Idea Workspace section before generating a report.");
      return;
    }
    if (reportType === "Basic SWOT Report" && !freeAvailable) {
      setStatus("Free Basic SWOT Report is one-time only. Upgrade to Student Pro or Founder Pro for premium reports.");
      return;
    }
    if (!reportUnlocked) {
      setStatus(`${reportType} requires ${suiteItem.plan}.`);
      return;
    }
    if (generationInFlightRef.current) return;

    generationInFlightRef.current = true;
    setLoading(true);
    setStatus(`Generating ${reportType}...`);
    try {
      const requestStorageKey = `venture-connect-report-request:${workspace.id}:${reportType}`;
      const storedRequestId = window.sessionStorage.getItem(requestStorageKey);
      const requestId = storedRequestId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storedRequestId)
        ? storedRequestId
        : window.crypto.randomUUID();
      window.sessionStorage.setItem(requestStorageKey, requestId);
      const body = supabaseConfigured
        ? { requestId, workspaceId: workspace.id, reportType }
        : {
            requestId,
            workspaceId: workspace.id,
            reportType,
            prototypePlan: demoPlan,
            prototypeWorkspace: {
              name: workspace.name,
              template: workspace.template,
              sections: workspace.sections
            }
          };
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json() as {
        error?: string;
        notice?: string;
        provider?: string;
        mode?: string;
        persistence?: string;
        report?: unknown;
      };
      if (!response.ok) {
        setStatus("We could not generate the report. Please try again.");
        return;
      }
      if (!isStoredVcReportContent(data.report)) {
        setStatus("The server returned an invalid structured report. No report credit was consumed.");
        return;
      }

      setReport(data.report);
      setReportSource(data.provider === "openai" ? "openai" : data.provider === "mock" ? "mock" : null);
      if (data.persistence === "permanent" && supabaseConfigured) {
        await refreshSupabaseReportState();
      } else {
        const nextHistory = [
          { id: `report-${Date.now()}`, workspaceName: workspace.name, report: data.report },
          ...history
        ];
        setHistory(nextHistory);
        if (!supabaseConfigured) {
          window.localStorage.setItem("venture-connect-report-history", JSON.stringify(nextHistory));
        }
      }
      window.sessionStorage.removeItem(requestStorageKey);
      setStatus(data.provider === "mock" ? "Sample report generated for development review." : "Report generated and saved successfully.");
    } catch {
      setStatus("We could not generate the report. Please try again.");
    } finally {
      generationInFlightRef.current = false;
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!report || !workspace || !template) return;
    downloadReportPdf({
      filename: `${report.reportType.replace(/\s+/g, "-").toLowerCase()}-${workspace.name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      title: report.reportType,
      subtitle: `${workspace.name} / ${template.label}`,
      scores: [{ label: "Report score", value: report.overallScore }],
      sections: report.sections.map((item) => ({
        title: item.title,
        lines: [
          item.body ?? "",
          ...(item.items ?? []),
          typeof item.score === "number" ? `Score: ${item.score}/100` : ""
        ].filter(Boolean)
      }))
    });
  }

  return (
    <div className="min-w-0 space-y-5">
      {developmentMode && !openaiConfigured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Development mode: reports use temporary sample output until OpenAI is configured.
        </div>
      ) : null}

      <PageHeader
        eyebrow="VC Readiness Report"
        title="Turn a completed workspace into an investor-readiness review."
        description="Generate structured reports from your selected Idea Workspace document and keep prior results available for comparison."
        actions={
          <>
            {!supabaseConfigured ? (
              <select
                aria-label="Demo subscription plan"
                value={demoPlan}
                onChange={(event) => {
                  setDemoPlan(event.target.value as "Free" | "Student Pro" | "Founder Pro");
                  setReportType("Basic SWOT Report");
                }}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold"
              >
                <option>Free</option><option>Student Pro</option><option>Founder Pro</option>
              </select>
            ) : null}
            <Badge tone="slate">Plan: {activePlan}</Badge>
          </>
        }
      />

      <div aria-label="Report availability" className="flex flex-wrap gap-2">
        <Badge tone={freeAvailable ? "green" : "amber"}>Basic SWOT: {freeAvailable ? "Available" : "Used"}</Badge>
        <Badge tone={entitlements.reportsRemaining > 0 ? "green" : "slate"}>{allowanceLabel}</Badge>
        <Badge tone={supabaseConfigured ? "green" : "amber"}>{supabaseConfigured ? "Account connected" : "Development preview"}</Badge>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader eyebrow="Step 1" title="Select completed Idea Workspace" />
            <label className="block text-sm font-semibold text-slate-700" htmlFor="report-workspace">Idea Workspace document</label>
            <select
              id="report-workspace"
              value={workspace?.id ?? ""}
              onChange={(event) => {
                const selected = workspaceOptions.find((item) => item.id === event.target.value) ?? null;
                setWorkspace(selected);
                if (!supabaseConfigured && selected) window.localStorage.setItem("venture-connect-active-workspace", JSON.stringify(selected));
              }}
              disabled={!workspaceOptions.length}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm disabled:bg-slate-100"
            >
              {!workspaceOptions.length ? <option value="">Create your first Idea Workspace document to generate a report.</option> : null}
              {workspaceOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                <span>{workspace?.name ?? "No document selected"}</span>
                <span>{completion}% complete</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Template: {template?.label ?? "Not selected"}</span>
                <span>Status: {workspace?.status ?? "Not selected"}</span>
              </div>
              <ProgressBar value={completion} className="mt-3" />
              <p className={`mt-3 text-sm font-medium ${documentReady ? "text-emerald-700" : "text-amber-800"}`}>
                {documentReady
                  ? "Document complete and ready for report generation."
                  : "Complete all required Idea Workspace sections before generating this report."}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Step 2" title="Choose report type" />
            <div className="grid gap-3 sm:grid-cols-2">
              {reportOptions.map((item) => {
                const selected = reportType === item.title;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setReportType(item.title)}
                    className={`min-h-28 rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                      {item.locked ? <LockKeyhole size={16} className="shrink-0 text-slate-500" /> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="slate">{item.plan}</Badge>
                      <Badge tone={item.locked ? "amber" : "green"}>{item.locked ? "Locked" : item.title === "Basic SWOT Report" ? "Free" : "Available"}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader eyebrow="Steps 3 & 4" title="Review allowance and generate" />
            <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Selected document</dt><dd className="mt-1 font-semibold text-slate-950">{workspace?.name ?? "Not selected"}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Report type</dt><dd className="mt-1 font-semibold text-slate-950">{reportType}</dd></div>
              <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">Allowance</dt><dd className="mt-1 font-semibold text-slate-950">{reportType === "Basic SWOT Report" ? (freeAvailable ? "Free report available" : "Free report already used") : allowanceLabel}</dd></div>
            </dl>
            {!reportUnlocked ? (
              <Link href="/pricing" className="mt-4 block"><Button className="w-full" variant="secondary"><LockKeyhole size={16} />View upgrade options</Button></Link>
            ) : null}
            <Button className="mt-4 h-12 w-full" onClick={handleGenerate} disabled={loading || !canGenerate}>
              {reportType === "Basic SWOT Report" ? <Wand2 size={17} /> : <Sparkles size={17} />}
              {loading ? "Generating report..." : "Generate Report"}
            </Button>
            {!canGenerate ? (
              <p className="mt-3 text-sm leading-5 text-slate-600">
                {!documentReady ? "Complete all required Idea Workspace sections before generating this report." : !reportUnlocked ? `${reportType} requires ${suiteItem.plan}.` : "Your report allowance is not currently available."}
              </p>
            ) : null}
            <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-5 text-blue-900">{status}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">Reports support founder preparation and are not investment guarantees.</p>
          </Card>

          <Card>
            <CardHeader eyebrow="Step 5" title="View and save reports" />
            {history.length ? (
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setReport(item.report); setReportSource(null); }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="flex items-center justify-between gap-3"><Badge>{item.report.reportType}</Badge><span className="font-semibold text-primary">{item.report.overallScore}/100</span></div>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{item.workspaceName}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(item.report.generatedAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm leading-6 text-slate-600">Generated reports will appear here after successful generation.</div>
            )}
          </Card>
        </aside>
      </div>

      {report ? (
        <Card>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{report.reportType}</Badge>
              {reportSource === "mock" ? <Badge tone="amber">Development sample</Badge> : null}
              {reportSource === "openai" ? <Badge tone="green">Generated report</Badge> : null}
            </div>
            <Button variant="secondary" onClick={handleDownload}><Download size={16} />Export PDF</Button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Executive summary</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{report.summary ?? "Review the report sections below for detailed findings."}</p>
            </section>
            <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Readiness score</p>
              <p className="mt-2 text-4xl font-semibold text-slate-950">{report.overallScore}<span className="text-base text-slate-500">/100</span></p>
              <ProgressBar value={report.overallScore} className="mt-3" />
              <p className="mt-3 text-sm font-semibold text-blue-900">Readiness status: {report.finalRecommendation ?? "Review required"}</p>
            </section>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {report.sections.map((item) => (
              <section key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-950">{item.title}</h3>{typeof item.score === "number" ? <Badge>{item.score}/100</Badge> : null}</div>
                {item.body ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p> : null}
                {item.items?.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">{item.items.map((entry) => <li key={entry}>{entry}</li>)}</ul> : null}
              </section>
            ))}
          </div>
          <section className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-900">Recommendations and priority next steps</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {report.improvementSuggestions.map((suggestion) => <p key={suggestion} className="rounded-xl bg-white p-3 text-sm leading-6 text-blue-900">{suggestion}</p>)}
            </div>
          </section>
        </Card>
      ) : null}
    </div>
  );
}
