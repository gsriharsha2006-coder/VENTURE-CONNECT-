import { AlertTriangle, CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";
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
              <ShieldCheck size={13} />
              {badge.name}
            </Badge>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <Badge tone={report.approvedForBadge ? "green" : "amber"}>
              <FileCheck2 size={13} />
              {report.readinessStage}
            </Badge>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Structured validation report</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Validator: {validator?.name ?? "Assigned validator"} / {report.validationDate} / {report.serviceType} / Idea Workspace v{report.ideaWorkspaceVersion}
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Badge approval is issued only after the report is complete and the relevant document version is approved.
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader eyebrow="Dimension scores" title="Not a single-score shortcut" />
        <div className="grid gap-4 md:grid-cols-2">
          {report.scores.map((score) => (
            <div key={score.dimension} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                <span>{score.dimension}</span>
                <span>{score.score}/100</span>
              </div>
              <ProgressBar value={score.score} className="mt-3" />
              <p className="mt-3 text-xs leading-5 text-slate-600">{score.justification}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Areas reviewed", items: report.areasReviewed, icon: CheckCircle2 },
          { title: "Evidence reviewed", items: report.evidenceReviewed, icon: FileCheck2 },
          { title: "Strengths", items: report.strengths, icon: CheckCircle2 },
          { title: "Weaknesses", items: report.weaknesses, icon: AlertTriangle },
          { title: "Major assumptions", items: report.majorAssumptions, icon: AlertTriangle },
          { title: "Major risks", items: report.majorRisks, icon: AlertTriangle },
          { title: "Recommended experiments", items: report.recommendedExperiments, icon: CheckCircle2 },
          { title: "Required improvements", items: report.requiredImprovements, icon: FileCheck2 }
        ].map(({ title, items, icon: Icon }) => (
          <Card key={title}>
            <CardHeader title={title} />
            <div className="space-y-3">
              {items.map((item) => (
                <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                  <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
                  {item}
                </p>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader eyebrow="Conclusion" title="Validator decision" />
        <p className="text-sm leading-6 text-slate-600">{report.validatorConclusion}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge key={badge.id} tone="green">
              <ShieldCheck size={13} />
              {badge.name} / {badge.verificationId}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
