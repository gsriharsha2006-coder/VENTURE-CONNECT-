import { NextResponse } from "next/server";
import { trendingStartups } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    data: trendingStartups,
    meta: {
      includes: ["founder_details", "metrics", "pitch_deck_status", "demo_video", "funding_status"]
    }
  });
}
