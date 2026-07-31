import { messageThreads as mockMessageThreads } from "@/lib/data";
import { backendUnavailableError, getBrowserSupabase, getCurrentUserId, supabaseDataError } from "@/lib/data/shared";
import { isDemoDataEnabled } from "@/lib/demo-data";

export async function getMessagesForApplication(applicationId: string) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("list application messages");
  if (!supabase || !userId) {
    return isDemoDataEnabled()
      ? mockMessageThreads.filter((thread) => thread.id === applicationId || !applicationId)
      : [];
  }

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
    if (!isDemoDataEnabled()) throw backendUnavailableError("Conversation creation");
    return {
      id: `message-${Date.now()}`,
      mode: "mock-fallback" as const,
      body: input.body ?? "Interest-led conversation updated."
    };
  }

  const response = await fetch(`/api/submissions/${encodeURIComponent(input.applicationId)}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "interested" })
  });
  const result = await response.json();
  if (!response.ok) {
    throw supabaseDataError("create interested conversation", result.error ?? `Request failed with ${response.status}.`);
  }
  return result.conversation;
}
