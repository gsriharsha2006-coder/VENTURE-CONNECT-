import { NextResponse } from "next/server";
import { AuthorizationError, requireRole } from "@/lib/auth/server";
import { createConversationFromInterest } from "@/lib/messaging/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireRole([
      "investor",
      "incubator",
      "hackathon_organizer",
      "event_organizer",
      "admin"
    ]);
    const { id } = await params;
    const { action } = await request.json() as { action: "interested" | "reject" | "ignore" };
    if (action !== "interested") {
      return NextResponse.json({ status: action });
    }

    const conversation = await createConversationFromInterest(id, profile.id);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
