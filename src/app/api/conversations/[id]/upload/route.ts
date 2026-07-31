import { NextResponse } from "next/server";
import { AuthorizationError, requireProfile } from "@/lib/auth/server";
import { assertConversationParticipant } from "@/lib/messaging/service";
import { createNotification } from "@/lib/notifications/service";
import { createServiceClient } from "@/lib/supabase/server";

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
  try {
    const { authUserId, profile } = await requireProfile();
    const { id } = await params;
    const conversation = await assertConversationParticipant(id, profile.id);

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
    if (!supabase) return NextResponse.json({ error: "Supabase service access is required." }, { status: 503 });
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const storagePath = `${id}/${profile.id}/${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("messaging-attachments")
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const messageText = `Shared file: ${file.name}`;
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        application_id: conversation.application_id,
        sender_id: authUserId,
        sender_profile_id: profile.id,
        message_type: "file",
        message: messageText,
        body: messageText
      })
      .select()
      .single();
    if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });

    const { data: attachment, error: attachmentError } = await supabase
      .from("message_attachments")
      .insert({
        message_id: message.id,
        conversation_id: id,
        uploaded_by_profile_id: profile.id,
        storage_bucket: "messaging-attachments",
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size
      })
      .select()
      .single();
    if (attachmentError) return NextResponse.json({ error: attachmentError.message }, { status: 500 });

    await Promise.all(conversation.recipientProfiles.map((recipient) => createNotification({
      profileId: recipient.id,
      type: "Document Uploaded",
      title: "New document uploaded",
      body: `${file.name} was shared in your conversation.`,
      metadata: { conversationId: id, attachmentId: attachment.id },
      sendEmail: true
    })));

    return NextResponse.json({ message, attachment });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to upload this attachment." }, { status: 403 });
  }
}
