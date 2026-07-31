import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "LEGACY_MESSAGING_ROUTE",
      message: "Use the participant-scoped /api/conversations endpoints."
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "LEGACY_MESSAGING_ROUTE",
      message: "Caller-supplied roles are not accepted. Use an authenticated conversation endpoint."
    },
    { status: 410 }
  );
}
