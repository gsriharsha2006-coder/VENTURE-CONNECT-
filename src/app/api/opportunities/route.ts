import { NextResponse } from "next/server";
import { opportunities } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const location = searchParams.get("location");
  const type = searchParams.get("type");

  const filtered = opportunities.filter((opportunity) => {
    const matchesDomain = !domain || domain === "All" || opportunity.domain === domain;
    const matchesLocation = !location || location === "All" || opportunity.location === location;
    const matchesType = !type || type === "All" || opportunity.type === type;
    return matchesDomain && matchesLocation && matchesType;
  });

  return NextResponse.json({
    data: filtered,
    monetization: {
      postingFeeInr: 100,
      applicationFeeAfterFirst100Inr: 5
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json(
    {
      data: {
        id: `opp-${Date.now()}`,
        verified: false,
        applicants: 0,
        ...body
      },
      billing: {
        amountInr: 100,
        reason: "opportunity_posting_fee"
      }
    },
    { status: 201 }
  );
}
