import { messageThreads as mockMessageThreads } from "@/lib/data";
import { getBrowserSupabase, getCurrentUserId, supabaseDataError } from "@/lib/data/shared";

export async function getMessagesForApplication(applicationId: string) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("list application messages");
  if (!supabase || !userId) return mockMessageThreads.filter((thread) => thread.id === applicationId || !applicationId);

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (error) throw supabaseDataError("list application messages", error);
  return data ?? [];
}

export async function createInterestedConversation(input: {
  applicationId: string;
  receiverId?: string | null;
  body?: string;
  meetingLink?: string;
  meetingTime?: string;
  lockedForFreeUser?: boolean;
}) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("create interested conversation");
  if (!supabase || !userId) {
    return {
      id: `message-${Date.now()}`,
      mode: "mock-fallback" as const,
      body: input.body ?? "Interest-led conversation updated."
    };
  }

  const { error: applicationError } = await supabase
    .from("applications")
    .update({ status: "interested", reviewed_at: new Date().toISOString() })
    .eq("id", input.applicationId);
  if (applicationError) throw supabaseDataError("mark application interested", applicationError);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      application_id: input.applicationId,
      sender_id: userId,
      receiver_id: input.receiverId ?? null,
      body: input.body ?? "Marked Interested. Conversation opened.",
      meeting_link: input.meetingLink ?? null,
      meeting_time: input.meetingTime ?? null,
      is_locked_for_free_user: input.lockedForFreeUser ?? false
    })
    .select()
    .single();

  if (error || !data) throw supabaseDataError("create interested conversation", error ?? "No row returned.");

  return data;
}
