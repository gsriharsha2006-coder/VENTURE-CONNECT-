import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemoDataEnabled } from "@/lib/demo-data";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { AdPlacement, SponsoredCreative } from "@/lib/ads/types";

const demoPromotion: SponsoredCreative = {
  id: "demo-sponsored-creative",
  campaignId: "demo-sponsored-campaign",
  sponsorName: "Demo Founder Infrastructure Program",
  headline: "Cloud credits for student founder prototypes",
  description: "Demonstration placement showing how an approved ecosystem promotion appears. It does not represent a real sponsor or offer.",
  ctaLabel: "Learn More",
  ctaUrl: "https://example.com/venture-connect-demo-promotion",
  promotedLabel: "Promoted",
  placements: ["dashboard_sidebar", "opportunity_sidebar", "opportunity_feed"],
  isDemo: true
};

export async function getSponsoredCreatives(placement: AdPlacement): Promise<SponsoredCreative[]> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return isDemoDataEnabled() && demoPromotion.placements.includes(placement) ? [demoPromotion] : [];
  const db = supabase as unknown as SupabaseClient;
  const today = new Date().toISOString().slice(0, 10);
  const [{ data, error }, { data: hiddenRows }] = await Promise.all([db
    .from("ad_campaigns")
    .select("id, placements, ad_creatives(id, sponsor_name, headline, description, cta_label, cta_url, logo_url, promoted_label)")
    .eq("status", "active")
    .lte("start_date", today)
    .gte("end_date", today)
    .contains("placements", [placement])
    .limit(3), db.from("ad_hides").select("campaign_id")]);
  if (error) throw new Error("Sponsored content could not be loaded.");
  const hiddenCampaigns = new Set((hiddenRows ?? []).map((row) => String(row.campaign_id)));

  return (data ?? []).filter((campaign) => !hiddenCampaigns.has(String(campaign.id))).flatMap((campaign) => {
    const creatives = Array.isArray(campaign.ad_creatives) ? campaign.ad_creatives : [];
    return creatives.map((creative) => ({
      id: String(creative.id),
      campaignId: String(campaign.id),
      sponsorName: String(creative.sponsor_name ?? "Approved sponsor"),
      sponsorLogoUrl: String(creative.logo_url ?? "") || undefined,
      headline: String(creative.headline),
      description: String(creative.description),
      ctaLabel: creative.cta_label as SponsoredCreative["ctaLabel"],
      ctaUrl: String(creative.cta_url),
      promotedLabel: creative.promoted_label as SponsoredCreative["promotedLabel"],
      placements: (campaign.placements ?? []) as AdPlacement[]
    }));
  });
}
