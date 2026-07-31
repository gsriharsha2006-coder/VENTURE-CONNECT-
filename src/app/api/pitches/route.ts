import { NextResponse } from "next/server";
import { investors } from "@/lib/data";
import { isDemoDataEnabled } from "@/lib/demo-data";
import type { SubscriptionPlan } from "@/lib/types";

const limits: Record<SubscriptionPlan, number> = {
  Free: 1,
  "Student Pro": 10,
  "Founder Pro": 30
};

export async function POST(request: Request) {
  if (!isDemoDataEnabled()) {
    return NextResponse.json({ error: "Pitch submission requires an authenticated backend." }, { status: 503 });
  }
  const body = (await request.json()) as {
    plan?: SubscriptionPlan;
    pitchesUsed?: number;
    sector?: string;
    stage?: string;
    geography?: string;
    ticketSize?: string;
    thesis?: string;
  };

  const plan = body.plan ?? "Free";
  const limit = limits[plan];
  const pitchesUsed = body.pitchesUsed ?? 0;

  if (pitchesUsed >= limit) {
    return NextResponse.json(
      {
        error: "PITCH_LIMIT_REACHED",
        message: `${plan} users can submit ${limit} investor pitch${limit === 1 ? "" : "es"} per month.`
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      data: {
        id: `pitch-${Date.now()}`,
        status: "submitted",
        matchedInvestors: investors
          .filter((investor) => {
            const sectorMatch = !body.sector || investor.sectors.includes(body.sector);
            const geographyMatch = !body.geography || investor.geography.includes(body.geography);
            return sectorMatch || geographyMatch || !body.thesis;
          })
          .slice(0, 3),
        rules: {
          founderCanInitiateInvestorMessage: false,
          investorCanInitiateFounderMessage: true
        }
      }
    },
    { status: 201 }
  );
}
