"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, FileCheck2, LoaderCircle, Save } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";
import type { ApplicationQualityResult } from "@/lib/application-quality/types";

type WorkspaceOption = { id: string; title: string; stage: string; sections: Record<string, unknown> };
type Props = {
  opportunity: { id: string; title: string; organisationName: string; eligibility: string; deadline: string };
  workspaces: WorkspaceOption[];
  founderName: string;
};

const fields = [
  ["startupName", "Startup name", "text"], ["founderName", "Founder name", "text"],
  ["sector", "Sector", "text"], ["startupStage", "Startup stage", "text"],
  ["founderLocation", "Founder location", "text"], ["problem", "Problem", "long"],
  ["solution", "Solution", "long"], ["targetCustomer", "Target customer", "long"],
  ["marketOpportunity", "Market opportunity", "long"], ["businessModel", "Business model", "long"],
  ["competitors", "Competitors and alternatives", "long"], ["differentiation", "Product differentiation", "long"],
  ["productTechnology", "Product and technology", "long"], ["customerValidation", "Customer validation", "long"],
  ["traction", "Traction", "long"], ["goToMarket", "Go-to-market strategy", "long"],
  ["team", "Team", "long"], ["fundingRequirement", "Funding requirement (INR)", "number"],
  ["useOfFunds", "Use of funds", "long"], ["risks", "Risks and assumptions", "long"],
  ["website", "Website", "url"], ["pitchDeck", "Pitch-deck link", "url"],
  ["organisationQuestions", "Organisation-specific questions", "long"]
] as const;

function initialAnswers(workspace: WorkspaceOption | undefined, founderName: string) {
  const sections = workspace?.sections ?? {};
  return Object.fromEntries(fields.map(([key]) => [key, key === "startupName" ? workspace?.title ?? "" : key === "founderName" ? founderName : key === "startupStage" ? workspace?.stage ?? "Idea" : String(sections[key] ?? "")])) as Record<string, string>;
}

