import Link from "next/link";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { ValidatorCard } from "@/components/validation/ValidatorCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/FeedbackState";
import { getValidatorDirectory } from "@/lib/data/validations";
import { isDemoDataEnabled } from "@/lib/demo-data";

export default function PublicValidatorDirectoryPage() {
  const demoEnabled = isDemoDataEnabled();
  const validators = getValidatorDirectory(demoEnabled);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <Badge tone={demoEnabled ? "amber" : "slate"}>
            <ShieldCheck aria-hidden="true" size={13} />
            {demoEnabled ? "Demonstration directory" : "Approval-based directory"}
          </Badge>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">Human validation with visible scope and evidence</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Approved profiles will show expertise, review format, availability, price, and verification state. Ratings and completed-work statistics appear only when supported by eligible records.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {validators.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {validators.map((validator) => <ValidatorCard key={validator.id} validator={validator} />)}
          </div>
        ) : (
          <EmptyState
            title="No approved validators are currently available"
            description="The directory will open after validator identity, expertise, service scope, and availability records have been reviewed. Venture Connect does not substitute synthetic profiles."
            icon={Search}
            action={(
              <Link href="/auth/register">
                <Button>
                  Register your interest
                  <ArrowRight aria-hidden="true" size={16} />
                </Button>
              </Link>
            )}
          />
        )}

        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 md:grid-cols-3">
          {[
            ["Private by default", "A founder selects the document version shared for review."],
            ["Evidence-based status", "Verification and review labels require supporting database records."],
            ["No guaranteed outcome", "Validation provides feedback; it does not promise funding or programme acceptance."]
          ].map(([title, description]) => (
            <div key={title} className="bg-white p-5">
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
