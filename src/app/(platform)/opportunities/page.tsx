"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Filter,
  MapPin,
  Search,
  Share2,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { ApplicationMethodBadge } from "@/components/opportunities/ApplicationMethodBadge";
import { ExternalRegistrationDialog } from "@/components/opportunities/ExternalRegistrationDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SponsoredCard } from "@/components/ads/SponsoredCard";
import { useDemoPlan } from "@/hooks/useDemoPlan";
import { externalRegistrations, ideaWorkspaces as seedWorkspaces, opportunities as seedOpportunities } from "@/lib/data";
import { getIdeaWorkspaces } from "@/lib/data/ideaWorkspaces";
import {
  getExternalRegistrations,
  recordOpportunityEvent,
  updateExternalRegistration
} from "@/lib/data/opportunity-tracking";
import { getBadgesForWorkspace } from "@/lib/data/validations";
import { getOpportunities } from "@/lib/data/opportunities";
import { getSponsoredCreatives } from "@/lib/data/ads";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { completionPercent } from "@/lib/templates";
import {
  applicationMethodUsesInternalForm,
  getOpportunityApplicationMethod,
  isExternallyManagedApplication
} from "@/lib/opportunities/application-methods";
import type { SponsoredCreative } from "@/lib/ads/types";
import type { DomainTag, IdeaWorkspaceItem, OpportunityMode, OpportunityType, StartupStage } from "@/lib/types";

const opportunityTypes: Array<"All" | OpportunityType> = [
  "All",
  "Investor opportunity",
  "Incubator program",
  "Accelerator program",
  "Hackathon",
  "Startup competition",
  "Workshop",
  "Webinar",
  "Networking event",
  "Startup event",
  "Company challenge/debug challenge",
  "Grants",
  "Competitions",
  "Fellowships",
  "AI challenges",
  "Other"
];

