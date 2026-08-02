import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";

const categories = new Set(["hackathon", "incubation", "startup_competition", "debugging_challenge", "workshop", "innovation_event", "startup_event", "cloud_credits", "developer_tools", "ip_services", "company_registration", "student_founder_services"]);
const placements = new Set(["dashboard_sidebar", "opportunity_sidebar", "opportunity_feed", "sponsored_opportunity"]);

function httpsUrl(value: unknown) {
  try { const url = new URL(String(value)); return url.protocol === "https:"; } catch { return false; }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireRole(["admin"]);
    const body = await request.json() as Record<string, unknown>;
    const selectedPlacements = Array.isArray(body.placements) ? body.placements.filter((item): item is string => typeof item === "string") : [];
    if (!String(body.sponsorName ?? "").trim() || !String(body.campaignName ?? "").trim() || !String(body.headline ?? "").trim() || !String(body.description ?? "").trim()) return NextResponse.json({ error: "Sponsor, campaign, headline, and description are required." }, { status: 400 });
    if (!categories.has(String(body.campaignType)) || !selectedPlacements.length || selectedPlacements.some((item) => !placements.has(item))) return NextResponse.json({ error: "Select an allowed campaign category and placement." }, { status: 400 });
    if (!httpsUrl(body.ctaUrl)) return NextResponse.json({ error: "CTA URL must use HTTPS." }, { status: 400 });
    const db = supabase as unknown as SupabaseClient;
    const { data: sponsor, error: sponsorError } = await db.from("sponsors").insert({ organisation_name: String(body.sponsorName).trim(), website: httpsUrl(body.website) ? String(body.website) : null, contact_name: String(body.contactName ?? "") || null, contact_email: String(body.contactEmail ?? "") || null, verified_status: "pending" }).select("id").single();
    if (sponsorError || !sponsor) throw new Error("Sponsor record could not be created.");
    const { data: campaign, error: campaignError } = await db.from("ad_campaigns").insert({ sponsor_id: sponsor.id, campaign_name: String(body.campaignName).trim(), campaign_type: body.campaignType, status: "draft", placements: selectedPlacements, start_date: body.startDate, end_date: body.endDate, target_roles: ["founder"], target_colleges: body.targetColleges ? String(body.targetColleges).split(",").map((item) => item.trim()).filter(Boolean) : [], target_locations: [], target_categories: [], target_sectors: body.targetSectors ? String(body.targetSectors).split(",").map((item) => item.trim()).filter(Boolean) : [], daily_limit: body.dailyLimit ? Number(body.dailyLimit) : null, total_budget: body.totalBudget ? Number(body.totalBudget) : null }).select("id").single();
    if (campaignError || !campaign) throw new Error("Campaign could not be created.");
    const { error: creativeError } = await db.from("ad_creatives").insert({ campaign_id: campaign.id, sponsor_name: String(body.sponsorName).trim(), headline: String(body.headline).trim(), description: String(body.description).trim(), cta_label: String(body.ctaLabel ?? "Learn More"), cta_url: String(body.ctaUrl), logo_url: httpsUrl(body.logoUrl) ? String(body.logoUrl) : null, promoted_label: "Promoted", approved_status: "pending" });
    if (creativeError) throw new Error("Campaign creative could not be created.");
    return NextResponse.json({ campaignId: campaign.id, status: "draft" }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Campaign creation failed." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile, supabase } = await requireRole(["admin"]);
    const body = await request.json() as { campaignId?: string; status?: "pending_review" | "approved" | "active" | "paused" | "rejected" | "completed" };
    if (!body.campaignId || !body.status) return NextResponse.json({ error: "Campaign and status are required." }, { status: 400 });
    const db = supabase as unknown as SupabaseClient;
    const { data: campaign } = await db.from("ad_campaigns").select("id, status, sponsor_id").eq("id", body.campaignId).maybeSingle();
    if (!campaign) throw new AuthorizationError(404, "Campaign not found.");
    if (body.status === "active" && !["approved", "paused"].includes(campaign.status)) return NextResponse.json({ error: "Approve the campaign before activation." }, { status: 409 });
    const update: Record<string, unknown> = { status: body.status };
    if (body.status === "approved") { update.approved_by_profile_id = profile.id; update.approved_at = new Date().toISOString(); }
    const { error } = await db.from("ad_campaigns").update(update).eq("id", body.campaignId);
    if (error) throw new Error("Campaign status could not be updated.");
    if (body.status === "approved") {
      await db.from("sponsors").update({ verified_status: "verified" }).eq("id", campaign.sponsor_id);
      const { error: creativeError } = await db.from("ad_creatives").update({ approved_status: "approved" }).eq("campaign_id", body.campaignId);
      if (creativeError) throw new Error("Campaign was approved, but creative approval failed.");
    }
    return NextResponse.json({ status: body.status });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Campaign update failed." }, { status: 500 });
  }
}
