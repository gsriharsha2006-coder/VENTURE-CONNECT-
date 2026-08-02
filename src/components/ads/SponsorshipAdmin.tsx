"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/FeedbackState";

type Campaign = {
  id: string;
  name: string;
  sponsor: string;
  status: string;
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  ctr: number;
  applicationStarts: number;
  applicationCompletions: number;
  hides: number;
  reports: number;
};

const fields = [
  ["sponsorName", "Sponsor name"], ["campaignName", "Campaign name"],
  ["headline", "Headline"], ["ctaUrl", "CTA URL (HTTPS)"],
  ["startDate", "Start date"], ["endDate", "End date"],
  ["targetColleges", "Target colleges (comma separated)"],
  ["targetSectors", "Target sectors (comma separated)"]
] as const;

export function SponsorshipAdmin({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    sponsorName: "", campaignName: "", campaignType: "hackathon", headline: "",
    description: "", ctaLabel: "Learn More", ctaUrl: "",
    placements: ["dashboard_sidebar"], startDate: "", endDate: "",
    targetColleges: "", targetSectors: "", dailyLimit: "", totalBudget: ""
  });

  function set(key: string, value: string | string[]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/sponsorship", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Campaign could not be created.");
      setNotice("Campaign saved as Draft. It is not visible to founders until approval and activation.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Campaign could not be created.");
    } finally { setBusy(false); }
  }

  async function update(campaignId: string, status: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/sponsorship", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId, status }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Campaign could not be updated.");
      setCampaigns((current) => current.map((item) => item.id === campaignId ? { ...item, status } : item));
      setNotice(`Campaign status changed to ${status}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Campaign could not be updated.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}
      <Card>
        <CardHeader eyebrow="Campaign intake" title="Create sponsored content" />
        <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
          {fields.map(([key, label]) => (
            <label key={key}>
              <span className="text-sm font-semibold">{label}</span>
              <input
                required={!key.startsWith("target")}
                type={key.endsWith("Date") ? "date" : key === "ctaUrl" ? "url" : "text"}
                value={String(form[key])}
                onChange={(event) => set(key, event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
          ))}
          <label><span className="text-sm font-semibold">Category</span><select value={form.campaignType} onChange={(event) => set("campaignType", event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"><option value="hackathon">Hackathon</option><option value="incubation">Incubation</option><option value="developer_tools">Developer tools</option><option value="cloud_credits">Cloud credits</option><option value="student_founder_services">Student founder services</option></select></label>
          <label><span className="text-sm font-semibold">Placement</span><select value={form.placements[0]} onChange={(event) => set("placements", [event.target.value])} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3"><option value="dashboard_sidebar">Dashboard sidebar</option><option value="opportunity_sidebar">Opportunity sidebar</option><option value="opportunity_feed">Opportunity feed</option><option value="sponsored_opportunity">Sponsored opportunity</option></select></label>
          <label className="md:col-span-2"><span className="text-sm font-semibold">Short description</span><textarea required rows={3} value={form.description} onChange={(event) => set("description", event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <Button type="submit" disabled={busy} className="md:col-span-2">{busy ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}Save draft campaign</Button>
        </form>
      </Card>
      <Card>
        <CardHeader eyebrow="Approval & analytics" title="Campaigns" />
        <div className="space-y-3">
          {campaigns.length ? campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><Badge tone="slate">{campaign.status}</Badge><h3 className="mt-2 font-semibold">{campaign.name}</h3><p className="text-sm text-slate-500">{campaign.sponsor}</p></div>
                <div className="flex gap-2">
                  {campaign.status === "draft" || campaign.status === "pending_review" ? <Button size="sm" onClick={() => void update(campaign.id, "approved")} disabled={busy}><CheckCircle2 size={15} />Approve</Button> : null}
                  {campaign.status === "approved" || campaign.status === "paused" ? <Button size="sm" onClick={() => void update(campaign.id, "active")} disabled={busy}><Play size={15} />Activate</Button> : null}
                  {campaign.status === "active" ? <Button size="sm" variant="secondary" onClick={() => void update(campaign.id, "paused")} disabled={busy}><Pause size={15} />Pause</Button> : null}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <p className="rounded-md bg-slate-50 p-2">Impressions <strong>{campaign.impressions}</strong></p>
                <p className="rounded-md bg-slate-50 p-2">Unique <strong>{campaign.uniqueImpressions}</strong></p>
                <p className="rounded-md bg-slate-50 p-2">Clicks <strong>{campaign.clicks}</strong></p>
                <p className="rounded-md bg-slate-50 p-2">CTR <strong>{campaign.ctr}%</strong></p>
                <p className="rounded-md bg-slate-50 p-2">Apply starts <strong>{campaign.applicationStarts}</strong></p>
                <p className="rounded-md bg-slate-50 p-2">Completed <strong>{campaign.applicationCompletions}</strong></p>
                <p className="rounded-md bg-slate-50 p-2">Hides <strong>{campaign.hides}</strong></p>
                <p className="rounded-md bg-slate-50 p-2">Reports <strong>{campaign.reports}</strong></p>
              </div>
            </div>
          )) : <p className="text-sm text-slate-600">No campaigns have been created.</p>}
        </div>
      </Card>
    </div>
  );
}