const domains: Array<"All" | DomainTag> = ["All", "AI", "SaaS", "FinTech", "HealthTech", "EdTech", "DeepTech", "AgriTech", "Consumer", "Social Impact"];
const modes: Array<"All" | OpportunityMode> = ["All", "Remote", "Hybrid", "Offline"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"] as const;
const stages: Array<"All" | StartupStage | "Any"> = ["All", "Any", "Idea", "Prototype", "MVP", "Revenue", "Seed"];

export default function OpportunitiesPage() {
  const demoEnabled = isDemoDataEnabled();
  const [opportunities, setOpportunities] = useState(demoEnabled ? seedOpportunities : []);
  const [workspaces, setWorkspaces] = useState<IdeaWorkspaceItem[]>(demoEnabled ? seedWorkspaces : []);
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
  const [workspaceId, setWorkspaceId] = useState((demoEnabled ? seedWorkspaces[0]?.id : "") ?? "");
  const [externalStatuses, setExternalStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(getExternalRegistrations(demoEnabled ? externalRegistrations : []).map((item) => [item.opportunity_id, item.status]))
  );
  const [externalConfirmId, setExternalConfirmId] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedPromotion, setFeedPromotion] = useState<SponsoredCreative | null>(null);
  const [sidebarPromotion, setSidebarPromotion] = useState<SponsoredCreative | null>(null);
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
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([getSponsoredCreatives("opportunity_feed"), getSponsoredCreatives("opportunity_sidebar")]).then(([feed, sidebar]) => {
      if (!active) return;
      setFeedPromotion(feed[0] ?? null);
      setSidebarPromotion(sidebar[0] ?? null);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    void getIdeaWorkspaces().then((items) => {
      if (!mounted) return;
      setWorkspaces(items);
      setWorkspaceId((current) => current || items[0]?.id || "");
    }).catch((error) => {
      if (mounted) setLoadError(error instanceof Error ? error.message : "Unable to load Idea Workspace documents.");
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setExternalStatuses(
      Object.fromEntries(getExternalRegistrations(demoEnabled ? externalRegistrations : []).map((item) => [item.opportunity_id, item.status]))
    );
  }, [demoEnabled]);

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0];
  const selectedCompletion = selectedWorkspace ? completionPercent(selectedWorkspace.sections, selectedWorkspace.template) : 0;
  const selectedBadges = selectedWorkspace ? getBadgesForWorkspace(selectedWorkspace.id) : [];

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
  const hasActiveFilters = Boolean(
    query || type !== "All" || domain !== "All" || mode !== "All" || category !== "All" || level !== "All" || stage !== "All" ||
    fundingQuery || eligibilityQuery || deadlineQuery || verifiedOnly || trendingOnly
  );

  function clearFilters() {
    setQuery("");
    setType("All");
    setDomain("All");
    setMode("All");
    setCategory("All");
    setLevel("All");
    setStage("All");
    setFundingQuery("");
    setEligibilityQuery("");
    setDeadlineQuery("");
    setVerifiedOnly(false);
    setTrendingOnly(false);
  }

  function toggleSaved(id: string) {
    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === id
          ? { ...opportunity, saved: !opportunity.saved, bookmarked: !opportunity.saved }
          : opportunity
      )
    );
    void recordOpportunityEvent({ opportunityId: id, eventType: "opportunity_saved", referralSource: "opportunity_marketplace" });
  }

  async function continueExternalRegistration(opportunityId: string, destination: { url: string; domain: string }) {
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    if (!opportunity) return;
    setExternalConfirmId(null);
    const opened = window.open(destination.url, "_blank", "noopener,noreferrer");
    if (opened) opened.opener = null;
    await recordOpportunityEvent({
      opportunityId,
      eventType: "official_registration_clicked",
      referralSource: "opportunity_marketplace"
    });
    await updateExternalRegistration({
      opportunityId,
      opportunityTitle: opportunity.title,
      organizerName: opportunity.organizer_name,
      status: "Registration Opened"
    });
    setExternalStatuses((current) => ({ ...current, [opportunityId]: "Registration Opened" }));
    setWarning(`Registration opened on ${destination.domain}. Complete the organiser form, then return to mark it as applied.`);
  }

  async function markExternalApplied(opportunityId: string) {
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    if (!opportunity) return;
    await updateExternalRegistration({
      opportunityId,
      opportunityTitle: opportunity.title,
      organizerName: opportunity.organizer_name,
      status: "Applied Externally"
    });
    setExternalStatuses((current) => ({ ...current, [opportunityId]: "Applied Externally" }));
    setWarning("External registration marked as applied and labelled Tracked by You. The organiser has not verified this status.");
  }

  const externalConfirmOpportunity = opportunities.find((item) => item.id === externalConfirmId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Opportunities"
        title="Discover the right programme, investor, or event."
        description="Every listing shows whether you apply inside Venture Connect or continue to an organiser-managed registration page."
        actions={demoEnabled ? (
          <label className="flex h-10 items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3">
            <span className="text-sm font-medium text-blue-700">Demo plan</span>
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
        ) : undefined}
      />

      {loading ? (
        <StatusMessage>Loading the latest opportunity methods and deadlines...</StatusMessage>
      ) : null}

      {loadError ? (
        <StatusMessage tone="error">{loadError}</StatusMessage>
      ) : null}

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">Find the right opportunity</p>
            <p className="mt-1 text-xs text-slate-500">{filtered.length} result{filtered.length === 1 ? "" : "s"} match your filters</p>
          </div>
          {hasActiveFilters ? (
            <Button size="sm" variant="ghost" onClick={clearFilters}>Reset filters</Button>
          ) : null}
        </div>
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_180px_160px_auto]">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100">
            <Search size={17} className="text-slate-400" />
            <input aria-label="Search opportunities" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search title, organizer, tags..." />
          </label>
          <select aria-label="Opportunity type" value={type} onChange={(event) => setType(event.target.value as (typeof opportunityTypes)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none">
            {opportunityTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Opportunity domain" value={domain} onChange={(event) => setDomain(event.target.value as (typeof domains)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none">
            {domains.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Opportunity mode" value={mode} onChange={(event) => setMode(event.target.value as (typeof modes)[number])} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none">
            {modes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Button variant={verifiedOnly ? "primary" : "secondary"} onClick={() => setVerifiedOnly((value) => !value)}>
            <Filter size={16} />
            Verified only
          </Button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select aria-label="Opportunity category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Difficulty level" value={level} onChange={(event) => setLevel(event.target.value as (typeof levels)[number])} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
            {levels.map((item) => <option key={item} value={item}>{item === "All" ? "All difficulty levels" : item}</option>)}
          </select>
          <select aria-label="Startup stage" value={stage} onChange={(event) => setStage(event.target.value as (typeof stages)[number])} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
            {stages.map((item) => <option key={item} value={item}>{item === "All" ? "All startup stages" : item}</option>)}
          </select>
          <Button variant={trendingOnly ? "primary" : "secondary"} onClick={() => setTrendingOnly((value) => !value)}>
            <TrendingUp size={16} />
            Trending
          </Button>
          <input aria-label="Deadline filter" value={deadlineQuery} onChange={(event) => setDeadlineQuery(event.target.value)} placeholder="Deadline (e.g. Jul)" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none" />
          <input aria-label="Funding filter" value={fundingQuery} onChange={(event) => setFundingQuery(event.target.value)} placeholder="Funding, prize, or grant" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none" />
          <input aria-label="Eligibility filter" value={eligibilityQuery} onChange={(event) => setEligibilityQuery(event.target.value)} placeholder="Eligibility" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none" />
        </div>
      </Card>

      {warning ? (
        <div role="status" className={`rounded-lg border p-4 text-sm ${/(submitted|opened|marked|saved)/i.test(warning) ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {warning}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          {!loading && filtered.length === 0 ? (
            <Card className="md:col-span-2">
              <CardHeader eyebrow="No results" title="No opportunities match these filters" />
              <p className="text-sm text-slate-600">Reset filters or broaden the opportunity type, domain, or location.</p>
              <Button variant="secondary" className="mt-4" onClick={clearFilters}>Reset filters</Button>
            </Card>
          ) : null}
          {filtered.map((opportunity, index) => {
            const applicationMethod = getOpportunityApplicationMethod(opportunity);
            const externallyManaged = isExternallyManagedApplication(applicationMethod);
            const externalStatus = externalStatuses[opportunity.id];
            return (
              <Fragment key={opportunity.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge>{opportunity.opportunity_type}</Badge>
                      <ApplicationMethodBadge method={applicationMethod} />
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
                {externallyManaged ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <ExternalLink size={14} />
                    Registration is completed on the organiser&apos;s website.
                  </p>
                ) : null}

                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-primary" />{opportunity.location} / {opportunity.mode}</span>
                  <span className="inline-flex items-center gap-2"><CalendarClock size={16} className="text-primary" />{opportunity.deadline}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {opportunity.tags.map((tag) => <Badge key={tag} tone="slate">{tag}</Badge>)}
                </div>

                <div className="mt-5 flex flex-col items-start gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{opportunity.prize_or_funding}</p>
                    <p className="text-xs text-slate-500">Quality index {opportunity.trust_score}/100</p>
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                    <Link href={`/dashboard/opportunities/${opportunity.id}`}>
                      <Button size="sm" variant="secondary">
                        <ExternalLink size={14} />
                        Details
                      </Button>
                    </Link>
                    {applicationMethod === "idea_workspace_application" ? (
                      <Link href={`/dashboard/opportunities/${opportunity.id}/apply`}>
                        <Button size="sm">
                          Apply with Idea
                        </Button>
                      </Link>
                    ) : applicationMethodUsesInternalForm(applicationMethod) ? (
                      <Link href={`/dashboard/opportunities/${opportunity.id}/register`}>
                        <Button size="sm">Register</Button>
                      </Link>
                    ) : externallyManaged ? (
                      <Button size="sm" onClick={() => setExternalConfirmId(opportunity.id)}>
                        Register
                        <ExternalLink size={14} />
                      </Button>
                    ) : null}
                  </div>
                </div>
                {externallyManaged && externalStatus ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-900">Tracked by You: {externalStatus}</p>
                    {externalStatus !== "Applied Externally" ? (
                      <button type="button" onClick={() => void markExternalApplied(opportunity.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <CheckCircle2 size={13} />
                        Mark as Applied
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </Card>
              {feedPromotion && index === 5 ? <SponsoredCard creative={feedPromotion} placement="opportunity_feed" className="md:col-span-2 xl:hidden" /> : null}
              </Fragment>
            );
          })}
        </div>

        <aside className="space-y-4">
          {sidebarPromotion ? <SponsoredCard creative={sidebarPromotion} placement="opportunity_sidebar" className="hidden xl:block" /> : null}
          <Card>
            <CardHeader eyebrow="Internal applications only" title="Selected Idea Workspace" />
            <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none">
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
              ))}
            </select>
            {!selectedWorkspace ? <p className="mt-3 text-sm leading-6 text-slate-600">No Idea Workspace documents are available for internal applications.</p> : null}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Completion</span>
                <span>{selectedCompletion}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-primary" style={{ width: `${selectedCompletion}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Used only when an opportunity is labelled Apply with Idea Workspace. External registration and hybrid preparation are never blocked by workspace completion.
              </p>
              {selectedBadges.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedBadges.map((badge) => (
                    <Badge key={badge.id} tone="green">
                      <ShieldCheck size={13} />
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  No Human Reviewed badge yet. You can request validation from the Validation Hub before high-stakes applications.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader eyebrow="External registrations" title="Tracked by You" />
            <div className="space-y-3">
              {Object.keys(externalStatuses).length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No organiser-managed registrations tracked yet.</p>
              ) : Object.entries(externalStatuses).map(([id, status]) => {
                const opportunity = opportunities.find((item) => item.id === id);
                return opportunity ? (
                  <div key={id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-950">{opportunity.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{status} / not organiser verified</p>
                  </div>
                ) : null;
              })}
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

      {externalConfirmId && externalConfirmOpportunity ? (
        <ExternalRegistrationDialog
          opportunity={externalConfirmOpportunity}
          onCancel={() => setExternalConfirmId(null)}
          onContinue={(destination) => void continueExternalRegistration(externalConfirmId, destination)}
        />
      ) : null}
    </div>
  );
}
