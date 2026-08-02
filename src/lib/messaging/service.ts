import { createServiceClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/service";
import { canInitiateInstitutionConversation } from "@/lib/auth/identity";
export { canSendMessage } from "@/lib/messaging/permissions";

type ConversationParticipant = {
  profile_id: string;
  profile: {
    id: string;
    user_id: string;
    role: string;
  } | null;
};

export async function createConversationForOrganisationAction(applicationId: string, actorProfileId: string, reason: "interested" | "request_information") {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Conversation creation is unavailable because server data services are not configured.");
  }

  const [{ data: application, error: applicationError }, { data: actor, error: actorError }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, founder_id, founder_profile_id, opportunity_id, idea_workspace_id, organisation_id, status")
      .eq("id", applicationId)
      .single(),
    supabase
      .from("profiles")
      .select("id, user_id, role")
      .eq("id", actorProfileId)
      .single()
  ]);

  if (applicationError || !application) throw new Error("Application not found.");
  if (actorError || !actor) throw new Error("Initiating profile not found.");
  if (["draft", "started"].includes(String(application.status).toLowerCase())) {
    throw new Error("Draft applications cannot open organisation conversations.");
  }

  let founderProfileId = application.founder_profile_id as string | null;
  if (!founderProfileId && application.founder_id) {
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", application.founder_id)
      .maybeSingle();
    founderProfileId = founderProfile?.id ?? null;
  }
  if (!founderProfileId) throw new Error("Application founder profile not found.");

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .select("id, created_by, created_by_profile_id, organisation_id, application_method")
    .eq("id", application.opportunity_id)
    .single();

  if (opportunityError || !opportunity) throw new Error("Application opportunity not found.");

  if (opportunity.application_method === "idea_workspace_application") {
    const { data: snapshot } = await supabase.from("application_snapshots").select("id").eq("application_id", applicationId).maybeSingle();
    if (!snapshot) throw new Error("A fixed submitted application snapshot is required before conversation access.");
  }

  let authorisedForApplication = opportunity.created_by_profile_id === actorProfileId;
  if (!authorisedForApplication && opportunity.created_by === actor.user_id) {
    authorisedForApplication = true;
  }
  const organisationId = application.organisation_id ?? opportunity.organisation_id;
  if (!authorisedForApplication && organisationId) {
    const { data: membership } = await supabase
      .from("organisation_members")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("profile_id", actorProfileId)
      .eq("status", "active")
      .in("membership_role", ["owner", "admin"])
      .maybeSingle();
    authorisedForApplication = Boolean(membership);
  }

  if (!canInitiateInstitutionConversation(actor.role, "interested", authorisedForApplication)) {
    throw new Error("Only an authorised investor or institution can mark this application Interested.");
  }

  const applicationStatus = reason === "interested" ? "interested" : "needs_changes";
  const { error: statusError } = await supabase
    .from("applications")
    .update({
      status: applicationStatus,
      decision_by_profile_id: actorProfileId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", applicationId);
  if (statusError) throw statusError;

  if (reason === "interested" && organisationId) {
    const { error: interestedError } = await supabase.from("interested_applications").upsert({
      application_id: applicationId,
      organisation_id: organisationId,
      marked_by_profile_id: actorProfileId
    }, { onConflict: "application_id" });
    if (interestedError) throw interestedError;
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("application_id", applicationId)
    .neq("status", "archived")
    .maybeSingle();

  if (existing) return existing;

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      application_id: applicationId,
      organisation_id: organisationId,
      initiated_by_profile_id: actorProfileId,
      context_type: "application",
      authorization_reason: reason,
      status: "active"
    })
    .select()
    .single();

  if (convError) throw convError;

  const actorMemberRole = actor.role === "investor" ? "investor" : "institution";
  const { error: membersError } = await supabase.from("conversation_members").insert([
    {
      conversation_id: conversation.id,
      profile_id: founderProfileId,
      member_role: "founder",
      status: "active"
    },
    {
      conversation_id: conversation.id,
      profile_id: actorProfileId,
      member_role: actorMemberRole,
      status: "active"
    }
  ]);
  if (membersError) throw membersError;

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    application_id: applicationId,
    sender_id: actor.user_id,
    sender_profile_id: actorProfileId,
    message_type: "system",
    message: reason === "interested" ? "The application was marked Interested. Conversation opened." : "The organisation requested more information. Conversation opened.",
    body: reason === "interested" ? "The application was marked Interested. Conversation opened." : "The organisation requested more information. Conversation opened."
  });

  await createNotification({
    profileId: founderProfileId,
    type: reason === "interested" ? "Investor Interested" : "Information Requested",
    title: reason === "interested" ? "An organisation is interested in your startup" : "An organisation requested more information",
    body: reason === "interested" ? "An organisation reviewed your submission and wants to connect. Messaging is now available." : "Open the new conversation to review the organisation's request and reply.",
    metadata: { conversationId: conversation.id, applicationId },
    sendEmail: true
  });

  return conversation;
}

export function createConversationFromInterest(applicationId: string, actorProfileId: string) {
  return createConversationForOrganisationAction(applicationId, actorProfileId, "interested");
}

export async function assertConversationParticipant(conversationId: string, profileId: string) {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Conversation access is unavailable because server data services are not configured.");
  }

  const [{ data: conversation, error: conversationError }, { data: participants, error: participantError }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, application_id, organisation_id, status")
      .eq("id", conversationId)
      .single(),
    supabase
      .from("conversation_members")
      .select("profile_id, profile:profiles(id, user_id, role)")
      .eq("conversation_id", conversationId)
      .eq("status", "active")
  ]);

  if (conversationError || !conversation) throw new Error("Conversation not found.");
  if (participantError) throw participantError;
  const typedParticipants = (participants ?? []) as unknown as ConversationParticipant[];
  if (!typedParticipants.some((participant) => participant.profile_id === profileId)) {
    throw new Error("Unauthorized conversation access.");
  }

  return {
    ...conversation,
    participants: typedParticipants,
    recipientProfiles: typedParticipants
      .filter((participant) => participant.profile_id !== profileId)
      .map((participant) => participant.profile)
      .filter((profile): profile is NonNullable<ConversationParticipant["profile"]> => Boolean(profile))
  };
}
