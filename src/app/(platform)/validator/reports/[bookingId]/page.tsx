"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidationReportView } from "@/components/validation/ValidationReportView";
import { getBadgesForWorkspace, getBookingById, getReportByBookingId } from "@/lib/data/validations";
import type { ValidationBadgeName, ValidationScore } from "@/lib/validation/types";

const emptyScores: ValidationScore[] = [
  "Problem Clarity",
  "Customer Evidence",
  "Solution Relevance",
  "Market Understanding",
  "Competition Awareness",
  "Technical Feasibility",
  "Business Model",
  "Founder Readiness",
  "Evidence Strength",
  "Investor Application Readiness"
].map((dimension) => ({ dimension: dimension as ValidationScore["dimension"], score: 70, justification: "" }));

const badgeOptions: ValidationBadgeName[] = [
  "Human Reviewed",
  "Problem Review Completed",
  "Customer Evidence Reviewed",
  "Technical Feasibility Reviewed",
  "Business Model Reviewed",
  "Incubation Cell Reviewed",
  "Investor Application Ready"
];

export default function ReportBuilderPage() {
  const params = useParams<{ bookingId: string }>();
  const booking = getBookingById(params.bookingId);
  const existingReport = getReportByBookingId(params.bookingId);
  const [scores, setScores] = useState(existingReport?.scores ?? emptyScores);
  const [strengths, setStrengths] = useState(existingReport?.strengths.join("\n") ?? "");
  const [concerns, setConcerns] = useState(existingReport?.weaknesses.join("\n") ?? "");
  const [improvements, setImprovements] = useState(existingReport?.requiredImprovements.join("\n") ?? "");
  const [experiments, setExperiments] = useState(existingReport?.recommendedExperiments.join("\n") ?? "");
  const [conclusion, setConclusion] = useState(existingReport?.validatorConclusion ?? "");
  const [badgeRecommendation, setBadgeRecommendation] = useState<ValidationBadgeName[]>(existingReport?.badgeRecommendation ?? []);
  const [submitted, setSubmitted] = useState(false);

  const mandatoryComplete = useMemo(
    () =>
      scores.every((score) => score.justification.trim().length >= 12) &&
      strengths.trim().length >= 20 &&
      concerns.trim().length >= 20 &&
      improvements.trim().length >= 20 &&
      experiments.trim().length >= 20 &&
      conclusion.trim().length >= 30,
    [concerns, conclusion, experiments, improvements, scores, strengths]
  );

  if (!booking) {
    return <ValidationEmptyState title="Booking not found" description="The selected booking is unavailable." />;
  }

  if (existingReport && submitted) {
    return (
      <ValidationReportView
        report={existingReport}
        badges={getBadgesForWorkspace(booking.workspace.id)}
      />
    );
  }

  function updateScore(index: number, patch: Partial<ValidationScore>) {
    setScores((current) => current.map((score, currentIndex) => currentIndex === index ? { ...score, ...patch } : score));
  }

  function toggleBadge(name: ValidationBadgeName) {
    setBadgeRecommendation((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Badge>
          <FileCheck2 size={13} />
          Report Builder
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{booking.workspace.startupName}</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Complete each report section with separate score justifications. Badge recommendation stays locked until mandatory sections are complete.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Prototype report submitted. In production this would persist to Supabase, notify the founder, and start the dispute window.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Numeric scores" title="Dimension-based validation" />
            <div className="grid gap-4 md:grid-cols-2">
              {scores.map((score, index) => (
                <div key={score.dimension} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                    <span>{score.dimension}</span>
                    <span>{score.score}/100</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={score.score}
                    onChange={(event) => updateScore(index, { score: Number(event.target.value) })}
                    className="mt-3 w-full"
                  />
                  <ProgressBar value={score.score} className="mt-2" />
                  <textarea
                    value={score.justification}
                    onChange={(event) => updateScore(index, { justification: event.target.value })}
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                    placeholder="Written justification required..."
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Written sections" title="Report narrative" />
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Strengths", value: strengths, setter: setStrengths },
                { label: "Concerns", value: concerns, setter: setConcerns },
                { label: "Required improvements", value: improvements, setter: setImprovements },
                { label: "Recommended experiments", value: experiments, setter: setExperiments }
              ].map(({ label, value, setter }) => (
                <label key={label} className="block">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <textarea
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                    placeholder="Use one point per line..."
                  />
                </label>
              ))}
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Final conclusion</span>
                <textarea
                  value={conclusion}
                  onChange={(event) => setConclusion(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                  placeholder="Final readiness conclusion..."
                />
              </label>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Badge recommendation" title="Locked until complete" />
            {!mandatoryComplete ? (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                Complete every score justification and required written section before recommending a badge.
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                Mandatory sections complete. Badge recommendation is enabled, but admin rules still apply.
              </div>
            )}
            <div className="mt-4 space-y-2">
              {badgeOptions.map((badge) => (
                <label key={badge} className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${mandatoryComplete ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
                  <input
                    type="checkbox"
                    disabled={!mandatoryComplete}
                    checked={badgeRecommendation.includes(badge)}
                    onChange={() => toggleBadge(badge)}
                  />
                  {badge}
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Submission" title="Validation controls" />
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />Report belongs to booking {booking.id}.</p>
              <p className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />Badge links to validator, version, date, reviewed areas, readiness stage, and verification ID.</p>
            </div>
            <Button className="mt-5 w-full" disabled={!mandatoryComplete} onClick={() => setSubmitted(true)}>
              Submit report
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
