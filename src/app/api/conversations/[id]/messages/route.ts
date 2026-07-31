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
      .from("messages")
      .select("id, conversation_id, sender_profile_id, message_type, message, metadata, created_at, edited_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ messages: data });
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
    if (conversation.status !== "active") {
      return NextResponse.json({ error: "Conversation is not active." }, { status: 409 });
    }

    const body = await request.json() as { message?: string; messageType?: "text" | "meeting_link" };
    const message = body.message?.trim() ?? "";
    if (!message || message.length > 8_000) {
      return NextResponse.json({ error: "Message must contain between 1 and 8000 characters." }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) return NextResponse.json({ error: "Supabase service access is required." }, { status: 503 });
    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        application_id: conversation.application_id,
        sender_id: authUserId,
        sender_profile_id: profile.id,
        message_type: body.messageType ?? "text",
        message,
        body: message
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);

    const founderReply = profile.role.toLowerCase() === "founder";
    await Promise.all(conversation.recipientProfiles.map((recipient) => createNotification({
      profileId: recipient.id,
      type: founderReply ? "Founder Reply" : "New Message",
      title: founderReply ? "Founder replied" : "New message",
      body: message.slice(0, 120),
      metadata: { conversationId: id, messageId: msg.id },
      sendEmail: true
    })));

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to send this message." }, { status: 403 });
  }
}
