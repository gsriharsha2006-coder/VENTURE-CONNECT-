import type { SupabaseClient } from "@supabase/supabase-js";
import { SponsorshipAdmin } from "@/components/ads/SponsorshipAdmin";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/server";

export default async function SponsorshipAdminPage() {
  const { supabase } = await requireRole(["admin"]);
  const db = supabase as unknown as SupabaseClient;
  const { data } = await db.from("ad_campaigns").select("id, campaign_name, status, sponsor:sponsors(organisation_name), ad_events(event_type, profile_id)").order("created_at", { ascending: false });
  const campaigns = (data ?? []).map((campaign) => {
    const sponsor = Array.isArray(campaign.sponsor) ? campaign.sponsor[0] : campaign.sponsor;
    const events = Array.isArray(campaign.ad_events) ? campaign.ad_events : [];
    const count = (type: string) => events.filter((event) => event.event_type === type).length;
    const impressions = count("impression");
    const uniqueImpressions = new Set(events.filter((event) => event.event_type === "impression").map((event) => event.profile_id).filter(Boolean)).size;
    const clicks = count("click");
    return { id: campaign.id, name: campaign.campaign_name, sponsor: sponsor?.organisation_name ?? "Sponsor", status: campaign.status, impressions, uniqueImpressions, clicks, ctr: impressions ? Number((clicks / impressions * 100).toFixed(1)) : 0, applicationStarts: count("apply_started"), applicationCompletions: count("apply_completed"), hides: count("hide"), reports: count("report") };
  });
  return <div className="space-y-6"><PageHeader eyebrow="Internal monetisation" title="Sponsored content" description="Approve relevant ecosystem campaigns and review measured interactions. Sponsorship never changes scores, queue position, or messaging access." /><SponsorshipAdmin initialCampaigns={campaigns} /></div>;
}
