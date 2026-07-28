import { opportunities as mockOpportunities } from "@/lib/data";
import { getBrowserSupabase, getCurrentUserId, supabaseDataError } from "@/lib/data/shared";
import { toDatabaseRole, toUserRole } from "@/lib/auth/roles";
import type { DomainTag, Opportunity, OpportunityMode, OpportunityType, StartupStage, UserRole } from "@/lib/types";

function normalizeType(value?: string | null): OpportunityType {
  const fallback: OpportunityType = "Investor opportunity";
  const allowed: OpportunityType[] = [
    "Investor opportunity",
    "Incubator program",
    "Accelerator program",
    "Hackathon",
    "Startup event",
    "Company challenge/debug challenge",
    "Grants",
    "Competitions",
    "Fellowships",
    "AI challenges"
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
  external_link: string | null;
  contact_email: string | null;
}): Opportunity {
  const type = normalizeType(row.opportunity_type);
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
    requirements: ["Complete Idea Workspace document"],
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
    external_link: row.external_link ?? undefined,
    contact_email: row.contact_email ?? undefined,
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
}) {
  const supabase = getBrowserSupabase();
  const userId = await getCurrentUserId("create opportunity");
  if (!supabase || !userId) {
    return {
      id: `opp-${Date.now()}`,
      title: input.title,
      type: input.type,
      deadline: input.deadline,
      mode: "mock-fallback" as const
    };
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      created_by: userId,
      creator_role: toDatabaseRole(input.creatorRole ?? "Investor"),
      title: input.title,
      organizer_name: input.organizerName ?? "Supabase organizer",
      opportunity_type: input.type,
      deadline: input.deadline,
      verified: false
    })
    .select()
    .single();

  if (error || !data) throw supabaseDataError("create opportunity", error ?? "No row returned.");

  return opportunityFromRow(data);
}
