import { createServiceClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/service";
import type { Profile } from "@/lib/types";

export async function createConversationFromInterest(submissionId: string, investorId: string) {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      id: `conversation-${Date.now()}`,
      submission_id: submissionId,
      investor_id: investorId,
      mode: "mock-fallback"
    };
  }

  const { data: submission, error } = await supabase
    .from("startup_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (error || !submission) throw new Error("Submission not found");
  if (submission.investor_id !== investorId) throw new Error("Unauthorized");

  await supabase
    .from("startup_submissions")
    .update({ status: "Interested", updated_at: new Date().toISOString() })
    .eq("id", submissionId);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("founder_id", submission.founder_id)
    .eq("investor_id", investorId)
    .eq("startup_idea_id", submission.workspace_id)
    .maybeSingle();

  if (existing) return existing;

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      founder_id: submission.founder_id,
      investor_id: investorId,
      startup_idea_id: submission.workspace_id,
      submission_id: submissionId,
      status: "active"
    })
    .select()
    .single();

  if (convError) throw convError;

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: investorId,
    sender_role: "Investor",
    message_type: "system",
    message: "Investor marked this startup as Interested. Conversation opened."
  });

  await createNotification({
    userId: submission.founder_id,
    type: "Investor Interested",
    title: "An investor is interested in your startup",
    body: "An investor reviewed your submission and wants to connect. Messaging is now available.",
    metadata: { conversationId: conversation.id, submissionId },
    sendEmail: true
  });

  return conversation;
}

export async function assertConversationParticipant(conversationId: string, userId: string) {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      founder_id: userId,
      investor_id: userId,
      status: "active"
    };
  }
  const { data, error } = await supabase
    .from("conversations")
    .select("founder_id, investor_id, status")
    .eq("id", conversationId)
    .single();

  if (error || !data) throw new Error("Conversation not found");
  if (data.founder_id !== userId && data.investor_id !== userId) {
    throw new Error("Unauthorized");
  }
  return data;
}

export function canSendMessage(profile: Profile, conversation: { founder_id: string; investor_id: string }, senderId: string): boolean {
  if (senderId === conversation.investor_id && profile.role === "Investor") return true;
  if (senderId === conversation.founder_id && profile.role === "Founder") return true;
  return false;
}
