import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { opportunities } from "@/lib/data";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = opportunities.find((item) => item.id === id);
  if (!opportunity) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/opportunities" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
        <ArrowLeft size={16} />
        Back to opportunities
      </Link>

      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{opportunity.opportunity_type}</Badge>
              {opportunity.verified ? (
                <Badge tone="green">
                  <ShieldCheck size={13} />
                  Verified
                </Badge>
              ) : null}
              {opportunity.trending ? <Badge tone="amber">Trending</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">{opportunity.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {opportunity.organizer_name} / {opportunity.organizer_type}
            </p>
          </div>
          <Button>
            Apply
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow="Guidelines" title="Full application guidelines" />
            <p className="text-sm leading-7 text-slate-600">{opportunity.guidelines}</p>
          </Card>
          <Card>
            <CardHeader eyebrow="Eligibility" title="Who can apply" />
            <p className="text-sm leading-7 text-slate-600">{opportunity.eligibility}</p>
          </Card>
          <Card>
            <CardHeader eyebrow="Benefits" title="What selected founders receive" />
            <p className="text-sm leading-7 text-slate-600">{opportunity.benefits}</p>
          </Card>
          <Card>
            <CardHeader eyebrow="Application Requirements" title="Required packet" />
            <div className="grid gap-3 md:grid-cols-2">
              {opportunity.requirements.map((requirement) => (
                <div key={requirement} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                  {requirement}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Deadline" title={opportunity.deadline} />
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2"><CalendarClock size={16} className="text-primary" /> Apply before the listed deadline.</p>
              <p className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {opportunity.location} / {opportunity.mode}</p>
              <p>Quality index: {opportunity.trust_score}/100</p>
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow="Organizer Contact" title="Public contact info" />
            <div className="space-y-3 text-sm text-slate-600">
              <p>{opportunity.contact_email ?? "Contact email not public."}</p>
              {opportunity.external_link ? (
                <a href={opportunity.external_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary">
                  Organizer link
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow="Rule" title="Application gate" />
            <p className="text-sm leading-6 text-slate-600">
              {opportunity.opportunity_type === "Startup event"
                ? "Events can be applied to after reading guidelines. Idea Workspace is recommended but not required."
                : "This opportunity requires a completed Idea Workspace document before submission."}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
