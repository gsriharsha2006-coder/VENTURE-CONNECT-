import { NextResponse } from "next/server";
import { AuthorizationError, requireProfile } from "@/lib/auth/server";
import { PILOT_EVENT_NAMES, type PilotEventName } from "@/lib/pilot/events";
export async function POST(request: Request) {
  try {
    const { profile, supabase } = await requireProfile();
    const body = await request.json() as { eventName?: PilotEventName; metadata?: Record<string, unknown> };
    if (!body.eventName || !PILOT_EVENT_NAMES.includes(body.eventName)) return NextResponse.json({ error: "Unsupported pilot event." }, { status: 400 });
    const metadata = body.metadata && typeof body.metadata === "object" && JSON.stringify(body.metadata).length <= 4000 ? body.metadata : {};
    const { error } = await supabase.from("pilot_events").insert({ profile_id: profile.id, event_name: body.eventName, metadata });
    if (error) return NextResponse.json({ error: "Pilot event could not be recorded." }, { status: 500 });
    return NextResponse.json({ recorded: true }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Pilot event could not be recorded." }, { status: 500 });
  }
}
