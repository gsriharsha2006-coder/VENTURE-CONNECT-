"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";

type Field = { id: string; fieldKey: string; fieldType: string; label: string; helpText?: string; required: boolean; configuration: Record<string, unknown> };

export function InternalRegistrationForm({ opportunityId, title, organiser, formId, fields }: { opportunityId: string; title: string; organiser: string; formId: string; fields: Field[] }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string | boolean | string[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const missing = useMemo(() => fields.filter((field) => field.required && !(Array.isArray(answers[field.fieldKey]) ? (answers[field.fieldKey] as string[]).length : answers[field.fieldKey])).map((field) => field.label), [answers, fields]);

  function control(field: Field) {
    const value = answers[field.fieldKey];
    const options = Array.isArray(field.configuration.options) ? field.configuration.options.filter((item): item is string => typeof item === "string") : [];
    if (field.fieldType === "long_text") return <textarea rows={4} value={String(value ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.fieldKey]: event.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />;
    if (field.fieldType === "checkbox" || field.fieldType === "consent_checkbox") return <input type="checkbox" checked={Boolean(value)} onChange={(event) => setAnswers((current) => ({ ...current, [field.fieldKey]: event.target.checked }))} className="mt-1 h-4 w-4" />;
    if (field.fieldType === "single_select") return <select value={String(value ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.fieldKey]: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"><option value="">Select an option</option>{options.map((option) => <option key={option}>{option}</option>)}</select>;
    return <input type={field.fieldType === "email" ? "email" : field.fieldType === "url" ? "url" : field.fieldType === "number" ? "number" : field.fieldType === "phone" ? "tel" : "text"} value={String(value ?? "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.fieldKey]: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />;
  }

  async function submit() {
    if (missing.length) { setError(`Complete required fields: ${missing.join(", ")}.`); setStep(1); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formId, answers }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Registration could not be submitted.");
      setSubmitted(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Registration could not be submitted."); }
    finally { setBusy(false); }
  }

  if (submitted) return <Card><div className="flex items-start gap-3"><CheckCircle2 className="mt-1 text-emerald-600" /><div><h1 className="text-xl font-semibold">Registration submitted</h1><p className="mt-2 text-sm leading-6 text-slate-600">Your answers were submitted to {organiser}. Track the organiser-managed status from Applications.</p></div></div></Card>;

  return <div className="space-y-5"><Card><CardHeader eyebrow="Internal registration" title={title} /><p className="text-sm text-slate-600">Form created and reviewed by {organiser}. This registration does not use Idea Workspace or Application Quality Check.</p></Card><ol className="grid grid-cols-3 gap-2 text-xs font-semibold">{["Complete form", "Review answers", "Submit"].map((label, index) => <li key={label} className={`border-t-2 pt-2 ${step === index + 1 ? "border-primary text-primary" : step > index + 1 ? "border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-500"}`}>{index + 1}. {label}</li>)}</ol>{error ? <StatusMessage tone="error">{error}</StatusMessage> : null}{step === 1 ? <Card><CardHeader eyebrow="Step 1" title="Complete organiser questions" /><div className="grid gap-4 md:grid-cols-2">{fields.map((field) => <label key={field.id} className={field.fieldType === "long_text" ? "md:col-span-2" : ""}><span className="text-sm font-semibold text-slate-700">{field.label}{field.required ? " *" : ""}</span>{field.helpText ? <span className="mt-1 block text-xs text-slate-500">{field.helpText}</span> : null}{control(field)}</label>)}</div><Button className="mt-6" onClick={() => missing.length ? setError(`Complete required fields: ${missing.join(", ")}.`) : (setError(""), setStep(2))}>Review answers<ChevronRight size={16} /></Button></Card> : null}{step === 2 ? <Card><CardHeader eyebrow="Step 2" title="Review answers" /><dl className="divide-y divide-slate-200 border-y border-slate-200">{fields.map((field) => <div key={field.id} className="grid gap-2 py-3 md:grid-cols-[220px_1fr]"><dt className="text-sm font-semibold">{field.label}</dt><dd className="text-sm text-slate-600">{Array.isArray(answers[field.fieldKey]) ? (answers[field.fieldKey] as string[]).join(", ") : String(answers[field.fieldKey] || "Not provided")}</dd></div>)}</dl><div className="mt-5 flex justify-between gap-3"><Button variant="secondary" onClick={() => setStep(1)}><ChevronLeft size={16} />Edit</Button><Button onClick={() => setStep(3)}>Continue<ChevronRight size={16} /></Button></div></Card> : null}{step === 3 ? <Card><CardHeader eyebrow="Step 3" title="Submit registration" /><p className="text-sm leading-6 text-slate-600">Your registration will be sent to {organiser}. Selection and subsequent status decisions remain with the organiser.</p><div className="mt-5 flex justify-between gap-3"><Button variant="secondary" onClick={() => setStep(2)}><ChevronLeft size={16} />Back</Button><Button disabled={busy} onClick={() => void submit()}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}Submit registration</Button></div></Card> : null}</div>;
}