export function ApplicationWizard({ opportunity, workspaces, founderName }: Props) {
  const [step, setStep] = useState(1);
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const workspace = workspaces.find((item) => item.id === workspaceId) ?? workspaces[0];
  const [answers, setAnswers] = useState(() => initialAnswers(workspace, founderName));
  const [applicationId, setApplicationId] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [quality, setQuality] = useState<ApplicationQualityResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const completion = useMemo(() => Math.round(fields.filter(([key]) => answers[key]?.trim()).length / fields.length * 100), [answers]);

  useEffect(() => {
    if (!applicationId) return;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/applications/${applicationId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers })
        });
        if (!response.ok) return;
        const payload = await response.json() as { application: { last_saved_at?: string } };
        setLastSaved(payload.application.last_saved_at ?? new Date().toISOString());
        setQuality(null);
      } catch {
        // Explicit save and quality-check actions still surface actionable errors.
      }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [answers, applicationId]);

  async function createDraft() {
    if (!workspace) return;
    setBusy(true); setError("");
    try {
      const nextAnswers = initialAnswers(workspace, founderName);
      setAnswers(nextAnswers);
      const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId: opportunity.id, ideaWorkspaceId: workspace.id, answers: nextAnswers }) });
      const payload = await response.json() as { application?: { id: string; last_saved_at?: string }; error?: string };
      if (!response.ok || !payload.application) throw new Error(payload.error ?? "Draft could not be created.");
      setApplicationId(payload.application.id); setLastSaved(payload.application.last_saved_at ?? new Date().toISOString()); setStep(2);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Draft could not be created."); }
    finally { setBusy(false); }
  }

  async function saveDraft() {
    if (!applicationId) return false;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/applications/${applicationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const payload = await response.json() as { application?: { last_saved_at?: string }; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Draft could not be saved.");
      setLastSaved(payload.application?.last_saved_at ?? new Date().toISOString()); setNotice("Draft saved.");
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Draft could not be saved.");
      return false;
    } finally { setBusy(false); }
  }

  async function checkApplication() {
    const saved = await saveDraft();
    if (!saved) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/applications/${applicationId}/quality-check`, { method: "POST" });
      const payload = await response.json() as { result?: ApplicationQualityResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "Application Quality Check failed.");
      setQuality(payload.result); setStep(3);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Application Quality Check failed."); }
    finally { setBusy(false); }
  }

  async function submitApplication() {
    if (!applicationId || quality?.status !== "ready_to_submit" || !confirmed) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/applications/${applicationId}/submit`, { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Application could not be submitted.");
      setNotice("Application submitted. The receiving organisation now has an immutable snapshot.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Application could not be submitted."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <Card className="border-blue-200 bg-blue-50/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><Badge>Idea application</Badge><h1 className="mt-3 text-2xl font-semibold text-slate-950">{opportunity.title}</h1><p className="mt-1 text-sm text-slate-600">Receiving organisation: {opportunity.organisationName}</p></div>
          <div className="text-right text-xs leading-5 text-slate-500"><p>Deadline: {opportunity.deadline}</p><p>{lastSaved ? `Last saved ${new Date(lastSaved).toLocaleTimeString()}` : "Not saved yet"}</p></div>
        </div>
      </Card>
      <ol className="grid grid-cols-2 gap-2 text-xs font-semibold md:grid-cols-4">
        {["Select idea", "Complete application", "Quality check", "Preview & submit"].map((label, index) => <li key={label} className={`border-t-2 pt-2 ${step === index + 1 ? "border-primary text-primary" : step > index + 1 ? "border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-500"}`}>{index + 1}. {label}</li>)}
      </ol>
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}{notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}

      {step === 1 ? <Card><CardHeader eyebrow="Step 1" title="Select an Idea Workspace document" /><p className="mb-4 text-sm leading-6 text-slate-600">A separate opportunity-specific copy will be created. Your master document will not be changed.</p><select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm">{workspaces.map((item) => <option key={item.id} value={item.id}>{item.title} / {item.stage}</option>)}</select>{!workspaces.length ? <StatusMessage className="mt-4">Create an Idea Workspace document before applying.</StatusMessage> : null}<Button className="mt-5" disabled={!workspace || busy} onClick={() => void createDraft()}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <ChevronRight size={16} />}Create application copy</Button></Card> : null}

      {step === 2 ? <Card><div className="flex flex-wrap items-end justify-between gap-3"><CardHeader eyebrow={`Step 2 / ${completion}% complete`} title="Complete the pitch documentation" /><Button variant="secondary" disabled={busy} onClick={() => void saveDraft()}><Save size={16} />Save draft</Button></div><div className="mt-5 grid gap-4 md:grid-cols-2">{fields.map(([key, label, kind]) => <label key={key} className={kind === "long" ? "md:col-span-2" : ""}><span className="text-sm font-semibold text-slate-700">{label}</span>{kind === "long" ? <textarea value={answers[key]} onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))} rows={4} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /> : <input type={kind} value={answers[key]} onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />}</label>)}</div><div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="secondary" onClick={() => setStep(1)}><ChevronLeft size={16} />Back</Button><Button disabled={busy} onClick={() => void checkApplication()}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <FileCheck2 size={16} />}Check Application</Button></div></Card> : null}

      {step === 3 && quality ? <Card><div className="flex flex-wrap items-start justify-between gap-4"><CardHeader eyebrow="Application Quality Check" title={`${quality.qualityScore}/100`} /><Badge tone={quality.status === "ready_to_submit" ? "green" : quality.status === "eligibility_mismatch" ? "red" : "amber"}>{quality.status.replaceAll("_", " ")}</Badge></div><p className="text-sm leading-6 text-slate-600">{quality.summary}</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Completeness", quality.completenessScore], ["Meaningful content", quality.meaningfulContentScore], ["Problem-solution", quality.problemSolutionScore], ["Customer & market", quality.customerMarketScore], ["Business model", quality.businessModelScore], ["Validation & traction", quality.validationTractionScore], ["Consistency", quality.consistencyScore], ["Funding clarity", quality.fundingClarityScore]].map(([label, score]) => <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold">{String(score)}</p></div>)}</div>{quality.issues.length ? <div className="mt-5"><h2 className="text-sm font-semibold">Issues to correct</h2><ul className="mt-2 space-y-2">{quality.issues.map((issue, index) => <li key={`${issue.field}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{issue.field}:</strong> {issue.message} {issue.suggestedAction}</li>)}</ul></div> : null}<div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="secondary" onClick={() => setStep(2)}><ChevronLeft size={16} />Edit application</Button>{quality.status === "ready_to_submit" ? <Button onClick={() => setStep(4)}><ChevronRight size={16} />Preview application</Button> : <Button onClick={() => void checkApplication()} disabled={busy}>Recheck application</Button>}</div></Card> : null}

      {step === 4 && quality ? <Card><CardHeader eyebrow="Step 4" title="Confirm the fixed submission snapshot" /><p className="text-sm text-slate-600">Review the exact answers that will be shared with {opportunity.organisationName}. Later master-workspace edits will not change this submission.</p><dl className="mt-5 divide-y divide-slate-200 border-y border-slate-200">{fields.map(([key, label]) => <div key={key} className="grid gap-2 py-3 md:grid-cols-[220px_1fr]"><dt className="text-sm font-semibold text-slate-700">{label}</dt><dd className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{answers[key] || "Not provided"}</dd></div>)}</dl><label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span>I confirm that these answers are accurate and ready for human review by the selected organisation.</span></label><div className="mt-5 flex flex-wrap justify-between gap-3"><Button variant="secondary" onClick={() => setStep(3)}><ChevronLeft size={16} />Back</Button><Button disabled={!confirmed || busy || quality.status !== "ready_to_submit"} onClick={() => void submitApplication()}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}Submit application</Button></div></Card> : null}
    </div>
  );
}
