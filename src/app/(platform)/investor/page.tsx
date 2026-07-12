"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Bookmark,
  CheckCircle2,
  FileChartColumn,
  Filter,
  MessageSquarePlus,
  Plus,
  Search,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createOpportunity } from "@/lib/data/opportunities";
import { ideaWorkspaces, investorDashboardStats, investors, opportunities, trendingStartups } from "@/lib/data";
import type { OpportunityType } from "@/lib/types";

const investor = investors[0];
const filters = ["Sector", "Stage", "Location", "Readiness", "Funding ask"];
const opportunityTypes: OpportunityType[] = [
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

function readIds(key: string, fallback: string[]) {
  if (typeof window === "undefined") return fallback;
  try {
    return (JSON.parse(window.localStorage.getItem(key) ?? "null") as string[] | null) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function InvestorPage() {
  const pathname = usePathname();
  const view = pathname === "/investor" ? "discover" : pathname.split("/").filter(Boolean).at(-1) ?? "discover";
  const [selectedId, setSelectedId] = useState(trendingStartups[0].id);
  const [saved, setSaved] = useState<string[]>(["startup-1"]);
  const [interested, setInterested] = useState<string[]>(["startup-1"]);
  const [activity, setActivity] = useState("");
  const [publishedTitle, setPublishedTitle] = useState("AI HealthTech seed review track");
  const [publishedType, setPublishedType] = useState<OpportunityType>("Investor opportunity");
  const [publishedDeadline, setPublishedDeadline] = useState("31 Jul 2026");
  const [publishedPosts, setPublishedPosts] = useState<Array<{ title: string; type: OpportunityType; deadline: string }>>([]);
  const selected = useMemo(() => trendingStartups.find((startup) => startup.id === selectedId) ?? trendingStartups[0], [selectedId]);
  const selectedWorkspace = ideaWorkspaces.find((workspace) => workspace.name.toLowerCase().includes(selected.name.toLowerCase().split(" ")[0])) ?? ideaWorkspaces[0];

  useEffect(() => {
    setSaved(readIds("venture-connect-investor-saved", ["startup-1"]));
    setInterested(readIds("venture-connect-investor-interested", ["startup-1"]));
  }, []);

  function toggleSaved(id: string) {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem("venture-connect-investor-saved", JSON.stringify(next));
      return next;
    });
  }

  function markInterested(id: string) {
    setInterested((current) => {
      const next = current.includes(id) ? current : [...current, id];
      window.localStorage.setItem("venture-connect-investor-interested", JSON.stringify(next));
      return next;
    });
    setActivity(`${selected.name} marked Interested. Application status updated, founder notified, and a message thread created.`);
  }

  function publishOpportunity() {
    if (!publishedTitle.trim() || !publishedDeadline.trim()) {
      setActivity("Add a title and deadline before publishing.");
      return;
    }
    setPublishedPosts((current) => [
      { title: publishedTitle.trim(), type: publishedType, deadline: publishedDeadline.trim() },
      ...current
    ]);
    void createOpportunity({
      title: publishedTitle.trim(),
      type: publishedType,
      deadline: publishedDeadline.trim(),
      organizerName: investor.firm,
      creatorRole: "Investor"
    });
    setActivity("Opportunity submitted for admin approval and queued for founder discovery.");
  }

  const titles: Record<string, [string, string]> = {
    discover: ["Discover structured startup applications", "Review founder documents and VC Readiness evidence before saving or marking interest."],
    saved: ["Saved startups", "Your private review list of startups worth revisiting."],
    interested: ["Interested startups", "Interest updates the application, notifies the founder, and creates a controlled message thread."],
    "post-opportunity": ["Post an opportunity", "Create an opportunity for founders; it becomes visible after admin approval."],
    profile: ["Investor profile", "Maintain the investment thesis and review context founders see."]
  };
  const [title, subtitle] = titles[view] ?? titles.discover;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center"
      >
        <div>
          <Badge>Investor / Organizer</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">{title}</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/investor/messages">
            <Button variant="secondary"><MessageSquarePlus size={16} />Messages</Button>
          </Link>
          <Link href="/investor/post-opportunity">
            <Button><Plus size={16} />Post Opportunity</Button>
          </Link>
        </div>
      </motion.div>

      {activity ? (
        <div className={`rounded-lg border p-4 text-sm ${activity.includes("updated") || activity.includes("approval") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {activity}
        </div>
      ) : null}

      {view === "discover" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {investorDashboardStats.map((stat) => (
              <Card key={stat.label}>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-600">{stat.delta}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="grid gap-3 lg:grid-cols-[1fr_repeat(5,140px)_auto]">
              <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
                <Search size={17} className="text-slate-400" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Search startup, founder, sector..." />
              </label>
              {filters.map((filter) => (
                <select key={filter} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
                  <option>{filter}</option>
                  <option>AI</option>
                  <option>MVP</option>
                  <option>India</option>
                </select>
              ))}
              <Button variant="secondary"><Filter size={16} />Apply</Button>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
            <Card>
              <CardHeader eyebrow="Discover" title="Startup applications" />
              <div className="space-y-3">
                {trendingStartups.map((startup) => (
                  <button
                    key={startup.id}
                    type="button"
                    onClick={() => setSelectedId(startup.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${selectedId === startup.id ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">{startup.logo}</span>
                        <div>
                          <p className="text-sm font-semibold">{startup.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{startup.category} / {startup.stage}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">{startup.readiness}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{selected.stage}</Badge>
                      <Badge tone="slate">{selected.location}</Badge>
                      <Badge tone={selected.readiness >= 80 ? "green" : "amber"}>{selected.readiness} readiness</Badge>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold">{selected.name}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{selected.shortDescription}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[["Funding ask", selected.ask], ["Views", selected.views], ["Traction", selected.traction]].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">{label}</p>
                          <p className="mt-1 text-sm font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={saved.includes(selected.id) ? "primary" : "secondary"} onClick={() => toggleSaved(selected.id)}>
                      <Bookmark size={16} />{saved.includes(selected.id) ? "Saved" : "Save"}
                    </Button>
                    <Button onClick={() => markInterested(selected.id)}>
                      <Star size={16} />{interested.includes(selected.id) ? "Interested" : "Mark Interested"}
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader eyebrow="Idea Workspace Document" title={selectedWorkspace.name} />
                  <div className="space-y-3">
                    {Object.entries(selectedWorkspace.sections).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase text-slate-500">{key.replace(/_/g, " ")}</p>
                        <p className="mt-1 text-sm text-slate-700">{value || "Missing"}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <CardHeader eyebrow="VC Readiness Summary" title="Scorecard" />
                  <div className="space-y-4">
                    {[["Investor readiness", selected.readiness], ["Market potential", Math.min(95, selected.readiness + 3)], ["Product clarity", Math.min(96, selected.readiness + 6)], ["Risk control", Math.max(44, selected.readiness - 14)]].map(([label, value]) => (
                      <div key={label as string}>
                        <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
                          <span>{label as string}</span><span>{value as number}%</span>
                        </div>
                        <ProgressBar value={value as number} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {view === "saved" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trendingStartups.filter((startup) => saved.includes(startup.id)).map((startup) => (
            <Card key={startup.id}>
              <Badge>{startup.category}</Badge>
              <h2 className="mt-3 text-xl font-semibold">{startup.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{startup.shortDescription}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold text-primary">{startup.readiness}/100</span>
                <Button size="sm" variant="secondary" onClick={() => toggleSaved(startup.id)}>Remove</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {view === "interested" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trendingStartups.filter((startup) => interested.includes(startup.id)).map((startup) => (
            <Card key={startup.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="green"><CheckCircle2 size={13} />Interested</Badge>
                  <h2 className="mt-3 text-xl font-semibold">{startup.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">Founder notified. Application status: Interested.</p>
                </div>
                <Bell size={20} className="text-primary" />
              </div>
              <Link href="/investor/messages" className="mt-5 block">
                <Button className="w-full"><MessageSquarePlus size={16} />Open message thread</Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : null}

      {view === "post-opportunity" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader eyebrow="Create" title="Founder-facing opportunity" />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm font-semibold">Title</span>
                <input value={publishedTitle} onChange={(event) => setPublishedTitle(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
              </label>
              <label>
                <span className="text-sm font-semibold">Opportunity type</span>
                <select value={publishedType} onChange={(event) => setPublishedType(event.target.value as OpportunityType)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm">
                  {opportunityTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold">Deadline</span>
                <input value={publishedDeadline} onChange={(event) => setPublishedDeadline(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
              </label>
              {["Category", "Funding / prize / grant", "Eligibility", "Location", "Mode", "Startup stage", "Domain"].map((label) => (
                <label key={label}>
                  <span className="text-sm font-semibold">{label}</span>
                  <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" placeholder={label} />
                </label>
              ))}
              <label className="md:col-span-2">
                <span className="text-sm font-semibold">Guidelines and requirements</span>
                <textarea rows={5} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
              </label>
            </div>
            <Button className="mt-5" onClick={publishOpportunity}><Plus size={16} />Submit for approval</Button>
          </Card>
          <Card>
            <CardHeader eyebrow="Published" title="Opportunity posts" />
            <div className="space-y-3">
              {publishedPosts.map((post, index) => (
                <div key={`${post.title}-${index}`} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <Badge tone="amber">Pending approval</Badge>
                  <p className="mt-2 text-sm font-semibold">{post.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{post.type} / {post.deadline}</p>
                </div>
              ))}
              {opportunities.slice(0, 4).map((opportunity) => (
                <div key={opportunity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <Badge tone="green">Visible</Badge>
                  <p className="mt-2 text-sm font-semibold">{opportunity.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{opportunity.opportunity_type} / {opportunity.deadline}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {view === "profile" ? (
        <Card>
          <CardHeader eyebrow="Profile" title={investor.firm} />
          <div className="grid gap-4 md:grid-cols-2">
            {[["Name", investor.name], ["Designation", investor.designation], ["Firm", investor.firm], ["Ticket size", investor.ticketSize], ["Stage", investor.stage], ["Geography", investor.geography]].map(([label, value]) => (
              <label key={label}>
                <span className="text-sm font-semibold">{label}</span>
                <input defaultValue={value} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none" />
              </label>
            ))}
            <label className="md:col-span-2">
              <span className="text-sm font-semibold">Investment thesis</span>
              <textarea defaultValue={investor.thesis} rows={4} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" />
            </label>
          </div>
          <Button className="mt-5"><FileChartColumn size={16} />Save profile</Button>
        </Card>
      ) : null}
    </div>
  );
}
