"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  Languages,
  LockKeyhole,
  UploadCloud
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidationServiceCard } from "@/components/validation/ValidationServiceCard";
import { ValidatorAvatar } from "@/components/validation/ValidatorAvatar";
import { ideaWorkspaces } from "@/lib/data";
import { getServicesForValidator, getValidatorById, workspaceTemplateLabel } from "@/lib/data/validations";
import { validationServices } from "@/lib/validation/config";
import { getValidatorTrustPresentation } from "@/lib/validation/trust";
import type { ValidationServiceType } from "@/lib/validation/types";
import { completionPercent } from "@/lib/templates";

const steps = ["Select service", "Select document", "Schedule or instructions", "Review and payment"] as const;
const dates = ["2026-07-30", "2026-07-31", "2026-08-01"];
const slots = ["10:30 AM", "4:00 PM", "5:30 PM", "7:00 PM"];

export default function ValidationBookingPage() {
  const params = useParams<{ validatorId: string }>();
  const searchParams = useSearchParams();
  const validator = getValidatorById(params.validatorId);
  const services = validator ? getServicesForValidator(validator) : [];
  const requestedService = searchParams.get("service") as ValidationServiceType | null;
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ValidationServiceType>(() => (
    requestedService && services.some((service) => service.type === requestedService)
      ? requestedService
      : services[0]?.type ?? "Written Idea Review"
  ));
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
  const total = service.founderPrice;
  const availableLanguages = useMemo(() => validator?.languages ?? ["English"], [validator]);

  if (!validator || !workspace) {
    return (
      <ValidationEmptyState
        title="Booking cannot be started"
        description="The selected validator or Idea Workspace was not found."
      />
    );
  }
  const trust = getValidatorTrustPresentation(validator);

  if (confirmed) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-8 text-center sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 aria-hidden="true" size={28} />
          </span>
          <div className="mt-5 flex justify-center gap-2">
            {validator.isDemo ? <Badge tone="amber">Sample booking</Badge> : null}
            <Badge tone="amber">Payment pending</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">
            {validator.isDemo ? "Sample validation booking created" : "Validation booking created"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            The validator must accept before the confidential document becomes available. Payment release and any human-reviewed badge remain tied to the completed report.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard/validation-hub/workspace/validation-booking-4">
              <Button>Open validation workspace</Button>
            </Link>
            <Link href="/dashboard/validation-hub">
              <Button variant="secondary">Return to Validation Hub</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  function nextStep() {
    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  function previousStep() {
    setStep((current) => Math.max(0, current - 1));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Validation Hub"
        title={validator.isDemo ? "Create a sample validation booking" : "Book a human validation"}
        description="Choose one service and one document version. You will review the complete scope before payment."
        actions={(
          <Link href={`/dashboard/validation-hub/validators/${validator.id}`}>
            <Button variant="secondary">
              <ArrowLeft aria-hidden="true" size={16} />
              Validator profile
            </Button>
          </Link>
        )}
      />

      <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
        <ValidatorAvatar name={validator.name} photoUrl={validator.photoUrl} verified={trust.showVerifiedBadge} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950">{validator.name}</p>
            {validator.isDemo ? <Badge tone="amber">Demo profile</Badge> : null}
          </div>
          <p className="truncate text-sm text-slate-600">{validator.role}</p>
        </div>
        <div className="ml-auto hidden gap-5 text-sm text-slate-600 md:flex">
          <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" size={16} className="text-primary" />{validator.nextAvailable}</span>
          <span className="inline-flex items-center gap-2"><Languages aria-hidden="true" size={16} className="text-primary" />{validator.languages.join(", ")}</span>
        </div>
      </div>

      <nav aria-label="Booking progress">
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((label, index) => {
            const complete = index < step;
            const active = index === step;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={index > step}
                  onClick={() => setStep(index)}
                  aria-current={active ? "step" : undefined}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 text-left text-sm font-semibold transition-colors ${
                    active
                      ? "border-blue-300 bg-blue-50 text-primary"
                      : complete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${active ? "bg-primary text-white" : complete ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {complete ? <Check aria-hidden="true" size={15} /> : index + 1}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {step === 0 ? (
            <section aria-labelledby="service-step-title">
              <div className="mb-5">
                <p className="text-sm font-semibold text-primary">Step 1</p>
                <h2 id="service-step-title" className="mt-1 text-2xl font-semibold text-slate-950">Select a validation service</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Choose the level of written feedback, conversation, and revision support you need.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {services.map((item) => (
                  <ValidationServiceCard
                    key={item.type}
                    service={item}
                    selected={serviceType === item.type}
                    onSelect={() => setServiceType(item.type)}
                    actionLabel={serviceType === item.type ? "Selected" : "Select service"}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <Card>
              <CardHeader eyebrow="Step 2" title="Select an Idea Workspace document" />
              <p className="-mt-2 mb-5 text-sm leading-6 text-slate-600">The validator receives read-only access to the exact version selected here.</p>
              <div className="grid gap-3 md:grid-cols-2">
                {ideaWorkspaces.map((item) => {
                  const itemCompletion = completionPercent(item.sections, item.template);
                  const itemVersion = item.versionHistory.at(-1)?.versionNumber ?? 1;
                  const selected = workspaceId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setWorkspaceId(item.id)}
                      className={`rounded-lg border p-4 text-left transition-colors ${selected ? "border-blue-300 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-950">{item.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{workspaceTemplateLabel(item.template)} · v{itemVersion}</p>
                        </div>
                        <Badge tone={item.status === "Complete" ? "green" : "amber"}>{item.status}</Badge>
                      </div>
                      <div className="mt-4">
                        <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600">
                          <span>Completion</span>
                          <span>{itemCompletion}%</span>
                        </div>
                        <ProgressBar value={itemCompletion} />
                      </div>
                      <p className="mt-3 text-xs text-slate-500">Updated {item.updatedAt}</p>
                    </button>
                  );
                })}
              </div>
              {completion < 100 ? (
                <StatusMessage className="mt-5">
                  This document is incomplete. You can continue, but the validator may require improvements before approving a review badge.
                </StatusMessage>
              ) : null}
            </Card>
          ) : null}

          {step === 2 ? (
            <Card>
              <CardHeader
                eyebrow="Step 3"
                title={service.requiresLiveSession ? "Choose schedule and instructions" : "Add written-review instructions"}
              />
              {service.requiresLiveSession ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Available date</span>
                    <select value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
                      {dates.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Time slot</span>
                    <select value={slot} onChange={(event) => setSlot(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
                      {slots.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Meeting language</span>
                    <select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
                      {availableLanguages.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">Focus note for the validator</span>
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" placeholder="Which assumptions, evidence, or application should the validator focus on?" />
                  </label>
                </div>
              ) : (
                <div className="space-y-5">
                  <StatusMessage>Expected delivery: {service.expectedDelivery}. This service does not include a live meeting.</StatusMessage>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Review instructions</span>
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={6} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" placeholder="What should the written review focus on?" />
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900">
                    <UploadCloud aria-hidden="true" size={20} />
                    <span>
                      <strong className="block">Attach supporting evidence</strong>
                      <span className="text-xs text-blue-700">Optional PDFs, images, or research notes</span>
                    </span>
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
              <CardHeader eyebrow="Step 4" title="Review scope and payment" />
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {[
                  ["Validator", validator.name],
                  ["Service", service.type],
                  ["Idea Workspace", `${workspace.name} · v${version}`],
                  ["Delivery", service.requiresLiveSession ? `${date} at ${slot}` : service.expectedDelivery],
                  ["Meeting language", service.requiresLiveSession ? language : "Not applicable"],
                  ["Focus note", note || "No additional instructions"]
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-3 sm:grid-cols-[170px_1fr] sm:gap-4">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
              <StatusMessage className="mt-5">
                Payment begins as pending. Validator payout is released only after the required report, live session when applicable, and the founder dispute window.
              </StatusMessage>
              <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={() => setConfirmed(true)}>
                <LockKeyhole aria-hidden="true" size={17} />
                Confirm and pay ₹{total}
              </Button>
            </Card>
          ) : null}

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-5">
            <Button variant="secondary" disabled={step === 0} onClick={previousStep}>
              <ArrowLeft aria-hidden="true" size={16} />
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Continue
                <ArrowRight aria-hidden="true" size={16} />
              </Button>
            ) : null}
          </div>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader eyebrow="Booking summary" title={service.type} />
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-semibold text-slate-950">₹{service.founderPrice}</p>
                <p className="mt-1 text-xs text-slate-500">{service.expectedDelivery}</p>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <FileText aria-hidden="true" size={16} className="text-primary" />
                  {workspace.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">{workspaceTemplateLabel(workspace.template)} · v{version}</p>
              </div>
              <div className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-600">
                <p className="flex gap-2">
                  <LockKeyhole aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-primary" />
                  Document access opens only after validator acceptance.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
