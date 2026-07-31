import { NextResponse } from "next/server";
import { opportunities } from "@/lib/data";
import { isDemoDataEnabled } from "@/lib/demo-data";
import {
  applicationMethodNeedsExternalUrl,
  defaultApplicationMethodForType,
  validateExternalRegistrationUrl
} from "@/lib/opportunities/application-methods";
import type { ApplicationMethod, OpportunityType } from "@/lib/types";

export async function GET(request: Request) {
  const demoEnabled = isDemoDataEnabled();
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const location = searchParams.get("location");
  const type = searchParams.get("type");

  const filtered = (demoEnabled ? opportunities : []).filter((opportunity) => {
    const matchesDomain = !domain || domain === "All" || opportunity.domain === domain;
    const matchesLocation = !location || location === "All" || opportunity.location === location;
    const matchesType = !type || type === "All" || opportunity.type === type;
    return matchesDomain && matchesLocation && matchesType;
  });

  return NextResponse.json({
    data: filtered,
    meta: { source: demoEnabled ? "explicit-demo" : "database-required" },
    plannedMonetization: {
      postingFeeInr: 100,
      applicationFeeAfterFirst100Inr: 5
    }
  });
}

export async function POST(request: Request) {
  if (!isDemoDataEnabled()) {
    return NextResponse.json({ error: "Opportunity publishing requires an authenticated backend." }, { status: 503 });
  }
  const body = await request.json();
  const opportunityType = (body.opportunity_type ?? body.type ?? "Other") as OpportunityType;
  const applicationMethod = (body.application_method ?? defaultApplicationMethodForType(opportunityType)) as ApplicationMethod;

  if (opportunityType === "Hackathon" && applicationMethod !== "external_registration" && !body.direct_application_partner) {
    return NextResponse.json(
      { error: "HACKATHON_METHOD_REQUIRED", message: "Hackathons require external organiser registration unless a direct application partnership is confirmed." },
      { status: 400 }
    );
  }

  if (applicationMethodNeedsExternalUrl(applicationMethod)) {
    const destination = validateExternalRegistrationUrl(body.external_link);
    if (!destination.valid) {
      return NextResponse.json({ error: "INVALID_EXTERNAL_URL", message: destination.error }, { status: 400 });
    }
    if (!String(body.organizer_name ?? "").trim() || !String(body.deadline ?? "").trim() || !String(body.source_verification ?? "").trim()) {
      return NextResponse.json(
        { error: "MISSING_EXTERNAL_REGISTRATION_FIELDS", message: "Organiser name, registration deadline, and source verification are required." },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    {
      data: {
        id: `opp-${Date.now()}`,
        verified: false,
        applicants: 0,
        ...body,
        opportunity_type: opportunityType,
        application_method: applicationMethod
      },
      billing: {
        amountInr: 100,
        reason: "opportunity_posting_fee"
      }
    },
    { status: 201 }
  );
}
