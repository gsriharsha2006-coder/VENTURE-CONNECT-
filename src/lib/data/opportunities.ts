import { opportunities as mockOpportunities } from "@/lib/data";
import { getBrowserSupabase, getCurrentUserId, supabaseDataError } from "@/lib/data/shared";
import { toDatabaseRole, toUserRole } from "@/lib/auth/roles";
import {
  applicationMethodNeedsExternalUrl,
  defaultApplicationMethodForType,
  validateExternalRegistrationUrl
} from "@/lib/opportunities/application-methods";
import type { ApplicationMethod, DomainTag, Opportunity, OpportunityMode, OpportunityType, StartupStage, UserRole } from "@/lib/types";

function normalizeType(value?: string | null): OpportunityType {
  const fallback: OpportunityType = "Investor opportunity";
  const allowed: OpportunityType[] = [
    "Investor opportunity",
    "Incubator program",
    "Accelerator program",
    "Hackathon",
    "Startup competition",
    "Workshop",
    "Webinar",
    "Networking event",
    "Startup event",
    "Company challenge/debug challenge",
    "Grants",
    "Competitions",
    "Fellowships",
    "AI challenges",
    "Other"
  ];
  return allowed.includes(value as OpportunityType) ? value as OpportunityType : fallback;
}

function opportunityFromRow(row: {
  id: string;
  created_by: string | null;
  creator_role: string | null;
  title: string | null;
  organizer_name: string | null;
  opportunity_type: string | null;
  category: string | null;
  prize_or_funding: string | null;
  deadline: string | null;
  eligibility: string | null;
  guidelines: string | null;
  tags: string[] | null;
  location: string | null;
  mode: string | null;
  verified: boolean | null;
  trending: boolean | null;
  application_method: string | null;
  external_link: string | null;
  contact_email: string | null;
  organizer_logo: string | null;
  official_website: string | null;
  event_start_date: string | null;
  event_end_date: string | null;
  venue: string | null;
  team_size: string | null;
  tracks: string[] | null;
  registration_fee: string | null;
  required_skills: string[] | null;
  official_rules_url: string | null;
  source_verification: string | null;
  application_instructions: string | null;
  direct_application_partner: boolean | null;
}): Opportunity {
  const type = normalizeType(row.opportunity_type);
  const applicationMethod = (row.application_method as ApplicationMethod | null) ?? defaultApplicationMethodForType(type);
  const domain = ((row.tags ?? []).find((tag) => ["AI", "SaaS", "FinTech", "HealthTech", "EdTech", "DeepTech", "AgriTech", "Consumer", "Social Impact"].includes(tag)) ?? "AI") as DomainTag;

  return {
    id: row.id,
    created_by: row.created_by ?? undefined,
    creator_role: toUserRole(row.creator_role) as Opportunity["creator_role"],
    title: row.title ?? "Untitled opportunity",
    organizer_name: row.organizer_name ?? "Venture Connect partner",
    organizer_type: row.creator_role ?? "Verified organizer",
    opportunity_type: type,
    category: row.category ?? "Fundraising",
    prize_or_funding: row.prize_or_funding ?? "To be announced",
    deadline: row.deadline ?? "Rolling",
    eligibility: row.eligibility ?? "Open to relevant startup teams.",
    guidelines: row.guidelines ?? "Submit a structured application and supporting context.",
    benefits: "Partner review and next-step guidance.",
    requirements: applicationMethod === "idea_workspace_application"
      ? ["Complete Idea Workspace document"]
      : ["Complete registration on the organiser website"],
    tags: row.tags ?? [],
    location: row.location ?? "Remote",
    mode: (row.mode as OpportunityMode) ?? "Remote",
    verified: row.verified ?? false,
    trending: row.trending ?? false,
    beginnerLevel: "Intermediate",
    startupStage: "Any" as StartupStage | "Any",
    domain,
    trust_score: row.verified ? 88 : 62,
    saved: false,
    application_method: applicationMethod,
    external_link: row.external_link ?? undefined,
    contact_email: row.contact_email ?? undefined,
    organizer_logo: row.organizer_logo ?? undefined,
    official_website: row.official_website ?? undefined,
    event_start_date: row.event_start_date ?? undefined,
    event_end_date: row.event_end_date ?? undefined,
    venue: row.venue ?? undefined,
    team_size: row.team_size ?? undefined,
    tracks: row.tracks ?? undefined,
    registration_fee: row.registration_fee ?? undefined,
    required_skills: row.required_skills ?? undefined,
    official_rules_url: row.official_rules_url ?? undefined,
    source_verification: row.source_verification ?? undefined,
    application_instructions: row.application_instructions ?? undefined,
    direct_application_partner: row.direct_application_partner ?? false,
    organization: row.organizer_name ?? undefined,
    type,
    funding: row.prize_or_funding ?? undefined,
    applicants: 0,
    bookmarked: false,
    description: row.guidelines ?? undefined,
    premium: false
  };
}

export async function getOpportunities(): Promise<Opportunity[]> {
  const supabase = getBrowserSupabase();
  if (!supabase) return mockOpportunities;

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw supabaseDataError("list opportunities", error);
  return (data ?? []).map(opportunityFromRow);
}

export async function createOpportunity(input: {
  title: string;
  type: OpportunityType;
  deadline: string;
  organizerName?: string;
  creatorRole?: Exclude<UserRole, "Founder" | "Service Provider" | "Validator">;
  applicationMethod?: ApplicationMethod;
  externalLink?: string;
  sourceVerification?: string;
  officialRulesUrl?: string;
  contactEmail?: string;
  registrationFee?: string;
  applicationInstructions?: string;
  directApplicationPartner?: boolean;
}) {
  const applicationMethod = input.applicationMethod ?? defaultApplicationMethodForType(input.type);
  if (applicationMethodNeedsExternalUrl(applicationMethod)) {
    const externalUrl = validateExternalRegistrationUrl(input.externalLink);
    if (!externalUrl.valid) throw new Error(externalUrl.error);
    if (!input.organizerName?.trim() || !input.sourceVerification?.trim()) {
      throw new Error("External registrations require an organiser name and source verification.");
    }
  }

  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("create opportunity");
  if (!supabase || !userId) {
    return {
      id: `opp-${Date.now()}`,
      title: input.title,
      type: input.type,
      deadline: input.deadline,
      applicationMethod,
      mode: "mock-fallback" as const
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();
  if (profileError || !profile) {
    throw supabaseDataError("resolve opportunity creator profile", profileError ?? "No profile row returned.");
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      created_by: userId,
      created_by_profile_id: profile.id,
      creator_role: toDatabaseRole(profile.role),
      title: input.title,
      organizer_name: input.organizerName ?? "Supabase organizer",
      opportunity_type: input.type,
      application_method: applicationMethod,
      deadline: input.deadline,
      external_link: input.externalLink ?? null,
      source_verification: input.sourceVerification ?? null,
      official_rules_url: input.officialRulesUrl ?? null,
      contact_email: input.contactEmail ?? null,
      registration_fee: input.registrationFee ?? null,
      application_instructions: input.applicationInstructions ?? null,
      direct_application_partner: input.directApplicationPartner ?? false,
      verified: false
    })
    .select()
    .single();

  if (error || !data) throw supabaseDataError("create opportunity", error ?? "No row returned.");

  return opportunityFromRow(data);
}
