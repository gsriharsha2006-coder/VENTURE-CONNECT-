"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Building2, CheckCircle2, Languages, MapPin, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ValidationServiceCard } from "@/components/validation/ValidationServiceCard";
import { ValidatorAvatar } from "@/components/validation/ValidatorAvatar";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { getReviewsForValidator, getServicesForValidator, getValidatorById } from "@/lib/data/validations";

export default function ValidatorProfilePage() {
  const params = useParams<{ validatorId: string }>();
  const validator = getValidatorById(params.validatorId);

  if (!validator) {
    return (
      <ValidationEmptyState
        title="Validator profile not found"
        description="The selected validator may no longer be available for bookings."
      />
    );
  }

  const services = getServicesForValidator(validator);
  const reviews = getReviewsForValidator(validator.id);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="flex gap-5">
            <ValidatorAvatar name={validator.name} verified={validator.verified} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold text-slate-950">{validator.name}</h1>
                <Badge tone="green">
                  <ShieldCheck size={13} />
                  Verified identity
                </Badge>
                <Badge tone="slate">{validator.level}</Badge>
              </div>
              <p className="mt-2 text-base font-medium text-slate-700">{validator.role}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2"><Building2 size={16} className="text-primary" />{validator.institution}</span>
                <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-primary" />{validator.location}</span>
                <span className="inline-flex items-center gap-2"><Languages size={16} className="text-primary" />{validator.languages.join(", ")}</span>
                <span className="inline-flex items-center gap-2"><Star size={16} className="fill-amber-300 text-amber-500" />{validator.rating} rating / {validator.completedValidations} validations</span>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{validator.shortBio}</p>
            </div>
          </div>
          <Link href={`/dashboard/validation-hub/book/${validator.id}`} className="flex">
            <Button>
              <ShieldCheck size={16} />
              Book Validation
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="About" title="Professional background" />
            <p className="text-sm leading-6 text-slate-600">{validator.bio}</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {[
                ["Qualifications", validator.qualifications],
                ["Startup or industry experience", validator.industryExperience],
                ["R&D or incubation activities", validator.incubationActivities],
                ["Previous mentoring or validation experience", [validator.mentoringExperience]]
              ].map(([title, items]) => (
                <div key={title as string} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{title as string}</p>
                  <div className="mt-3 space-y-2">
                    {(items as string[]).map((item) => (
                      <p key={item} className="flex gap-2 text-sm leading-5 text-slate-600">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {validator.expertise.map((item) => (
                <Badge key={item} tone="slate">{item}</Badge>
              ))}
            </div>
          </Card>

          <section>
            <div className="mb-4">
              <Badge>Validation services</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">Choose the right depth of review</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {services.map((service) => (
                <ValidationServiceCard key={service.type} service={service} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Availability" title="Next open slot" />
            <p className="text-2xl font-semibold text-slate-950">{validator.nextAvailable}</p>
            <p className="mt-2 text-sm text-slate-600">Average response time: {validator.responseTime}</p>
            <Link href={`/dashboard/validation-hub/book/${validator.id}`}>
              <Button className="mt-5 w-full">Book Validation</Button>
            </Link>
          </Card>

          <Card>
            <CardHeader eyebrow="Reviews" title="Verified booking feedback" />
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-950">
                      <Star size={15} className="fill-amber-300 text-amber-500" />
                      {review.overallRating}
                    </span>
                    <Badge tone="green">Verified booking</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{review.writtenReview}</p>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500">
                    <span>Domain knowledge: {review.domainKnowledge}/5</span>
                    <span>Usefulness: {review.usefulness}/5</span>
                    <span>Clarity: {review.clarity}/5</span>
                    <span>Report quality: {review.reportQuality}/5</span>
                    <span>Punctuality: {review.punctuality}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
