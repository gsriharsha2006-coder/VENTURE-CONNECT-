import { NextResponse } from "next/server";
import { validationReports } from "@/lib/data/validations";
import type { ValidationScore } from "@/lib/validation/types";

function hasMandatoryScores(scores: unknown): scores is ValidationScore[] {
  return Array.isArray(scores) &&
    scores.length >= 10 &&
    scores.every((score) =>
      score &&
      typeof score === "object" &&
      "score" in score &&
      "justification" in score &&
      typeof score.justification === "string" &&
      score.justification.trim().length >= 12
    );
}

export async function GET() {
  return NextResponse.json({
    data: validationReports,
    rules: {
      badgeRequiresCompletedReport: true,
      fullReportConfidentialByDefault: true
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    bookingId?: string;
    scores?: unknown;
    strengths?: string[];
    concerns?: string[];
    requiredImprovements?: string[];
    recommendedExperiments?: string[];
    conclusion?: string;
    badgeRecommendation?: string[];
  };

  if (!body.bookingId || !hasMandatoryScores(body.scores)) {
    return NextResponse.json({ error: "INCOMPLETE_REPORT", message: "All score justifications are required before report submission." }, { status: 400 });
  }

  const requiredLists = [body.strengths, body.concerns, body.requiredImprovements, body.recommendedExperiments];
  if (requiredLists.some((list) => !Array.isArray(list) || list.length === 0) || !body.conclusion || body.conclusion.length < 30) {
    return NextResponse.json({ error: "MISSING_REPORT_SECTIONS", message: "Strengths, concerns, improvements, experiments, and conclusion are mandatory." }, { status: 400 });
  }

  return NextResponse.json(
    {
      data: {
        id: `validation-report-${Date.now()}`,
        bookingId: body.bookingId,
        status: "submitted",
        badgeRecommendationEnabled: Boolean(body.badgeRecommendation?.length),
        payoutStatus: "Pending Dispute Window"
      }
    },
    { status: 201 }
  );
}
