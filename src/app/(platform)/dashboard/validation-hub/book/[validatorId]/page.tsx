"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Languages, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidationServiceCard } from "@/components/validation/ValidationServiceCard";
import { ValidatorAvatar } from "@/components/validation/ValidatorAvatar";
import { ideaWorkspaces } from "@/lib/data";
import { getServicesForValidator, getValidatorById, workspaceTemplateLabel } from "@/lib/data/validations";
import { validationServices } from "@/lib/validation/config";
import type { ValidationServiceType } from "@/lib/validation/types";
import { completionPercent } from "@/lib/templates";

const steps = ["Select service", "Select Idea Workspace", "Schedule and instructions", "Review and payment"];
const dates = ["2026-07-30", "2026-07-31", "2026-08-01"];
const slots = ["10:30 AM", "4:00 PM", "5:30 PM", "7:00 PM"];

export default function ValidationBookingPage() {
  const params = useParams<{ validatorId: string }>();
  const validator = getValidatorById(params.validatorId);
  const services = validator ? getServicesForValidator(validator) : [];
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ValidationServiceType>(services[0]?.type ?? "Written Idea Review");
  const [workspaceId, setWorkspaceId] = useState(ideaWorkspaces[0]?.id ?? "");
  const [date, setDate] = useState(dates[0]);
  const [slot, setSlot] = useState(slots[0]);
  const [language, setLanguage] = useState("English");
  const [note, setNote] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const service = validationServices[serviceType];
  const workspace = ideaWorkspaces.find((item) => item.id === workspaceId) ?? ideaWorkspaces[0];
  const completion = workspace ? completionPercent(workspace.sections, workspace.template) : 0;
  const version = workspace?.versionHistory.at(-1)?.versionNumber ?? 1;
  const charges = service.founderPrice >= 599 ? 0 : 0;
  const total = service.founderPrice + charges;

  const availableLanguages = useMemo(
    () => validator?.languages ?? ["English"],
    [validator]
  );

  if (!validator || !workspace) {
    return (
      <ValidationEmptyState
        title="Booking cannot be started"
        description="The selected validator or Idea Workspace was not found."
      />
    );
  }

  if (confirmed) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={28} />
          </span>
          <Badge className="mt-5" tone="amber">Payment pending</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Validation booking created</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Your payment is pending and will be held safely after confirmation. The validator must accept the request before the confidential document becomes accessible, and no badge is awarded until the completed report approves the document version.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard/validation-hub/workspace/validation-booking-4">
              <Button>Open validation workspace</Button>
            </Link>
            <Link href="/dashboard/validation-hub">
              <Button variant="secondary">Back to Validation Hub</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Link href={`/dashboard/validation-hub/validators/${validator.id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary">
          <ArrowLeft size={16} />
          Back to validator profile
        </Link>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex gap-4">
            <ValidatorAvatar name={validator.name} verified={validator.verified} />
            <div>
              <Badge>Book validation</Badge>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">{validator.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{validator.role} / {validator.institution}</p>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-primary" />{validator.nextAvailable}</span>
            <span className="inline-flex items-center gap-2"><Languages size={16} className="text-primary" />{validator.languages.join(", ")}</span>
          </div>
        </div>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-xl border p-3 text-left transition ${step === index ? "border-blue-200 bg-blue-50 text-primary" : "border-slate-200 bg-white text-slate-600"}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide">Step {index + 1}</p>
              <p className="mt-1 text-sm font-semibold">{item}</p>
            </button>
          ))}
        </div>
      </Card>

      {step === 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {services.map((item) => (
            <ValidationServiceCard
              key={item.type}
              service={item}
              selected={serviceType === item.type}
              onSelect={() => setServiceType(item.type)}
            />
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader eyebrow="Select Idea Workspace" title="Choose the exact document version to share" />
          <div className="grid gap-4 lg:grid-cols-2">
            {ideaWorkspaces.map((item) => {
              const itemCompletion = completionPercent(item.sections, item.template);
              const itemVersion = item.versionHistory.at(-1)?.versionNumber ?? 1;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWorkspaceId(item.id)}
                  className={`rounded-2xl border p-4 text-left transition ${workspaceId === item.id ? "border-blue-300 bg-blue-50 shadow-panel" : "border-slate-200 bg-white hover:border-blue-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-950">{item.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{workspaceTemplateLabel(item.template)} / v{itemVersion}</p>
                    </div>
                    <Badge tone={item.status === "Complete" ? "green" : "amber"}>{item.status}</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
                      <span>Completion</span>
                      <span>{itemCompletion}%</span>
                    </div>
                    <ProgressBar value={itemCompletion} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Last updated: {item.updatedAt}</p>
                </button>
              );
            })}
          </div>
          {completion < 100 ? (
            <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              This document is incomplete. You can continue, but the validator may mark improvements required before final review or badge approval.
            </div>
          ) : null}
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader eyebrow="Schedule and instructions" title={service.requiresLiveSession ? "Choose session details" : "Written review instructions"} />
          {service.requiresLiveSession ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Available date</span>
                <select value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                  {dates.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Time slot</span>
                <select value={slot} onChange={(event) => setSlot(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                  {slots.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Meeting language</span>
                <select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                  {availableLanguages.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Short note for validator</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" placeholder="Tell the validator what to focus on..." />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Expected delivery time: {service.expectedDelivery}. No live meeting is included.
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Short note</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" placeholder="What should the written review focus on?" />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900">
                <UploadCloud size={20} />
                Upload supporting evidence
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => setSupportingFiles(Array.from(event.target.files ?? []).map((file) => file.name))}
                />
              </label>
              {supportingFiles.length ? (
                <div className="flex flex-wrap gap-2">
                  {supportingFiles.map((file) => <Badge key={file} tone="slate">{file}</Badge>)}
                </div>
              ) : null}
            </div>
          )}
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader eyebrow="Review and payment" title="Confirm validation booking" />
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {[
                ["Validator", validator.name],
                ["Service", service.type],
                ["Idea Workspace", `${workspace.name} / v${version}`],
                ["Date and time", service.requiresLiveSession ? `${date}, ${slot}` : `Written review / ${service.expectedDelivery}`],
                ["Meeting language", language],
                ["Cancellation policy", "Free cancellation until validator accepts. After acceptance, disputes go through admin review."]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <CardHeader eyebrow="Payment summary" title="Escrow payment" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Service price</span><strong>Rs {service.founderPrice}</strong></div>
                <div className="flex justify-between"><span>Taxes/payment charges</span><strong>Rs {charges}</strong></div>
                <div className="border-t border-slate-200 pt-3 flex justify-between text-base"><span>Total</span><strong>Rs {total}</strong></div>
              </div>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Payment starts in a pending state. Validator payout is released only after report submission, session completion when applicable, and the founder dispute window.
              </div>
              <Button className="mt-5 w-full" onClick={() => setConfirmed(true)}>
                Confirm and Pay
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
          Back
        </Button>
        <Button disabled={step === steps.length - 1} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>
          Next
        </Button>
      </div>
    </div>
  );
}
