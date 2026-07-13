"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  CalendarClock,
  ExternalLink,
  Filter,
  MapPin,
  Search,
  Send,
  Share2,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useDemoPlan } from "@/hooks/useDemoPlan";
import { applyToOpportunity } from "@/lib/data/applications";
import { ideaWorkspaces, opportunities as seedOpportunities } from "@/lib/data";
import { getOpportunities } from "@/lib/data/opportunities";
import { PLAN_LIMITS } from "@/lib/subscription/plans";
import { completionPercent, missingRequiredSections } from "@/lib/templates";
import type { DomainTag, OpportunityMode, OpportunityType, StartupStage } from "@/lib/types";

const opportunityTypes: Array<"All" | OpportunityType> = [
  "All",
  "Investor opportunity",
  "Incubator program",
  "Accelerator program",
  "Hackathon",
  "Startup event",
  "Company challenge/debug challenge",
  "Grants",
  "Competitions",
  "Fellowships",
  "AI challenges"
];

const domains: Array<"All" | DomainTag> = ["All", "AI", "SaaS", "FinTech", "HealthTech", "EdTech", "DeepTech", "AgriTech", "Consumer", "Social Impact"];
const modes: Array<"All" | OpportunityMode> = ["All", "Remote", "Hybrid", "Offline"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"] as const;
const stages: Array<"All" | StartupStage | "Any"> = ["All", "Any", "Idea", "Prototype", "MVP", "Revenue", "Seed"];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState(seedOpportunities);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof opportunityTypes)[number]>("All");
  const [domain, setDomain] = useState<(typeof domains)[number]>("All");
  const [mode, setMode] = useState<(typeof modes)[number]>("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState<(typeof levels)[number]>("All");
  const [stage, setStage] = useState<(typeof stages)[number]>("All");
  const [fundingQuery, setFundingQuery] = useState("");
  const [eligibilityQuery, setEligibilityQuery] = useState("");
  const [deadlineQuery, setDeadlineQuery] = useState("");
  const [workspaceId, setWorkspaceId] = useState(ideaWorkspaces[0].id);
  const [applied, setApplied] = useState<string[]>([]);
  const [warning, setWarning] = useState("");
  const [loadError, setLoadError] = useState("");
  const [plan, setPlan] = useDemoPlan();
  const categories = useMemo(() => ["All", ...Array.from(new Set(opportunities.map((item) => item.category)))], [opportunities]);

  useEffect(() => {
    let mounted = true;
    void getOpportunities().then((items) => {
      if (mounted) {
        setOpportunities(items);
        setLoadError("");
      }
    }).catch((error) => {
      if (mounted) setLoadError(error instanceof Error ? error.message : "Unable to load opportunities from Supabase.");
    });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedWorkspace = ideaWorkspaces.find((workspace) => workspace.id === workspaceId) ?? ideaWorkspaces[0];
  const selectedCompletion = completionPercent(selectedWorkspace.sections, selectedWorkspace.template);

  const filtered = useMemo(
    () =>
      opportunities.filter((opportunity) => {
        const haystack = `${opportunity.title} ${opportunity.organizer_name} ${opportunity.opportunity_type} ${opportunity.tags.join(" ")}`.toLowerCase();
        return (
          haystack.includes(query.toLowerCase()) &&
          (type === "All" || opportunity.opportunity_type === type) &&
          (domain === "All" || opportunity.domain === domain) &&
          (mode === "All" || opportunity.mode === mode) &&
          (category === "All" || opportunity.category === category) &&
          (level === "All" || opportunity.beginnerLevel === level) &&
          (stage === "All" || opportunity.startupStage === stage || opportunity.startupStage === "Any") &&
          opportunity.prize_or_funding.toLowerCase().includes(fundingQuery.toLowerCase()) &&
          opportunity.eligibility.toLowerCase().includes(eligibilityQuery.toLowerCase()) &&
          opportunity.deadline.toLowerCase().includes(deadlineQuery.toLowerCase()) &&
          (!verifiedOnly || opportunity.verified) &&
          (!trendingOnly || opportunity.trending)
        );
      }),
    [category, deadlineQuery, domain, eligibilityQuery, fundingQuery, level, mode, opportunities, query, stage, trendingOnly, type, verifiedOnly]
  );

  function toggleSaved(id: string) {
    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === id
          ? { ...opportunity, saved: !opportunity.saved, bookmarked: !opportunity.saved }
          : opportunity
      )
    );
  }

  function apply(opportunityId: string) {
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    if (!opportunity) return;
    const monthlyLimit = PLAN_LIMITS[plan].opportunitySubmissionsPerMonth;
    if (!applied.includes(opportunityId) && applied.length >= monthlyLimit) {
      setWarning(`${plan} allows ${monthlyLimit} opportunity submission${monthlyLimit === 1 ? "" : "s"} per month. Upgrade or wait for the monthly reset.`);
      return;
    }
    const eventException = opportunity.opportunity_type === "Startup event";

    if (!eventException && selectedCompletion < 100) {
      const missing = missingRequiredSections(selectedWorkspace.sections, selectedWorkspace.template)
        .map((section) => section.label)
        .join(", ");
      setWarning(`Complete your Idea Workspace document before applying. Missing sections: ${missing}.`);
      return;
    }

    setApplied((current) => (current.includes(opportunityId) ? current : [opportunityId, ...current]));
    void applyToOpportunity({
      opportunityId,
      ideaWorkspaceId: eventException ? null : selectedWorkspace.id,
      isEventApplication: eventException
    });
    setWarning(eventException ? "Event application submitted after guidelines review. Idea Workspace was not required." : "Application submitted with completed Idea Workspace document.");
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge>Opportunities</Badge>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Demo plan</span>
            <select
              aria-label="Demo subscription plan"
              value={plan}
              onChange={(event) => setPlan(event.target.value as "Free" | "Student Pro" | "Founder Pro")}
              className="bg-transparent text-sm font-semibold text-slate-900 outline-none"
            >
              <option>Free</option>
              <option>Student Pro</option>
              <option>Founder Pro</option>
            </select>
          </label>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Structured opportunity discovery and applications</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Browse investor opportunities, incubator programs, hackathons, grants, competitions, fellowships, AI challenges, and events. Non-event applications require a complete Idea Workspace document.
        </p>
      </motion.div>

      {loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{loadError}</div>
      ) : null}

      <Card>
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_180px_160px_auto]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Search size={17} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search title, organizer, tags..." />
          </label>
          <select value={type} onChange={(event) => setType(event.target.value as (typeof opportunityTypes)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none">
            {opportunityTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={domain} onChange={(event) => setDomain(event.target.value as (typeof domains)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none">
            {domains.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={mode} onChange={(event) => setMode(event.target.value as (typeof modes)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none">
            {modes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Button variant={verifiedOnly ? "primary" : "secondary"} onClick={() => setVerifiedOnly((value) => !value)}>
            <Filter size={16} />
            Verified only
          </Button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={level} onChange={(event) => setLevel(event.target.value as (typeof levels)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            {levels.map((item) => <option key={item} value={item}>{item === "All" ? "All difficulty levels" : item}</option>)}
          </select>
          <select value={stage} onChange={(event) => setStage(event.target.value as (typeof stages)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            {stages.map((item) => <option key={item} value={item}>{item === "All" ? "All startup stages" : item}</option>)}
          </select>
          <Button variant={trendingOnly ? "primary" : "secondary"} onClick={() => setTrendingOnly((value) => !value)}>
            <TrendingUp size={16} />
            Trending
          </Button>
          <input value={deadlineQuery} onChange={(event) => setDeadlineQuery(event.target.value)} placeholder="Deadline (e.g. Jul)" className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none" />
          <input value={fundingQuery} onChange={(event) => setFundingQuery(event.target.value)} placeholder="Funding, prize, or grant" className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none" />
          <input value={eligibilityQuery} onChange={(event) => setEligibilityQuery(event.target.value)} placeholder="Eligibility" className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none" />
          <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50 px-3 text-sm text-blue-900">
            {applied.length}/{PLAN_LIMITS[plan].opportunitySubmissionsPerMonth} monthly submissions used
          </div>
        </div>
      </Card>

      {warning ? (
        <div className={`rounded-lg border p-4 text-sm ${warning.includes("submitted") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {warning}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((opportunity) => {
            const didApply = applied.includes(opportunity.id);
            return (
              <Card key={opportunity.id} className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge>{opportunity.opportunity_type}</Badge>
                      {opportunity.verified ? (
                        <Badge tone="green">
                          <ShieldCheck size={13} />
                          Verified
                        </Badge>
                      ) : null}
                      {opportunity.trending ? (
                        <Badge tone="amber">
                          <TrendingUp size={13} />
                          Trending
                        </Badge>
                      ) : null}
                    </div>
                    <h2 className="text-base font-semibold text-slate-950">{opportunity.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{opportunity.organizer_name} / {opportunity.organizer_type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" aria-label="Save opportunity" onClick={() => toggleSaved(opportunity.id)} className={`rounded-lg border p-2 transition ${opportunity.saved ? "border-blue-200 bg-blue-50 text-primary" : "border-slate-200 text-slate-500 hover:border-blue-200"}`}>
                      <Bookmark size={17} />
                    </button>
                    <button type="button" aria-label="Share opportunity" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200">
                      <Share2 size={17} />
                    </button>
                  </div>
                </div>

                <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{opportunity.guidelines}</p>

                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-primary" />{opportunity.location} / {opportunity.mode}</span>
                  <span className="inline-flex items-center gap-2"><CalendarClock size={16} className="text-primary" />{opportunity.deadline}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {opportunity.tags.map((tag) => <Badge key={tag} tone="slate">{tag}</Badge>)}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{opportunity.prize_or_funding}</p>
                    <p className="text-xs text-slate-500">Quality index {opportunity.trust_score}/100</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/opportunities/${opportunity.id}`}>
                      <Button size="sm" variant="secondary">
                        <ExternalLink size={14} />
                        Details
                      </Button>
                    </Link>
                    <Button size="sm" onClick={() => apply(opportunity.id)} variant={didApply ? "secondary" : "primary"}>
                      {didApply ? "Applied" : "Apply"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader eyebrow="Application Document" title="Selected Idea Workspace" />
            <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none">
              {ideaWorkspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
              ))}
            </select>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Completion</span>
                <span>{selectedCompletion}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-primary" style={{ width: `${selectedCompletion}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Events can be submitted after reading guidelines. All other opportunity types require 100% completion.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Applied" title="Application status" />
            <div className="space-y-3">
              {applied.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No applications submitted in this session yet.</p>
              ) : (
                applied.map((id) => {
                  const opportunity = opportunities.find((item) => item.id === id);
                  return opportunity ? (
                    <div key={id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <Send size={17} className="mt-0.5 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{opportunity.title}</p>
                        <p className="text-xs text-slate-500">Status: Submitted</p>
                      </div>
                    </div>
                  ) : null;
                })
              )}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="Saved" title="Bookmarked opportunities" />
            <div className="space-y-3">
              {opportunities.filter((item) => item.saved).map((opportunity) => (
                <div key={opportunity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-950">{opportunity.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{opportunity.opportunity_type} / {opportunity.deadline}</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
