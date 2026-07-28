import Link from "next/link";
import { CalendarClock, Languages, Star, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { validationServices } from "@/lib/validation/config";
import type { ValidatorProfile } from "@/lib/validation/types";
import { ValidatorAvatar } from "@/components/validation/ValidatorAvatar";

export function ValidatorCard({ validator }: { validator: ValidatorProfile }) {
  const expertise = validator.expertise.slice(0, 3);
  const extra = validator.expertise.length - expertise.length;
  const startingPrice = Math.min(...validator.serviceTypes.map((type) => validationServices[type].founderPrice));

  return (
    <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-panel">
      <div className="flex items-start gap-4">
        <ValidatorAvatar name={validator.name} verified={validator.verified} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-950">{validator.name}</h2>
            {validator.verified ? (
              <Badge tone="green">
                <UserCheck size={13} />
                Verified
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-700">{validator.role}</p>
          <p className="mt-1 text-xs text-slate-500">{validator.institution}</p>
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{validator.shortBio}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {expertise.map((item) => (
          <Badge key={item} tone="slate">{item}</Badge>
        ))}
        {extra > 0 ? <Badge tone="slate">+{extra} more</Badge> : null}
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2">
          <Languages size={16} className="text-primary" />
          {validator.languages.join(", ")}
        </span>
        <span className="inline-flex items-center gap-2">
          <Star size={16} className="fill-amber-300 text-amber-500" />
          {validator.rating} / {validator.completedValidations} validations
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarClock size={16} className="text-primary" />
          {validator.nextAvailable}
        </span>
        <span className="font-semibold text-slate-950">Starts at Rs {startingPrice}</span>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <Link href={`/dashboard/validation-hub/validators/${validator.id}`}>
          <Button className="w-full">View Profile</Button>
        </Link>
      </div>
    </Card>
  );
}
