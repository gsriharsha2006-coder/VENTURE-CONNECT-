import { NextResponse } from "next/server";
import { trendingStartups } from "@/lib/data";
import { isDemoDataEnabled } from "@/lib/demo-data";

export async function GET() {
  const demoEnabled = isDemoDataEnabled();
  return NextResponse.json({
    data: demoEnabled ? trendingStartups : [],
    meta: {
      source: demoEnabled ? "explicit-demo" : "database-required",
      includes: ["founder_details", "metrics", "pitch_deck_status", "demo_video", "funding_status"]
    }
  });
}
