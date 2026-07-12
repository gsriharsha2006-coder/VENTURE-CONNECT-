import { NextResponse } from "next/server";
import { assertConversationParticipant, canSendMessage } from "@/lib/messaging/service";
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
  if (!supabase) return NextResponse.json({ messages: [], mode: "mock-fallback" });
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await assertConversationParticipant(id, user.id);

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured. Messaging persistence is running in mock mode." },
      { status: 503 }
    );
  }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !canSendMessage(profile, conversation, user.id)) {
    return NextResponse.json({ error: "Not allowed to send messages" }, { status: 403 });
  }

  const body = await request.json();
  const { message, messageType = "text", attachmentUrl, attachmentName, attachmentMime } = body;

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: user.id,
      sender_role: profile.role,
      message_type: messageType,
      message,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      attachment_mime: attachmentMime
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);

  const recipientId = user.id === conversation.founder_id ? conversation.investor_id : conversation.founder_id;
  const notifType = profile.role === "Founder" ? "Founder Reply" : "New Message";
  await createNotification({
    userId: recipientId,
    type: notifType as "Founder Reply" | "New Message",
    title: profile.role === "Founder" ? "Founder replied" : "New message",
    body: message?.slice(0, 120) || "New attachment shared",
    metadata: { conversationId: id, messageId: msg.id },
    sendEmail: true
  });

  return NextResponse.json({ message: msg }, { status: 201 });
}
