import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getValidatorById } from "@/lib/data/validations";
import type { ValidationBadge, ValidationReport } from "@/lib/validation/types";

export function ValidationReportView({
  report,
  badges = [],
  limited = false
}: {
  report: ValidationReport;
  badges?: ValidationBadge[];
  limited?: boolean;
}) {
  const validator = getValidatorById(report.validatorId);
  const averageScore = Math.round(report.scores.reduce((sum, item) => sum + item.score, 0) / report.scores.length);

  if (limited) {
    return (
      <Card>
        <CardHeader eyebrow="Limited validation summary" title={report.readinessStage} />
        <p className="text-sm leading-6 text-slate-600">
          {validator?.name} reviewed Idea Workspace v{report.ideaWorkspaceVersion} through {report.serviceType}. The full confidential report is private unless the founder grants access.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge key={badge.id} tone="green">
              <ShieldCheck aria-hidden="true" size={13} />
              {badge.name}
            </Badge>
          ))}
        </div>
      </Card>
    );
  }

  const findingGroups = [
    { title: "Strengths", items: report.strengths, icon: CheckCircle2, iconClass: "text-emerald-600" },
    { title: "Weaknesses", items: report.weaknesses, icon: AlertTriangle, iconClass: "text-amber-600" },
    { title: "Major assumptions", items: report.majorAssumptions, icon: Target, iconClass: "text-primary" },
    { title: "Major risks", items: report.majorRisks, icon: AlertTriangle, iconClass: "text-rose-600" },
    { title: "Recommended experiments", items: report.recommendedExperiments, icon: Beaker, iconClass: "text-primary" },
    { title: "Required improvements", items: report.requiredImprovements, icon: FileCheck2, iconClass: "text-primary" }
  ];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-950 p-6 text-white">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <Badge className="border-blue-300/30 bg-blue-500/15 text-blue-100">
                <FileCheck2 aria-hidden="true" size={13} />
                Structured validation report
              </Badge>
              <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">{report.readinessStage}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {validator?.name ?? "Assigned validator"} · {report.serviceType} · Idea Workspace v{report.ideaWorkspaceVersion}
              </p>
            </div>
            <Badge tone={report.approvedForBadge ? "green" : "amber"}>
              {report.approvedForBadge ? "Badge criteria approved" : "Improvements required"}
            </Badge>
          </div>
        </div>
        <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
          <div className="bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">Overall dimension average</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{averageScore}<span className="text-base text-slate-400">/100</span></p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">Validation date</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{report.validationDate}</p>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">Evidence items reviewed</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{report.evidenceReviewed.length}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader eyebrow="Dimension scores" title="Evidence-backed assessment" />
        <p className="-mt-2 mb-5 text-sm leading-6 text-slate-600">
          Each score carries a written justification. The average is a summary, not a substitute for the individual findings.
        </p>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {report.scores.map((score) => (
            <div key={score.dimension} className="grid gap-3 py-4 lg:grid-cols-[210px_120px_1fr] lg:items-center">
              <p className="text-sm font-semibold text-slate-950">{score.dimension}</p>
              <div>
                <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                  <span>{score.score}</span>
                  <span>100</span>
                </div>
                <ProgressBar value={score.score} />
              </div>
              <p className="text-sm leading-6 text-slate-600">{score.justification}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader eyebrow="Review scope" title="Areas reviewed" />
          <div className="space-y-3">
            {report.areasReviewed.map((item) => (
              <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                <CheckCircle2 aria-hidden="true" size={16} className="mt-1 shrink-0 text-emerald-600" />
                {item}
              </p>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow="Source material" title="Evidence reviewed" />
          <div className="space-y-3">
            {report.evidenceReviewed.map((item) => (
              <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                <FileCheck2 aria-hidden="true" size={16} className="mt-1 shrink-0 text-primary" />
                {item}
              </p>
            ))}
          </div>
        </Card>
      </div>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold text-primary">Validator findings</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">What is working and what must change</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {findingGroups.map(({ title, items, icon: Icon, iconClass }) => (
            <Card key={title}>
              <p className="flex items-center gap-2 font-semibold text-slate-950">
                <Icon aria-hidden="true" size={18} className={iconClass} />
                {title}
              </p>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <p key={item} className="border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-600">
                    {item}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader eyebrow="Conclusion" title="Validator decision" />
        <p className="text-sm leading-7 text-slate-700">{report.validatorConclusion}</p>
        {badges.length ? (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <p className="mb-3 text-xs font-semibold text-slate-500">VERIFIED DOCUMENT MARKERS</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={badge.id} tone="green">
                  <ShieldCheck aria-hidden="true" size={13} />
                  {badge.name} · {badge.verificationId}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
