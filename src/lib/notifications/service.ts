import { createServiceClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/types";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
}) {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      id: `notification-${Date.now()}`,
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata ?? {},
      mode: "mock-fallback"
    };
  }
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata ?? {}
    })
    .select()
    .single();

  if (error) throw error;

  if (params.sendEmail && process.env.RESEND_API_KEY) {
    await sendEmailNotification(params.userId, params.title, params.body);
    await supabase.from("notifications").update({ email_sent: true }).eq("id", data.id);
  }

  return data;
}

async function sendEmailNotification(userId: string, title: string, body: string) {
  const supabase = createServiceClient();
  if (!supabase) return;
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single();
  if (!profile?.email) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Venture Connect <noreply@ventureconnect.app>",
      to: profile.email,
      subject: title,
      html: `<p>${body}</p>`
    })
  });
}

export async function auditLog(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createServiceClient();
  if (!supabase) return;
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata: metadata ?? {}
  });
}
