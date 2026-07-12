import { NextResponse } from "next/server";
import { assertConversationParticipant } from "@/lib/messaging/service";
import { createNotification } from "@/lib/notifications/service";
import { createServiceClient, getAuthUser } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await assertConversationParticipant(id, user.id);

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ meetings: [], mode: "mock-fallback" });
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("conversation_id", id)
    .gte("scheduled_time", new Date().toISOString())
    .order("scheduled_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meetings: data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await assertConversationParticipant(id, user.id);

  const { meetingLink, scheduledTime, notes } = await request.json();
  if (!meetingLink || !scheduledTime) {
    return NextResponse.json({ error: "meetingLink and scheduledTime required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured. Meeting persistence is running in mock mode." },
      { status: 503 }
    );
  }
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      conversation_id: id,
      meeting_link: meetingLink,
      scheduled_time: scheduledTime,
      notes,
      created_by: user.id,
      status: "scheduled"
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("messages").insert({
    conversation_id: id,
    sender_id: user.id,
    sender_role: (await supabase.from("profiles").select("role").eq("id", user.id).single()).data?.role,
    message_type: "meeting_link",
    message: `Meeting scheduled: ${meetingLink}`,
    attachment_url: meetingLink
  });

  const recipientId = user.id === conversation.founder_id ? conversation.investor_id : conversation.founder_id;
  await createNotification({
    userId: recipientId,
    type: "Meeting Scheduled",
    title: "Meeting scheduled",
    body: `A meeting has been scheduled for ${new Date(scheduledTime).toLocaleString()}`,
    metadata: { conversationId: id, meetingId: data.id },
    sendEmail: true
  });

  return NextResponse.json({ meeting: data }, { status: 201 });
}
