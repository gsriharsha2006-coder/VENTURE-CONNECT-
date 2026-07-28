"use client";

import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ValidatorAvatar } from "@/components/validation/ValidatorAvatar";
import { validators } from "@/lib/data/validations";
import { validatorLevelRules } from "@/lib/validation/config";

const validator = validators[0];

export default function ValidatorProfileManagementPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="flex gap-5">
            <ValidatorAvatar name={validator.name} verified={validator.verified} size="lg" />
            <div>
              <Badge tone="green">
                <ShieldCheck size={13} />
                Verified validator profile
              </Badge>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">{validator.name}</h1>
              <p className="mt-2 text-sm text-slate-600">{validator.role} / {validator.institution}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Level: <strong>{validator.level}</strong>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader eyebrow="Performance-based levels" title="Limits are admin-configurable" />
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(validatorLevelRules).map(([level, rule]) => (
              <div key={level} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Badge tone={level === validator.level ? "green" : "slate"}>{level}</Badge>
                <p className="mt-3 text-sm leading-6 text-slate-600">{rule.requirement}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Weekly limit: {rule.weeklyLimit}</p>
                <p className="mt-1 text-xs text-slate-500">{rule.pricingRange}</p>
              </div>
            ))}
          </div>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Profile performance" title="Quality markers" />
            <div className="space-y-4">
              {[
                ["Rating", Math.round(validator.rating * 20)],
                ["Completion record", 94],
                ["Report quality", 91],
                ["Low dispute rate", 96]
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
                    <span>{label as string}</span>
                    <span>{value as number}%</span>
                  </div>
                  <ProgressBar value={value as number} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Credentials" title="Verification evidence" />
            <div className="space-y-3">
              {validator.qualifications.map((item) => (
                <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  {item}
                </p>
              ))}
              <p className="flex gap-2 text-sm leading-6 text-slate-600">
                <Star size={16} className="mt-0.5 shrink-0 fill-amber-300 text-amber-500" />
                {validator.rating} average rating from paid completed validations.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
