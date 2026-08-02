export type AdPlacement = "dashboard_sidebar" | "opportunity_sidebar" | "opportunity_feed" | "sponsored_opportunity";
export type AdEventType = "impression" | "click" | "hide" | "report" | "apply_started" | "apply_completed";
export type AdCampaignStatus = "draft" | "pending_review" | "approved" | "active" | "paused" | "rejected" | "completed";

export type SponsoredCreative = {
  id: string;
  campaignId: string;
  sponsorName: string;
  sponsorLogoUrl?: string;
  headline: string;
  description: string;
  ctaLabel: "Learn More" | "View Opportunity" | "Apply Now" | "Follow Program";
  ctaUrl: string;
  promotedLabel: "Promoted" | "Sponsored";
  placements: AdPlacement[];
  isDemo?: boolean;
};

export type SponsorCampaignDraft = {
  sponsorId: string;
  campaignName: string;
  campaignType: string;
  placements: AdPlacement[];
  startDate: string;
  endDate: string;
  targetRoles: string[];
  targetColleges: string[];
  targetLocations: string[];
  targetCategories: string[];
  targetSectors: string[];
  headline: string;
  description: string;
  ctaLabel: SponsoredCreative["ctaLabel"];
  ctaUrl: string;
};
