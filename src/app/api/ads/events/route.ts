import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";
import type { AdEventType, AdPlacement } from "@/lib/ads/types";

const eventTypes: AdEventType[] = ["impression", "click", "hide", "report", "apply_started", "apply_completed"];
const placements: AdPlacement[] = ["dashboard_sidebar", "opportunity_sidebar", "opportunity_feed", "sponsored_opportunity"];

export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireRole(["founder", "investor", "incubator", "hackathon_organizer", "event_organizer", "admin"]);
    const body = await request.json() as { campaignId?: string; creativeId?: string; eventType?: AdEventType; placement?: AdPlacement };
    if (!body.campaignId || !body.eventType || !body.placement || !eventTypes.includes(body.eventType) || !placements.includes(body.placement)) {
      return NextResponse.json({ error: "Invalid sponsored-content event." }, { status: 400 });
    }
    const db = supabase as unknown as SupabaseClient;
    const { data: campaign, error: campaignError } = await db.from("ad_campaigns").select("id, status, start_date, end_date").eq("id", body.campaignId).maybeSingle();
    const today = new Date().toISOString().slice(0, 10);
    if (campaignError || !campaign || campaign.status !== "active" || campaign.start_date > today || campaign.end_date < today) {
      return NextResponse.json({ error: "Sponsored campaign is not active." }, { status: 404 });
    }
    const { error } = await db.from("ad_events").insert({
      campaign_id: body.campaignId,
      creative_id: body.creativeId ?? null,
      profile_id: profile.id,
      event_type: body.eventType,
      page_location: body.placement
    });
    if (error) throw new Error("Sponsored-content event could not be recorded.");

    if (body.eventType === "hide") {
      const { error: hideError } = await db.from("ad_hides").upsert({ campaign_id: body.campaignId, profile_id: profile.id }, { onConflict: "campaign_id,profile_id" });
      if (hideError) throw new Error("Promotion preference could not be saved.");
    }
    if (body.eventType === "report") {
      const { error: reportError } = await db.from("ad_reports").insert({ campaign_id: body.campaignId, profile_id: profile.id, reason: "User reported this promotion" });
      if (reportError) throw new Error("Promotion report could not be saved.");
    }
    return NextResponse.json({ recorded: true });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sponsored-content event failed." }, { status: 500 });
  }
}
