import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ExternalLink, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import { ApplicationMethodBadge } from "@/components/opportunities/ApplicationMethodBadge";
import { OpportunityApplicationPanel } from "@/components/opportunities/OpportunityApplicationPanel";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { opportunities } from "@/lib/data";
import { validateExternalRegistrationUrl } from "@/lib/opportunities/application-methods";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = opportunities.find((item) => item.id === id);
  if (!opportunity) notFound();
  const isHackathon = opportunity.opportunity_type === "Hackathon";
  const officialWebsite = validateExternalRegistrationUrl(opportunity.official_website);
  const officialRules = validateExternalRegistrationUrl(opportunity.official_rules_url);

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
              <ApplicationMethodBadge method={opportunity.application_method} />
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
          <div className="flex items-center gap-3">
            {opportunity.organizer_logo ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-primary">
                {opportunity.organizer_logo}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader eyebrow={isHackathon ? "Official registration" : "Guidelines"} title={isHackathon ? "How registration works" : "Full application guidelines"} />
            <p className="text-sm leading-7 text-slate-600">{opportunity.guidelines}</p>
          </Card>
          <Card>
            <CardHeader eyebrow="Eligibility" title="Who can apply" />
            <p className="text-sm leading-7 text-slate-600">{opportunity.eligibility}</p>
          </Card>
          <Card>
            <CardHeader eyebrow={isHackathon ? "Prize details" : "Benefits"} title={isHackathon ? opportunity.prize_or_funding : "What selected founders receive"} />
            <p className="text-sm leading-7 text-slate-600">{opportunity.benefits}</p>
          </Card>
          {isHackathon ? (
            <>
              <Card>
                <CardHeader eyebrow="Event details" title="Format, dates, and team" />
                <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Dates: {opportunity.event_start_date ?? "TBA"} to {opportunity.event_end_date ?? "TBA"}</p>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Format: {opportunity.mode}</p>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Venue: {opportunity.venue ?? opportunity.location}</p>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Team size: {opportunity.team_size ?? "See official rules"}</p>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Registration fee: {opportunity.registration_fee ?? "See organiser page"}</p>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3">Deadline: {opportunity.deadline}</p>
                </div>
              </Card>
              <Card>
                <CardHeader eyebrow="Tracks and skills" title="What teams can build" />
                <div className="flex flex-wrap gap-2">
                  {opportunity.tracks?.map((track) => <Badge key={track}>{track}</Badge>)}
                  {opportunity.required_skills?.map((skill) => <Badge key={skill} tone="slate">{skill}</Badge>)}
                </div>
              </Card>
            </>
          ) : (
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
          )}
        </div>

        <aside className="space-y-4">
          <OpportunityApplicationPanel opportunity={opportunity} />
          <Card>
            <CardHeader eyebrow="Deadline" title={opportunity.deadline} />
            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2"><CalendarClock size={16} className="text-primary" /> Apply before the listed deadline.</p>
              <p className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {opportunity.location} / {opportunity.mode}</p>
              {opportunity.team_size ? <p className="flex items-center gap-2"><UsersRound size={16} className="text-primary" /> {opportunity.team_size}</p> : null}
              <p>Quality index: {opportunity.trust_score}/100</p>
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow="Organizer Contact" title="Public contact info" />
            <div className="space-y-3 text-sm text-slate-600">
              <p>{opportunity.contact_email ?? "Contact email not public."}</p>
              {officialWebsite.valid ? (
                <a href={officialWebsite.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary">
                  Official website
                  <ExternalLink size={14} />
                </a>
              ) : null}
              {officialRules.valid ? (
                <a href={officialRules.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary">
                  Official rules
                  <ExternalLink size={14} />
                </a>
              ) : null}
              <p>{opportunity.source_verification ?? (opportunity.verified ? "Source reviewed by Venture Connect." : "Source verification pending.")}</p>
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow="Trust" title="Application responsibility" />
            <p className="text-sm leading-6 text-slate-600">
              {opportunity.application_method === "idea_workspace_application"
                ? "This opportunity accepts a structured Idea Workspace application inside Venture Connect."
                : "Registration and organiser-side application status are managed outside Venture Connect."}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
