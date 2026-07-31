import { NextResponse } from "next/server";
import { AuthorizationError, requireProfile } from "@/lib/auth/server";
import { assertConversationParticipant } from "@/lib/messaging/service";
import { createNotification } from "@/lib/notifications/service";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireProfile();
    const { id } = await params;
    await assertConversationParticipant(id, profile.id);

    const supabase = createServiceClient();
    if (!supabase) return NextResponse.json({ error: "Supabase service access is required." }, { status: 503 });
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("conversation_id", id)
      .gte("scheduled_time", new Date().toISOString())
      .order("scheduled_time", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ meetings: data });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Conversation not found or access denied." }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authUserId, profile } = await requireProfile();
    const { id } = await params;
    const conversation = await assertConversationParticipant(id, profile.id);

    const { meetingLink, scheduledTime, notes } = await request.json() as {
      meetingLink?: string;
      scheduledTime?: string;
      notes?: string;
    };
    const parsedTime = scheduledTime ? new Date(scheduledTime) : null;
    if (!meetingLink || !parsedTime || Number.isNaN(parsedTime.getTime())) {
      return NextResponse.json({ error: "A valid meetingLink and scheduledTime are required." }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) return NextResponse.json({ error: "Supabase service access is required." }, { status: 503 });
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        conversation_id: id,
        meeting_link: meetingLink,
        scheduled_time: parsedTime.toISOString(),
        notes: notes?.trim() || null,
        created_by_profile_id: profile.id,
        status: "scheduled"
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const systemMessage = `Meeting scheduled for ${parsedTime.toISOString()}.`;
    await supabase.from("messages").insert({
      conversation_id: id,
      application_id: conversation.application_id,
      sender_id: authUserId,
      sender_profile_id: profile.id,
      message_type: "meeting_link",
      message: systemMessage,
      body: systemMessage,
      metadata: { meetingId: data.id }
    });

    await Promise.all(conversation.recipientProfiles.map((recipient) => createNotification({
      profileId: recipient.id,
      type: "Meeting Scheduled",
      title: "Meeting scheduled",
      body: `A meeting has been scheduled for ${parsedTime.toLocaleString()}`,
      metadata: { conversationId: id, meetingId: data.id },
      sendEmail: true
    })));

    return NextResponse.json({ meeting: data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to schedule this meeting." }, { status: 403 });
  }
}
