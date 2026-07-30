import type { Profile } from "@/lib/types";

type ConversationParticipants = {
  founder_id: string;
  investor_id: string;
};

export function canSendMessage(
  profile: Profile,
  conversation: ConversationParticipants,
  senderId: string
): boolean {
  if (senderId === conversation.investor_id && profile.role === "Investor") return true;
  if (senderId === conversation.founder_id && profile.role === "Founder") return true;
  return false;
}
