import { createServiceClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/types";

export async function createNotification(params: {
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
}) {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Notification delivery is unavailable because server data services are not configured.");
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, email")
    .eq("id", params.profileId)
    .single();
  if (profileError || !profile) throw profileError ?? new Error("Notification recipient profile not found.");

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: profile.user_id,
      profile_id: profile.id,
      type: params.type,
      title: params.title,
      message: params.body,
      body: params.body,
      metadata: params.metadata ?? {}
    })
    .select()
    .single();

  if (error) throw error;

  if (params.sendEmail && process.env.RESEND_API_KEY) {
    await sendEmailNotification(profile.email, params.title, params.body);
    await supabase.from("notifications").update({ email_sent: true }).eq("id", data.id);
  }

  return data;
}

async function sendEmailNotification(email: string | null, title: string, body: string) {
  if (!email) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Venture Connect <noreply@ventureconnect.app>",
      to: email,
      subject: title,
      html: `<p>${body}</p>`
    })
  });
}

export async function auditLog(
  actingAuthUserId: string | null,
  actingProfileId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  organisationId?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createServiceClient();
  if (!supabase) return;
  await supabase.from("audit_logs").insert({
    acting_auth_user_id: actingAuthUserId,
    acting_profile_id: actingProfileId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    organisation_id: organisationId,
    safe_metadata: metadata ?? {}
  });
}
