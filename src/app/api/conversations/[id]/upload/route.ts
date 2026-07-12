import { NextResponse } from "next/server";
import { assertConversationParticipant } from "@/lib/messaging/service";
import { createNotification } from "@/lib/notifications/service";
import { createServiceClient, getAuthUser } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await assertConversationParticipant(id, user.id);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase storage is not configured yet. Persistent uploads remain a TODO." },
      { status: 503 }
    );
  }
  const ext = file.name.split(".").pop();
  const path = `${id}/${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("messaging-attachments")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: signed } = await supabase.storage
    .from("messaging-attachments")
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: user.id,
      sender_role: profile?.role || "Founder",
      message_type: "file",
      message: `Shared file: ${file.name}`,
      attachment_url: signed?.signedUrl,
      attachment_name: file.name,
      attachment_mime: file.type
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recipientId = user.id === conversation.founder_id ? conversation.investor_id : conversation.founder_id;
  await createNotification({
    userId: recipientId,
    type: "Document Uploaded",
    title: "New document uploaded",
    body: `${file.name} was shared in your conversation.`,
    metadata: { conversationId: id },
    sendEmail: true
  });

  return NextResponse.json({ message: msg });
}
