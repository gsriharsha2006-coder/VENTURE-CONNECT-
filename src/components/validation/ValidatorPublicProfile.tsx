import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
  UsersRound
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ValidationEmptyState } from "@/components/validation/ValidationEmptyState";
import { ValidatorAvatar } from "@/components/validation/ValidatorAvatar";
import { getReviewsForValidator, getServicesForValidator, getValidatorById } from "@/lib/data/validations";
import {
  getValidatorTrustPresentation,
  PUBLIC_VALIDATOR_EMPTY_STATE
} from "@/lib/validation/trust";

const serviceNames = {
  "Written Idea Review": "Written Review",
  "Live Validation Session": "Live Validation",
  "Expert Validation": "Expert Validation"
} as const;

export function ValidatorPublicProfile({ validatorId }: { validatorId: string }) {
  const validator = getValidatorById(validatorId);

  if (!validator) {
    return (
      <ValidationEmptyState
        title={PUBLIC_VALIDATOR_EMPTY_STATE.title}
        description={PUBLIC_VALIDATOR_EMPTY_STATE.description}
      />
    );
  }

  const services = getServicesForValidator(validator);
  const trust = getValidatorTrustPresentation(validator);
  const reviews = getReviewsForValidator(validator.id).filter((review) =>
    validator.isDemo ? review.isDemo : review.verifiedBooking && !review.isDemo
  );

  return (
    <div className="space-y-8">
      <section className="border-b border-slate-200 pb-8">
        <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-start">
          <div className="flex flex-col gap-6 sm:flex-row">
            <ValidatorAvatar
              name={validator.name}
              photoUrl={validator.photoUrl}
              verified={trust.showVerifiedBadge}
              size="xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {trust.profileBadge ? (
                  <Badge tone={validator.isDemo ? "amber" : "green"}>
                    {trust.showVerifiedBadge ? <ShieldCheck aria-hidden="true" size={13} /> : null}
                    {trust.profileBadge}
                  </Badge>
                ) : null}
                <Badge tone="slate">{validator.level}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{validator.name}</h1>
              <p className="mt-2 text-base font-semibold text-slate-700">{validator.role}</p>
              {trust.showOrganisationAffiliation ? (
                <p className="mt-1 text-sm text-slate-600">{validator.organisationAffiliation}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" size={16} className="text-primary" />{validator.location}</span>
                <span className="inline-flex items-center gap-2"><Languages aria-hidden="true" size={16} className="text-primary" />{validator.languages.join(", ")}</span>
                <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" size={16} className="text-primary" />Responds in {validator.responseTime}</span>
              </div>
            </div>
          </div>

          {trust.showVerifiedStatistics ? (
            <div className="grid min-w-full grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:min-w-[340px]">
              <div className="bg-white p-4">
                <p className="flex items-center gap-1 text-2xl font-semibold"><Star aria-hidden="true" size={19} className="fill-amber-300 text-amber-500" />{validator.averageRating}</p>
                <p className="mt-1 text-xs text-slate-500">Founder rating</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-2xl font-semibold">{validator.completedValidations}</p>
                <p className="mt-1 text-xs text-slate-500">Completed validations</p>
              </div>
            </div>
          ) : (
            <div className="min-w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:min-w-[340px]">
              Ratings and completed-validation statistics are not yet available.
            </div>
          )}
        </div>
        <p className="mt-7 max-w-4xl text-base leading-7 text-slate-600">{validator.bio}</p>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <section>
            <div className="mb-5">
              <p className="text-sm font-semibold text-primary">Professional background</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Qualifications and activities</h2>
            </div>
            {validator.isDemo ? (
              <ValidationEmptyState
                title="Sample expertise only"
                description="Demo profiles do not contain qualifications, employment history, institutional affiliations, or performance evidence."
              />
            ) : (
              <div className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 md:grid-cols-2">
                {[
                  { title: "Qualifications", items: validator.qualifications, icon: GraduationCap },
                  { title: "Industry experience", items: validator.industryExperience, icon: Building2 },
                  { title: "R&D and incubation", items: validator.incubationActivities, icon: UsersRound },
                  { title: "Validation experience", items: [validator.mentoringExperience], icon: ShieldCheck }
                ].map(({ title, items, icon: Icon }) => (
                  <div key={title} className="bg-white p-5">
                    <p className="flex items-center gap-2 font-semibold text-slate-950">
                      <Icon aria-hidden="true" size={18} className="text-primary" />
                      {title}
                    </p>
                    <div className="mt-4 space-y-3">
                      {items.map((item) => (
                        <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                          <CheckCircle2 aria-hidden="true" size={16} className="mt-1 shrink-0 text-emerald-600" />
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {validator.expertise.map((item) => <Badge key={item} tone="slate">{item}</Badge>)}
            </div>
          </section>

          <section>
            <div className="mb-5">
              <p className="text-sm font-semibold text-primary">Validation services</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Choose the depth of review you need</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.type} className="flex h-full flex-col p-5">
                  <p className="text-sm font-semibold text-primary">{serviceNames[service.type]}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">₹{service.founderPrice}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{service.expectedDelivery}</p>
                  <div className="mt-5 flex-1 space-y-3">
                    {service.deliverables.slice(0, 4).map((deliverable) => (
                      <p key={deliverable} className="flex gap-2 text-sm leading-5 text-slate-600">
                        <CheckCircle2 aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                        {deliverable}
                      </p>
                    ))}
                  </div>
                  <Link href={`/dashboard/validation-hub/book/${validator.id}?service=${encodeURIComponent(service.type)}`} className="mt-5">
                    <Button variant={service.type === "Expert Validation" ? "primary" : "secondary"} className="w-full">
                      Select service
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-5">
              <p className="text-sm font-semibold text-primary">{trust.reviewHeading}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {validator.isDemo ? "Synthetic examples for interface testing" : "Feedback from completed bookings"}
              </h2>
            </div>
            {reviews.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1 text-lg font-semibold">
                        <Star aria-hidden="true" size={17} className="fill-amber-300 text-amber-500" />
                        {review.overallRating}
                      </span>
                      <Badge tone={validator.isDemo ? "amber" : "green"}>{trust.reviewBadge}</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-700">{review.writtenReview}</p>
                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
                      <span>Domain knowledge {review.domainKnowledge}/5</span>
                      <span>Usefulness {review.usefulness}/5</span>
                      <span>Clarity {review.clarity}/5</span>
                      <span>Report quality {review.reportQuality}/5</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <ValidationEmptyState title="No public reviews yet" description="Reviews will appear only after eligible completed bookings." />
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader eyebrow="Availability" title="Book this validator" />
            <p className="text-2xl font-semibold text-slate-950">{validator.nextAvailable}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Select a service, share one Idea Workspace version, and review the scope before payment.
            </p>
            <Link href={`/dashboard/validation-hub/book/${validator.id}`}>
              <Button size="lg" className="mt-5 w-full">
                Book Validation
                <ArrowRight aria-hidden="true" size={17} />
              </Button>
            </Link>
          </Card>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            Your document stays private. Access opens only for the assigned validator after booking acceptance.
          </div>
        </aside>
      </div>
    </div>
  );
}
