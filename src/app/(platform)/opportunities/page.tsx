"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, CalendarClock, MapPin, Search, Share2, ShieldCheck } from "lucide-react";
import { ApplicationMethodBadge } from "@/components/opportunities/ApplicationMethodBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOpportunities } from "@/lib/data/opportunities";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { opportunities as demoOpportunities } from "@/lib/data";
import { getOpportunityApplicationMethod } from "@/lib/opportunities/application-methods";
import { isPilotOpportunityType } from "@/lib/pilot/config";
import type { Opportunity, OpportunityMode } from "@/lib/types";

type Category = "Incubation Programs" | "Hackathons";
const modes: Array<"All" | OpportunityMode> = ["All", "Remote", "Hybrid", "Offline"];

function categoryFor(opportunity: Opportunity): Category {
  return opportunity.opportunity_type === "Hackathon" ? "Hackathons" : "Incubation Programs";
}

function applicationHref(opportunity: Opportunity) {
  const method = getOpportunityApplicationMethod(opportunity);
  if (method === "idea_workspace_application") return `/dashboard/opportunities/${opportunity.id}/apply`;
  if (method === "internal_registration") return `/dashboard/opportunities/${opportunity.id}/register`;
  return `/dashboard/opportunities/${opportunity.id}`;
}

export default function OpportunitiesPage() {
  const demoEnabled = isDemoDataEnabled();
  const [opportunities, setOpportunities] = useState<Opportunity[]>(demoEnabled ? demoOpportunities.filter((item) => isPilotOpportunityType(item.opportunity_type)) : []);
  const [category, setCategory] = useState<Category>("Incubation Programs");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [college, setCollege] = useState("");
  const [deadline, setDeadline] = useState("");
  const [mode, setMode] = useState<(typeof modes)[number]>("All");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getOpportunities()
      .then((rows) => { if (active) setOpportunities(rows.filter((item) => isPilotOpportunityType(item.opportunity_type))); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Opportunities could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => opportunities.filter((opportunity) => {
    const text = `${opportunity.title} ${opportunity.organizer_name} ${opportunity.guidelines} ${opportunity.tags.join(" ")}`.toLowerCase();
    return categoryFor(opportunity) === category &&
      text.includes(query.toLowerCase()) &&
      opportunity.location.toLowerCase().includes(location.toLowerCase()) &&
      opportunity.eligibility.toLowerCase().includes(college.toLowerCase()) &&
      opportunity.deadline.toLowerCase().includes(deadline.toLowerCase()) &&
      (mode === "All" || opportunity.mode === mode);
  }), [category, college, deadline, location, mode, opportunities, query]);

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function share(opportunity: Opportunity) {
    const url = `${window.location.origin}/dashboard/opportunities/${opportunity.id}`;
    try {
      if (navigator.share) await navigator.share({ title: opportunity.title, url });
      else await navigator.clipboard.writeText(url);
      setNotice("Opportunity link ready to share.");
    } catch {
      setNotice("Sharing was cancelled.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Opportunities" title="Incubation programs and hackathons" description="Find relevant programmes, review eligibility, and use the correct application flow for each opportunity." />
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}

      <Card>
        <div role="tablist" aria-label="Opportunity categories" className="grid gap-2 sm:grid-cols-2">
          {(["Incubation Programs", "Hackathons"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold ${category === item ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{item}</button>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 xl:col-span-2"><Search size={16} className="text-slate-400" /><input aria-label="Search opportunities" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or organisation" className="w-full bg-transparent text-sm outline-none" /></label>
          <input aria-label="Location filter" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" className="h-11 rounded-lg border border-slate-200 px-3 text-sm" />
          <select aria-label="Mode filter" value={mode} onChange={(event) => setMode(event.target.value as (typeof modes)[number])} className="h-11 rounded-lg border border-slate-200 px-3 text-sm">{modes.map((item) => <option key={item}>{item === "All" ? "All modes" : item}</option>)}</select>
          <input aria-label="Deadline filter" value={deadline} onChange={(event) => setDeadline(event.target.value)} placeholder="Deadline" className="h-11 rounded-lg border border-slate-200 px-3 text-sm" />
          <input aria-label="College eligibility filter" value={college} onChange={(event) => setCollege(event.target.value)} placeholder="College eligibility" className="h-11 rounded-lg border border-slate-200 px-3 text-sm md:col-span-2 xl:col-span-5" />
        </div>
      </Card>

      {loading ? <StatusMessage>Loading published opportunities...</StatusMessage> : null}
      {!loading && !filtered.length ? <Card><CardHeader eyebrow="No results" title={`No ${category.toLowerCase()} match these filters`} /><p className="text-sm text-slate-600">Clear one or more filters and try again.</p></Card> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((opportunity) => {
          const method = getOpportunityApplicationMethod(opportunity);
          return (
            <Card key={opportunity.id} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2"><Badge>{categoryFor(opportunity) === "Hackathons" ? "Hackathon" : "Incubation Program"}</Badge><ApplicationMethodBadge method={method} />{opportunity.verified ? <Badge tone="green"><ShieldCheck size={13} />Verified</Badge> : null}</div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{opportunity.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{opportunity.organizer_name}</p>
                </div>
                <button type="button" aria-label={saved.has(opportunity.id) ? "Remove saved opportunity" : "Save opportunity"} onClick={() => toggleSaved(opportunity.id)} className={`rounded-lg border p-2 ${saved.has(opportunity.id) ? "border-primary bg-blue-50 text-primary" : "border-slate-200 text-slate-500"}`}><Bookmark size={17} /></button>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{opportunity.guidelines}</p>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm"><strong>Eligibility:</strong> {opportunity.eligibility}</div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><span className="inline-flex items-center gap-2"><MapPin size={15} />{opportunity.location} / {opportunity.mode}</span><span className="inline-flex items-center gap-2"><CalendarClock size={15} />{opportunity.deadline}</span></div>
              <p className="mt-3 text-xs font-medium text-slate-500">Application method: {method === "idea_workspace_application" ? "Apply with Idea and Application Quality Check" : method === "internal_registration" ? "Venture Connect registration form" : "Official organiser website"}</p>
              <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-200 pt-5">
                <Link href={`/dashboard/opportunities/${opportunity.id}`}><Button variant="secondary" className="w-full">View Details</Button></Link>
                <Link href={applicationHref(opportunity)}><Button className="w-full">Apply</Button></Link>
                <Button variant="secondary" aria-label="Share opportunity" onClick={() => void share(opportunity)}><Share2 size={16} />Share</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
